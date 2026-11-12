# Integración con Spring Boot — InkaQuest

Cómo el backend Java 25 / Spring Boot 3.5 se integra con esta base de datos.

## 1. Principio fundamental

> **Spring Boot se conecta DIRECTAMENTE a PostgreSQL.** No pasa por PostgREST,
> por lo que PostgreSQL **no conoce al usuario autenticado** de forma
> automática: `auth.uid()` devuelve NULL en una conexión directa.

Si las políticas RLS solo usaran `auth.uid()`, el backend vería **cero filas**:
el sistema parecería vacío. Este documento explica la estrategia que resuelve
ese problema de forma segura.

## 2. Estrategia: contexto de transacción

### 2.1 El mecanismo

PostgreSQL permite definir variables de sesión personalizadas. El backend las
establece **dentro de una transacción** y las políticas las leen:

```sql
BEGIN;
SET LOCAL app.current_user_id = 'a3f1c2e4-...';
-- A partir de aquí, las políticas RLS ven a ese usuario.
SELECT * FROM public.matricula;   -- devuelve sus matrículas
COMMIT;                            -- el contexto desaparece automáticamente
```

`SET LOCAL` (tercer parámetro `true`) es **transaction-local**: el valor se
descarta al terminar la transacción. Es la clave para que el contexto de un
usuario no se filtre a la siguiente petición.

### 2.2 Por qué el rol NO viaja en la variable

Podríamos enviar `app.current_user_rol`, pero sería **falsificable**: cualquiera
con permiso `SET` podría escribir `app.current_user_rol = 'administrador'` y
obtener todos los permisos.

Por eso el rol se lee de la base:

```sql
create or replace function public.app_user_role()
returns public.rol_usuario
language plpgsql stable security definer set search_path = ''
as $$
declare v_user uuid; v_role public.rol_usuario;
begin
    v_user := public.app_user_id();
    if v_user is null then return null; end if;
    select pr.rol into v_role from public.perfil pr where pr.id = v_user;
    return v_role;
end;
$$;
```

**El rol efectivo es siempre el que el usuario tiene en `public.perfil`.**
 Aunque alguien manipule la variable, no puede convertirse en administrador.

### 2.3 Protección del permiso SET

```sql
revoke set on parameter app.current_user_id from public;
revoke set on parameter app.current_user_email from public;
revoke set on parameter app.current_user_rol from public;

grant set on parameter app.current_user_id to inkaquest_api;
```

Con esto, ni `anon` ni `authenticated` pueden **establecer** el contexto: solo
el rol dedicado del backend.

> `GRANT SET ON PARAMETER` requiere **PostgreSQL 15+**. Supabase usa 15 o
> superior, por lo que está disponible.

### 2.4 El rol del backend

```sql
create role inkaquest_api nologin;
grant usage on schema public to inkaquest_api;
grant select, insert, update, delete on all tables in schema public to inkaquest_api;
grant execute on all functions in schema public to inkaquest_api;
revoke create on schema public from inkaquest_api;
```

**No es superusuario**: no puede alterar el esquema, modificar políticas ni
saltarse la RLS. Solo puede operar datos.

## 3. Aplicación en Spring Boot

### 3.1 Configuración

```yaml
spring:
  datasource:
    url: ${DB_URL:jdbc:postgresql://localhost:5432/inkaquest}
    username: ${DB_USERNAME:inkaquest_api}
    password: ${DB_PASSWORD:}
    driver-class-name: org.postgresql.Driver
  jpa:
    hibernate:
      ddl-auto: none          # NUNCA 'update' ni 'create'
    open-in-view: false
```

`ddl-auto: none` es **obligatorio**: las migraciones SQL son la fuente de
verdad del esquema.

### 3.2 Dependencia

```xml
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
    <scope>runtime</scope>
</dependency>
```

No hace falta ningún driver adicional: el `SET LOCAL` es SQL estándar.

### 3.3 Establecer el contexto por petición

Spring Boot 3.x usa `TransactionTemplate` o `Connection` directamente. La forma
más limpia es un filtro que establezca el contexto y una capa de servicio que
lo use dentro de transacciones.

```java
@Component
public class RlsContextFilter extends OncePerRequestFilter {

    private final DataSource dataSource;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String userId = Optional.ofNullable(request.getHeader("X-User-Id"))
                .filter(s -> !s.isBlank())
                .orElse(null);

        if (userId != null) {
            // SET LOCAL solo es valido dentro de una transaccion.
            try (Connection connection = dataSource.getConnection()) {
                connection.setAutoCommit(false);
                try (Statement st = connection.createStatement()) {
                    st.execute("select set_config('app.current_user_id', "
                              + "'" + userId.replace("'", "") + "', true)");
                }
                connection.commit();
            }
        }
        chain.doFilter(request, response);
    }
}
```

> **Advertencia importante:** `SET LOCAL` sin una transacción abierta lanza
> error. Por eso el patrón correcto es ejecutar la operación **dentro** de una
> transacción y establecer el contexto en ella.

### 3.4 El patrón recomendado: `TransactionTemplate`

```java
@Service
public class RlsExecutor {

    private final TransactionTemplate txTemplate;
    private final DataSource dataSource;

    public RlsExecutor(PlatformTransactionManager tm, DataSource dataSource) {
        this.txTemplate = new TransactionTemplate(tm);
        this.txTemplate.setIsolationLevel(TransactionDefinition.ISOLATION_READ_COMMITTED);
        this.dataSource = dataSource;
    }

    /**
     * Ejecuta la operacion dentro del contexto de autorización del usuario.
     */
    public <T> T executeAsUser(UUID userId, Supplier<T> operation) {
        return txTemplate.execute(status -> {
            setContext(userId);
            return operation.get();
        });
    }

    private void setContext(UUID userId) {
        try (Connection connection = DataSourceUtils.getConnection(dataSource);
             PreparedStatement ps = connection.prepareStatement(
                     "select set_config('app.current_user_id', ?, true)")) {
            ps.setString(1, userId.toString());
            ps.execute();
        }
    }
}
```

Uso en un servicio:

```java
@Service
@RequiredArgsConstructor
public class MatriculaService {

    private final MatriculaRepository repository;
    private final RlsExecutor rls;

    @Transactional(readOnly = true)
    public List<Matricula> listar(UUID usuarioId) {
        return rls.executeAsUser(usuarioId, () -> repository.findAll());
    }
}
```

### 3.5 Alternativa: función de contexto

La base ofrece un helper que encapsula el `SET`:

```sql
create or replace function public.fn_contexto_usuario(p_usuario_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
    perform set_config('app.current_user_id', p_usuario_id::text, true);
    perform set_config('app.current_user_email', '', true);
end;
$$;
```

```java
jdbcTemplate.execute(
    "select public.fn_contexto_usuario(?)", userId);
```

Ventaja: la lógica del `SET` vive en la base y es idéntica para todos los
servicios.

## 4. Validación del JWT de Supabase

El backend valida el token **antes** de tocar la base:

```
Authorization: Bearer <JWT de Supabase Auth>
        │
        ▼
  JwtDecoder (Nimbus, con la clave pública del JWKS de Supabase)
        │
        ├─ firma válida ─► subject (user_id de auth.users)
        ├─ emisor válido ─► https://<ref>.supabase.co/auth/v1
        └─ no expirado
        │
        ▼
  SecurityContext con el UUID del usuario
        │
        ▼
  SET LOCAL app.current_user_id = <uuid>  (dentro de la transacción)
```

Configuración de Spring Security:

```java
@Bean
JwtDecoder jwtDecoder(@Value("${supabase.jwk-set-uri}") String jwkSetUri) {
    NimbusJwtDecoder decoder = NimbusJwtDecoder
            .withJwkSetUri(jwkSetUri)
            .jwtProcessorCustomizer(jwt -> jwt.setJwsAlgorithm(SignatureAlgorithm.RS256))
            .build();
    decoder.setJwtValidator(JwtValidators.createDefaultWithIssuer(jwkSetUri.replace("/.well-known/jwks.json", "")));
    return decoder;
}
```

El `sub` del JWT es **exactamente** `perfil.id`, por lo que el UUID que se
inyecta en el contexto es el mismo que usa las políticas.

## 5. Mapeo JPA

### 5.1 Correspondencia de entidades

| Tabla | Entidad JPA | Notas |
|---|---|---|
| `perfil` | `Perfil` | `@Id` = UUID de `auth.users` |
| `curso` | `Curso` | `@Enumerated(EnumType.STRING)` para `estado` |
| `unidad`, `modulo`, `leccion` | `Unidad`, `Modulo`, `Leccion` | Jerarquía con `@ManyToOne` |
| `matricula` | `Matricula` | `enum EstadoMatricula` mapeado al ENUM |
| `progreso_curso` / `_unidad` / `_leccion` | `ProgresoCurso`, … | Clave compuesta en los hijos |
| `transaccion` | `Transaccion` | `monto` como `BigDecimal` |
| `evaluacion`, `pregunta`, `opcion` | `Evaluacion`, `Pregunta`, `Opcion` | `opcion.esCorrecta` es un campo **sensible** |
| `motor`, `version_motor`, `juego` | `Motor`, `VersionMotor`, `Juego` | `configuracion` como `Map<String,Object>` |
| `insignia`, `insignia_usuario` | `Insignia`, `InsigniaUsuario` | `@ManyToMany` con tabla de unión |

### 5.2 Tipos

| Columna SQL | Tipo Java | Nota |
|---|---|---|
| `uuid` | `UUID` | — |
| `timestamptz` | `Instant` | `spring.jpa.properties.hibernate.jdbc.time_zone: UTC` |
| `numeric(10,2)` | `BigDecimal` | **Nunca `double`** para dinero |
| `text` | `String` | — |
| `boolean` | `Boolean` / `boolean` | — |
| `jsonb` | `Map<String, Object>` | Con `@JdbcTypeCode(SqlTypes.JSON)` |
| ENUM de Postgres | enum de Java | `@Enumerated(EnumType.STRING)` |

### 5.3 Relaciones

```java
@Entity
@Table(name = "matricula")
public class Matricula {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)   // gen_random_uuid()
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estudiante_id", nullable = false)
    private Perfil estudiante;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "curso_id", nullable = false)
    private Curso curso;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false)
    private EstadoMatricula estado;

    @Column(name = "precio_pagado", nullable = false, precision = 10, scale = 2)
    private BigDecimal precioPagado;

    @Column(name = "porcentaje_progreso", nullable = false, precision = 5, scale = 2)
    private BigDecimal porcentajeProgreso;
}
```

**Los ENUM de Java deben coincidir exactamente con los de Postgres** (valores y
orden no importa, los valores sí).

### 5.4 Claves compuestas

```java
@Embeddable
public class ProgresoLeccionId implements Serializable {
    @Column(name = "progreso_curso_id")
    private UUID progresoCursoId;

    @Column(name = "leccion_id")
    private UUID leccionId;
    // equals() y hashCode() implementados
}
```

```java
@Entity
@Table(name = "progreso_leccion")
@IdClass(ProgresoLeccionId.class)
public class ProgresoLeccion { /* ... */ }
```

## 6. Operaciones privilegiadas

Algunas operaciones **no** pueden hacerse con el contexto de un usuario
porqueViolan la RLS por diseño:

| Operación | Rol a usar | Motivo |
|---|---|---|
| Emitir un certificado | `service_role` | Se crea desde el backend sin usuario |
| Procesar un webhook de pago | `service_role` | Es una llamada del proveedor |
| Registrar una auditoría del sistema | `service_role` | Sin actor de usuario |
| Recalcular progreso masivo | `service_role` | Tarea de sistema |
| Otorgar insignia por regla | `service_role` o `fn_otorgar_insignia` | Función de negocio |

```java
@Service
public class CertificadoService {

    /** Usa service_role: la emision no pertenece a un usuario concreto. */
    public UUID emitir(UUID cursoId, UUID estudianteId) {
        return serviceRoleJdbcTemplate.queryForObject(
            "select public.fn_emitir_certificado(?, ?)",
            UUID.class, cursoId, estudianteId);
    }
}
```

> `service_role` **solo** debe usarse desde el servidor. Nunca debe llegar al
> bundle de Angular.

### 6.1 Operaciones con contexto de usuario

| Operación | Contexto |
|---|---|
| Listar matrículas del usuario | `app.current_user_id` = el usuario |
| Completar una lección | `app.current_user_id` = el usuario |
| Enviar un reto | `app.current_user_id` = el usuario |
| Calificar (docente) | `app.current_user_id` = el docente |

## 7. Transacciones

| Regla | Motivo |
|---|---|
| Toda operación con datos de usuario va dentro de una transacción | `SET LOCAL` lo exige |
| El contexto se establece **después** de abrir la transacción | Orden correcto |
| No usar `readOnly = true` con escrituras | Las políticas de escritura fallarían |
| `@Transactional` en el servicio, no en el repositorio | La transacción es el límite de negocio |
| Las operaciones de pago usan `Propagation.REQUIRES_NEW` | El trigger de activación debe ver la transacción |

### 7.1 El caso del pago

```java
@Transactional(propagation = Propagation.REQUIRES_NEW)
public void registrarPagoCapturado(UUID transaccionId) {
    // El trigger trg_activar_matricula_tras_pago se dispara aqui
    // y activa las matriculas del pedido dentro de la misma transaccion.
    jdbcTemplate.update("update public.transaccion set estado = 'capturado' where id = ?",
                         transaccionId);
}
```

La captura y la activación de la matrícula ocurren en la **misma**
transacción: o ambas se confirman o ninguna.

## 8. Configuración de la aplicación

```yaml
supabase:
  url: ${SUPABASE_URL:}
  jwt-secret: ${SUPABASE_JWT_SECRET:}
  jwk-set-uri: ${SUPABASE_URL}/auth/v1/.well-known/jwks.json
```

```yaml
spring:
  jpa:
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        jdbc:
          time_zone: UTC
```

## 9. Checklist de integración

- [ ] `ddl-auto: none` — Hibernate nunca genera el esquema.
- [ ] El rol de la base de datos **no** es superusuario.
- [ ] `SET LOCAL` se ejecuta **dentro** de una transacción.
- [ ] El contexto se establece a partir del `sub` del JWT validado.
- [ ] El rol se lee de `public.perfil` (no se envía desde el cliente).
- [ ] `service_role` solo en el servidor, nunca en Angular.
- [ ] Los ENUM de Java coinciden con los de Postgres.
- [ ] El dinero se mapea como `BigDecimal`.
- [ ] Las operaciones de pago usan la transacción correcta.
- [ ] Se verificó con `public.fn_validar_contexto_backend()`.

## 10. Diagnóstico

Si una consulta con RLS devuelve cero filas inesperadamente:

```sql
select public.fn_validar_contexto_backend();
```

| Síntoma | Causa probable |
|---|---|
| `contexto_establecido: false` | El `SET LOCAL` no se ejecutó o se ejecutó fuera de la transacción |
| `rol_efectivo: null` | El `user_id` no corresponde a un `perfil` existente |
| `es_admin: false` con rol de admin | El `perfil.rol` no es `administrador` |
| Cero filas con contexto válido | La política exige algo más (matrícula, asignación docente) |
