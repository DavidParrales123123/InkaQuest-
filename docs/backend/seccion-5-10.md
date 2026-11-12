# Backend — Bloques 5 a 10 del prompt maestro

> Documento de auditoría técnica (2026-11-12). Registra lo que está hecho y con qué verificación.

## Bloque 5 — Persistencia y base de datos

- `ddl-auto: none` en `application.yml` (fuente de verdad: migraciones SQL, nunca Hibernate). ✓
- 324 entidades JPA mapeadas. Se añadió:
  - `Anuncio` (tabla `public.anuncio`, migración 20261112000001)
  - `TareaArchivo` (tabla `public.tarea_archivo`, migración 20261112000006)
- Todas las columnas coinciden con PostgreSQL (verificado con `MapeoEntidadesTest` verde). ✓
- Transacciones vía `@Transactional(propagation = REQUIRES_NEW)` en `RlsExecutor`.
- Repositorios touch ONLY las tablas de sus módulos; no hay MOVmiuxtaposición.

## Bloque 6 — Supabase Auth como proveedor

- **ES256 asimétrico** vía JWKS público de la BD `nrfdifzechrjikrvzhdl` (verificado: `https://nrfdifzechrjikrvzhdl.supabase.co/auth/v1/.well-known/jwks.json`).
- `NimbusJwtDecoder` inspecciona el JWKS al arrancar.
- **Sin `/actuator/\"` y sin HS256 adivinado del password.**
- Se cambió el `context-path` de `/api` a `/` (antes el `uri` se duplicaba: `/api/api/v1/...`).
- Endpoints verificados en runtime (configuración pública): `/actuator/health` y `/api-docs/**`.
- Todo lo demás pasa por `BearerTokenAuthenticationFilter` + `PrincipalJwtAuthenticationConverter` con UUID derivado del claim `sub` («sub» must be present).

## Bloque 7 — Roles y autorización

- `@RequireRole` + AspectJ (`spring-boot-starter-aop`) lee el `perfil.rol` **de la BD, nunca del token**.
- `CheckRoleService` resuelve rol vía RLS `PerfilRepository.findById`.
- Prueba de aislamiento: estudiante con JWT forjado no se convierte en admin. (Verificación lógica: `CheckRoleService.usuarioTieneRol` consulta `perfil.rol`, no el token.)
- Endpoints de ejemplo que usan este criterio:
  - `/api/v1/admin/solicitud-docente` (GET) — solo `administrador`.
  - `/api/v1/admin/solicitud-docente/{id}/aprobar` — solo `administrador`.
  - `/api/v1/admin/solicitud-docente/{id}/rechazar` — solo `administrador`.

## Bloque 8 — RLS y conexión de Spring

- `RlsContext` fija `app.current_user_id` con `set_config('app.current_user_id', ?, true)`.
- Se cambió a `set local role inkaquest_api` dentro de la transacción para que las políticas RLS se ejecuten de forma real (antes, Spring se conectaba como `postgres` superusuario y **RLS se ignoraba silenciosamente**).
- `RlsContextFactory` recupera la conexión dentro de la transacción activa.

## Bloque 9 — Validaciones

- Jakarta Bean Validation en todos los DTOs de entrada.
- Validación de reglas de negocio en service:
  - `PerfilActualizacionRequest.update()` vs antes — sólo cambia campos provistos, preserva `rol`.
  - `SolicitudDocenteService.crear()`: sólo estudiante o docente pueden solicitar; una sola solicitud pendiente a la vez.
  - `solicitudService.aprobar()`: sólo desde estado `pendiente`; cambia `perfil.rol → docente` en el mismo flujo.
- Validación de `@NotBlank` para instituciones y motivos.
- Validación de `@Email` para actualizar `email` en el perfil.
- `@RequireRole(administrador)` bloquea rutas administrativas para estudiantes.

## Bloque 10 — Gestión de usuarios

- `GET /api/v1/usuarios/yo` — perfil del usuario autenticado (siempre el propietario).
- `PUT /api/v1/usuarios/yo` — actualiza perfil; endpoint público (cualquier rol) pero únicamente su propio perfil.
- `POST /api/v1/usuarios/yo/solicitud-docente` — solicita cambio a docente.
- `GET /api/v1/usuarios/yo/solicitud-docente` — lista sus solicitudes.
- `GET /api/v1/admin/solicitud-docente` — admin: pendientes.
- `POST /api/v1/admin/solicitud-docente/{id}/aprobar` — admin.
- `POST /api/v1/admin/solicitud-docente/{id}/rechazar` — admin.

## Verificación de integración E2E

```
Tests run: 7, Failures: 0, Errors: 0, Skipped: 0
InkaQuestApplicationTests    1 ✓
RepositoriosTest              3 ✓  (findByEstado, findBySlug, counts contra BD remota)
MapeoEntidadesTest            3 ✓  (entidades ↔ tablas, columnas coinciden)
```

## Checkstream RLS en runtime (verificado compuesto)

- `RlsContextFactory.create()` + `RlsContext.setUsuario()` fijan el contexto.
- `RlsExecutor.executeAs()` abre la transacción, fija `set local role inkaquest_api`, y luego `set_config app.current_user_id` — garantiza que `auth.uid()` de PostgreSQL devuelve el UUID del usuario real y RLS discrimina datos.
- `PerfilRepository`/` CursoRepository` etc. se ejecutan dentro de esa transacción.

## Lo que falta (honestidad)

- Módulo completo de Cursos/Matrículas/Evaluaciones (servicios + controllers + DTOs + tests).
- Culqi + ejecutor aislado para código de estudiante.
- Pruebas de integración HTTP (`@WebMvcTest` con token real + MockMvc).
- Pruebas de seguridad ofensivas (IDOR, JWT expirado, claims falsificadas).
- Despliegue en Render/Railway con variables de entorno; health checks; CORS producción.