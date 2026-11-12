package com.inkaquest;

import com.inkaquest.modules.academico.entity.Categoria;
import com.inkaquest.modules.academico.repository.CategoriaRepository;
import com.inkaquest.modules.academico.repository.CursoRepository;
import com.inkaquest.modules.certificados.repository.CertificadoRepository;
import com.inkaquest.modules.gamificacion.repository.ReglaProgresionRepository;
import com.inkaquest.shared.enums.EstadoCurso;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Comprueba que los repositorios funcionan contra la base de datos real.
 *
 * <p>Verifica que las consultas derivadas de Spring Data se construyen
 * correctamente y que los repositorios devuelven datos. Es la prueba de que
 * el mapeo objeto-relacional esta bien, no solo de que compila.</p>
 *
 * <p>La base esta en su estado inicial: contiene los datos de referencia
 * (permisos, reglas de progresion, eventos) pero ningun curso ni categoria,
 * porque todavia no se ha cargado contenido.</p>
 */
@SpringBootTest
@ActiveProfiles("local")
class RepositoriosTest {

    @Autowired
    private CategoriaRepository categoriaRepository;

    @Autowired
    private CursoRepository cursoRepository;

    @Autowired
    private CertificadoRepository certificadoRepository;

    @Autowired
    private ReglaProgresionRepository reglaProgresionRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    @DisplayName("Las consultas derivadas funcionan contra la base de datos")
    @Transactional
    void consultasDerivadasFuncionan() {
        // findBySlug: columna de texto directo
        assertThat(categoriaRepository.findBySlug("__inexistente__")).isEmpty();

        // findByEstado: columna con ENUM NATIVO de PostgreSQL. El binding del
        // enum es la parte mas delicada del mapeo: si falla, PostgreSQL
        // responderia "operator does not exist".
        assertThat(cursoRepository.findByEstado(EstadoCurso.publicado))
                .as("Debe haber cursos publicados (semillados por el script de catalogo)")
                .isNotEmpty();

        // findByCodigo: columna de texto unico
        assertThat(certificadoRepository.findByCodigo("__inexistente__")).isEmpty();

        // Repositorio de una tabla con datos de referencia
        assertThat(reglaProgresionRepository.count()).isGreaterThan(0);
    }

    @Test
    @DisplayName("Los datos de referencia estan cargados")
    @Transactional
    void datosDeReferenciaCargados() {
        Long permisos = (Long) entityManager.createNativeQuery(
                        "select count(*) from public.permiso").getSingleResult();
        assertThat(permisos).as("permisos del sistema").isGreaterThan(0);

        Long reglas = (Long) entityManager.createNativeQuery(
                        "select count(*) from public.regla_progresion").getSingleResult();
        assertThat(reglas).as("reglas de progresion").isGreaterThan(0);

        Long eventos = (Long) entityManager.createNativeQuery(
                        "select count(*) from public.evento_sistema").getSingleResult();
        assertThat(eventos).as("eventos de auditoria").isGreaterThan(0);
    }

    @Test
    @DisplayName("Las entidades se pueden leer y escribir en una transaccion")
    @Transactional
    void escrituraYLectura() {
        Categoria categoria = new Categoria();
        categoria.setNombre("Categoria de prueba");
        categoria.setSlug("categoria-de-prueba");
        categoria.setOrden(999);
        categoria.setActivo(true);

        categoriaRepository.saveAndFlush(categoria);

        Categoria leida = categoriaRepository.findBySlug("categoria-de-prueba").orElseThrow();
        assertThat(leida.getNombre()).isEqualTo("Categoria de prueba");
        assertThat(leida.getCreadoEn())
                .as("creado_en se genera automaticamente")
                .isNotNull();
    }
}
