package com.inkaquest;

import jakarta.persistence.Column;
import jakarta.persistence.EntityManager;
import jakarta.persistence.metamodel.Attribute;
import jakarta.persistence.metamodel.EntityType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifica que el mapeo JPA coincide con el esquema real de PostgreSQL.
 *
 * <p>Se comprueba que:
 * <ol>
 *   <li>Toda entidad mapeada existe como tabla en {@code public}.</li>
 *   <li>Toda tabla del dominio tiene su entidad.</li>
 *   <li>Los nombres de columna coinciden exactamente.</li>
 * </ol>
 *
 * <p>Requiere la base de datos configurada en el perfil {@code local}.
 */
@SpringBootTest
@ActiveProfiles("local")
class MapeoEntidadesTest {

    /** Tablas de infraestructura de Supabase que no forman parte del dominio. */
    private static final Set<String> EXCLUIDAS = Set.of(
            "spatial_ref_sys", "sheets", "subscriptions", "identities", "sessions",
            "one_time_tokens", "email_tokens", "magiclink_tokens", "confirmation_tokens",
            "user_identities", "key_value", "audit_log_replica", "flow_state",
            "refresh_tokens", "inbucket", "templates", "buckets", "objects",
            "bucket_objects", "s3_multipart_uploads", "s3_multipart_uploads_parts",
            "buckets_analytics", "buckets_vectors", "vector_indexes", "messages",
            "push_tokens", "schema_migrations");

    @Autowired
    private EntityManager entityManager;

    /** Ejecuta una consulta nativa y devuelve la primera columna como texto. */
    private List<String> consultar(String sql, Object... parametros) {
        var query = entityManager.createNativeQuery(sql);
        for (int i = 0; i < parametros.length; i++) {
            query.setParameter(i + 1, parametros[i]);
        }
        List<String> resultado = new ArrayList<>();
        for (Object fila : query.getResultList()) {
            resultado.add(String.valueOf(fila).toLowerCase(Locale.ROOT));
        }
        return resultado;
    }

    private Set<String> nombresDeEntidad() {
        return entityManager.getMetamodel().getEntities().stream()
                .map(MapeoEntidadesTest::tablaDe)
                .collect(Collectors.toSet());
    }

    /**
     * Nombre real de la tabla de una entidad, segun la anotacion @Table.
     * Es el dato que debe coincidir con PostgreSQL (el nombre de la clase Java
     * puede diferir: ProgresoUnidad -&gt; progreso_unidad).
     */
    private static String tablaDe(EntityType<?> tipo) {
        jakarta.persistence.Table tabla = tipo.getJavaType()
                .getAnnotation(jakarta.persistence.Table.class);
        return tabla != null ? tabla.name().toLowerCase(Locale.ROOT)
                : tipo.getName().toLowerCase(Locale.ROOT);
    }

    @Test
    @DisplayName("Todas las entidades JPA corresponden a tablas existentes")
    @Transactional
    void entidadesCorrespondenATablas() {
        Set<String> entidades = nombresDeEntidad();
        assertThat(entidades)
                .as("Debe haber al menos 120 entidades mapeadas")
                .hasSizeGreaterThanOrEqualTo(120);

        Set<String> existentes = Set.copyOf(consultar(
                "select table_name from information_schema.tables "
                + "where table_schema = 'public' and table_type = 'BASE TABLE'"));

        List<String> huerfanas = entidades.stream()
                .filter(t -> !existentes.contains(t))
                .toList();

        assertThat(huerfanas)
                .as("Entidades JPA sin tabla en PostgreSQL")
                .isEmpty();
    }

    @Test
    @DisplayName("Toda tabla del dominio tiene entidad JPA")
    @Transactional
    void tablasTienenEntidad() {
        Set<String> entidades = nombresDeEntidad();

        Set<String> tablas = Set.copyOf(consultar(
                "select table_name from information_schema.tables "
                + "where table_schema = 'public' and table_type = 'BASE TABLE'"));

        List<String> sinEntidad = tablas.stream()
                .filter(t -> !entidades.contains(t))
                .filter(t -> !EXCLUIDAS.contains(t))
                .toList();

        assertThat(sinEntidad)
                .as("Tablas del dominio sin entidad JPA mapeada")
                .isEmpty();
    }

    @Test
    @DisplayName("Los nombres de columna coinciden con PostgreSQL")
    @Transactional
    void nombresDeColumnaCoinciden() {
        for (EntityType<?> tipo : entityManager.getMetamodel().getEntities()) {
            String tabla = tablaDe(tipo);

            Set<String> columnasReales = Set.copyOf(consultar(
                    "select column_name from information_schema.columns "
                    + "where table_schema = 'public' and table_name = ?", tabla));

            assertThat(columnasReales)
                    .as("La tabla %s debe existir en PostgreSQL", tabla)
                    .isNotEmpty();

            Set<String> columnasMapeadas = new java.util.LinkedHashSet<>();
            for (Attribute<?, ?> atributo : tipo.getAttributes()) {
                if (atributo.getJavaType() == byte[].class) {
                    continue;   // el tipo blob se mapea aparte
                }
                if (atributo.isCollection()
                        || atributo.getJavaType().isArray()) {
                    continue;   // las colecciones no son columnas fisicas
                }
                columnasMapeadas.add(nombreDeColumna(tipo, atributo));
            }

            List<String> inexistentes = columnasMapeadas.stream()
                    .filter(c -> !columnasReales.contains(c))
                    .toList();

            assertThat(inexistentes)
                    .as("Columnas mapeadas en %s que no existen en PostgreSQL", tabla)
                    .isEmpty();
        }
    }

    /** Obtiene el nombre de la columna a partir de la anotacion @Column. */
    private String nombreDeColumna(EntityType<?> tipo, Attribute<?, ?> atributo) {
        try {
            Field campo = tipo.getJavaType().getDeclaredField(atributo.getName());
            Column anotacion = campo.getAnnotation(Column.class);
            if (anotacion != null && !anotacion.name().isEmpty()) {
                return anotacion.name().toLowerCase(Locale.ROOT);
            }
            // Sin @Column explicito: el atributo es una relacion. El nombre de
            // la columna se deriva del atributo de la entidad relacionada
            // ('emitidoPor' -> 'emitido_por', 'usuarioId' -> 'usuario_id').
            String relacionado = nombreDeRelacion(tipo, atributo);
            if (relacionado != null) {
                return relacionado.toLowerCase(Locale.ROOT);
            }
            return atributo.getName().toLowerCase(Locale.ROOT);
        } catch (NoSuchFieldException e) {
            return atributo.getName().toLowerCase(Locale.ROOT);
        }
    }

    /**
     * Nombre de la columna FK de un atributo que es una relacion.
     * Se deduce del nombre de la entidad relacionada (la tabla referenciada
     * mas el nombre de la columna FK, que en este esquema coincide con el
     * nombre de la entidad en minusculas con guiones bajos).
     */
    private String nombreDeRelacion(EntityType<?> tipo, Attribute<?, ?> atributo) {
        try {
            Field campo = tipo.getJavaType().getDeclaredField(atributo.getName());
            jakarta.persistence.JoinColumn join = campo.getAnnotation(
                    jakarta.persistence.JoinColumn.class);
            if (join != null && !join.name().isEmpty()) {
                return join.name();
            }
        } catch (NoSuchFieldException e) {
            return null;
        }
        return null;
    }
}
