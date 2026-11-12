# Entidades JPA — InkaQuest API

Mapeo objeto-relacional del backend contra la base de datos de Supabase.

## 1. Resumen

| Elemento | Cantidad |
|---|---|
| Entidades JPA | 121 |
| Enums Java | 38 |
| Repositorios Spring Data | 121 |
| Consultas derivadas | 62 |
| Tablas mapeadas | 121 (100% del esquema) |

**Cobertura total**: cada tabla del esquema `public` tiene su entidad, y cada
entidad tiene su repositorio. La prueba `MapeoEntidadesTest` lo verifica
contra la base real.

## 2. Estructura

```
backend/inkaquest-api/src/main/java/com/inkaquest/
├── InkaQuestApplication.java
├── shared/
│   ├── configuration/       CorsConfig, OpenApiConfig, JpaConfig, CorsProperties
│   ├── security/           SecurityConfig, SecurityProperties, RlsExecutor,
│   │                       RlsContext, RlsContextFactory
│   ├── exception/          GlobalExceptionHandler + excepciones de negocio
│   ├── response/           ApiResponse<T>
│   ├── enums/              38 enums Java (uno por ENUM de PostgreSQL)
│   └── persistence/        (reservado para bases y listeners)
└── modules/
    ├── identidad/          Perfil, SolicitudDocente, Permiso, RolPermiso...
    ├── academico/          Categoria, Curso, Unidad, Modulo, Leccion...
    ├── matriculas/         Matricula, HistorialMatricula, AccesoCurso...
    ├── comercio/           Pedido, Transaccion, Carrito, Reembolso...
    ├── progreso/           ProgresoCurso, ProgresoUnidad, ProgresoLeccion...
    ├── evaluaciones/       Actividad, Evaluacion, Pregunta, Opcion, Entrega...
    ├── retos/              Reto, CasoPrueba, EnvioReto, ResultadoCaso...
    ├── minijuegos/         Motor, Juego, IntentoJuego, ResultadoJuego...
    ├── gamificacion/       Insignia, Racha, Ranking, Mision, Monedero...
    ├── certificados/       Certificado, CertificadoTitular...
    ├── soporte/            Notificacion, Ticket, TicketRespuesta, Mensaje...
    ├── chatbot/            ChatbotConversacion, ChatbotDocumento...
    └── auditoria/          RegistroAccion, EventoSistema, Configuracion...
```

Cada módulo sigue la misma convención:

```
modules/<modulo>/
├── entity/       Una entidad por tabla
└── repository/   Un repositorio por entidad
```

## 3. Mapeo de tipos

| PostgreSQL | Java | Anotación |
|---|---|---|
| `uuid` | `UUID` | `@Id @GeneratedValue(strategy = GenerationType.UUID)` |
| `text` | `String` | `@Column(name = "...")` |
| `varchar(n)` | `String` | `@Column(name = "...")` |
| `integer` | `Integer` | `@Column(name = "...")` |
| `bigint` | `Long` | `@Column(name = "...")` |
| `smallint` | `Short` | `@Column(name = "...")` |
| `boolean` | `Boolean` | `@Column(name = "...")` |
| `numeric(10,2)` | `BigDecimal` | `@Column(precision = 10, scale = 2)` |
| `numeric(5,2)` | `BigDecimal` | `@Column(precision = 5, scale = 2)` |
| `timestamptz` | `Instant` | `@Column(name = "...")` |
| `date` | `LocalDate` | `@Column(name = "...")` |
| `jsonb` | `Map<String, Object>` | `@JdbcTypeCode(SqlTypes.JSON)` |
| `inet` | `String` | `@Column(name = "...")` |
| `bytea` | `byte[]` | `@Column(name = "...")` |
| `vector(1536)` | `String` | `@Column(columnDefinition = "vector(1536)")` |
| ENUM nativo | enum Java | `@JdbcTypeCode(SqlTypes.NAMED_ENUM)` |

### ENUM: detalle importante

Las columnas de estado usan **tipos ENUM nativos** de PostgreSQL
(`estado_curso`, `tipo_contenido`, `estado_pago`...). El mapeo correcto en
Hibernate 6 es:

```java
@JdbcTypeCode(SqlTypes.NAMED_ENUM)
@Column(name = "estado", columnDefinition = "estado_curso", nullable = false)
private EstadoCurso estado;
```

Dos condiciones que deben cumplirse:

1. **Sin `@Enumerated`**. `@Enumerated(EnumType.STRING)` hace que Hibernate
   trate el atributo como texto y envíe un VARCHAR; PostgreSQL rechaza la
   comparación con `operator does not exist: estado_curso = character varying`.
2. **`name()` de la constante Java debe coincidir con la etiqueta de
   PostgreSQL**. Por eso las constantes se generan con la grafía de la base
   (`publicado`, `en_revision`) y no con la convención Java habitual.

La única colisión con una palabra reservada de Java es `boolean` en
`tipo_configuracion`: su constante es `boolean_` y el enum almacena
`"boolean"`.

```java
public enum TipoConfiguracion {
    string("string"),
    number("number"),
    boolean_("boolean"),
    json("json"),
    fecha("fecha");
}
```

### Timestamps de auditoría

Las columnas `creado_en` y `actualizado_en` se gestionan con Hibernate, no
con la base:

```java
@CreationTimestamp
@Column(name = "creado_en", nullable = false)
private Instant creadoEn;

@UpdateTimestamp
@Column(name = "actualizado_en", nullable = false)
private Instant actualizadoEn;
```

La base también tiene sus propios defaults (`now()`), de modo que las
inserciones que no pasan por Hibernate (SQL directo, migraciones) también
quedan correctamente selladas.

## 4. Relaciones

Las claves foráneas se mapean como relaciones `LAZY`:

```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "curso_id", referencedColumnName = "id")
private Curso cursoId;
```

Una FK **UNIQUE** se mapea como `OneToOne` en lugar de `ManyToOne`.

Spring Data exige que el nombre del método derivado coincida con el nombre
del atributo. Como los atributos se nombran a partir de la columna
(`usuario_id` → `usuarioId`), los métodos siguen ese patrón:

```java
Optional<Transaccion> findByUsuarioId(Perfil usuarioId);
```

## 5. Clave primaria compuesta

`rol_permiso` tiene PK `(rol, permiso_id)`. Se declara con `@IdClass`:

```java
@Entity
@IdClass(RolPermisoId.class)
@Table(name = "rol_permiso")
public class RolPermiso implements Serializable {

    @Id
    @Column(name = "rol", nullable = false)
    private String rol;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "permiso_id", referencedColumnName = "id")
    private Permiso permisoId;
}
```

Su repositorio usa `RolPermisoId` como clave:

```java
public interface RolPermisoRepository
        extends JpaRepository<RolPermiso, RolPermisoId> { }
```

## 6. El esquema es de las migraciones, no de Hibernate

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: none
```

Hibernate **nunca** crea ni modifica tablas. Si el mapeo y el esquema
divergen, la aplicación falla al arrancar en lugar de "arreglar" la base por
la fuerza.

La prueba `MapeoEntidadesTest` lo verifica en las tres direcciones:

| Comprobación | Qué garantiza |
|---|---|
| `entidadesCorrespondenATablas` | Toda entidad JPA tiene su tabla en `public` |
| `tablasTienenEntidad` | Toda tabla del dominio tiene su entidad |
| `nombresDeColumnaCoinciden` | Cada columna mapeada existe en PostgreSQL |

## 7. Contexto de autorización (RLS)

Spring Boot se conecta directo a PostgreSQL, así que la RLS no conoce al
usuario. La solución implementada:

```java
// Uso en un servicio
return rlsExecutor.executeAs(usuarioId, () -> repository.findAll());
```

`RlsExecutor` abre una transacción, fija `app.current_user_id` con
`SET LOCAL` y ejecuta la operación. Al confirmar, el contexto desaparece.

```java
@Transactional(propagation = Propagation.REQUIRES_NEW)
public <T> T executeAs(UUID usuarioId, Supplier<T> operacion) {
    RlsContext contexto = contextFactory.create();
    try {
        contexto.setUsuario(usuarioId);
        return operacion.get();
    } catch (SQLException e) {
        throw new IllegalStateException("...", e);
    }
}
```

| Componente | Función |
|---|---|
| `RlsContext` | Fija y limpia `app.current_user_id` en la transacción |
| `RlsContextFactory` | Obtiene la conexión de la transacción en curso |
| `RlsExecutor` | Patrón de uso: ejecutar como usuario o como sistema |

Para operaciones privilegiadas (emitir certificados, procesar webhooks) se
usa `executeAsSystem`, que limpia el contexto y opera con el rol
`service_role` del backend.

Detalle completo en
[INTEGRACION-SPRING-BOOT.md](INTEGRACION-SPRING-BOOT.md).

## 8. Pruebas

```bash
mvn clean verify
```

| Prueba | Qué verifica |
|---|---|
| `InkaQuestApplicationTests` | El contexto de Spring arranca con la base real |
| `MapeoEntidadesTest` | El mapeo JPA coincide con el esquema de PostgreSQL |
| `RepositoriosTest` | Las consultas derivadas funcionan y hay escritura real |

Las tres requieren las variables `DB_URL`, `DB_USERNAME` y `DB_PASSWORD`.

## 9. Regenerar el mapeo

El mapeo se genera a partir del esquema real, no se escribe a mano:

```bash
# 1. Extraer el esquema de la base
node scripts/generar-jpa.mjs

# 2. Regenerar entidades, enums y repositorios
bash scripts/regenerar-jpa.sh
```

Si se añade una tabla nueva:

1. Escribir la migración SQL en `supabase/migrations/`.
2. Aplicarla: `supabase db push --remote`.
3. Regenerar el mapeo.
4. `mvn clean verify` para confirmar que el mapeo sigue cuadrando.
