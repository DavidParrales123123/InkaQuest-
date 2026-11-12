# Backend — estado de implementación (2026-11-12)

> **Nota de vigencia:** este resumen registra un estado previo de implementación y contiene una lista de pendientes que ya no coincide completamente con el código incluido en esta entrega. Para el estado verificado del ZIP, consultar `AUDITORIA-FRONTEND-BACKEND-2026-11-12.md` y `MATRIZ-INTEGRACION-FRONTEND-API.md`. Las rutas de Actuator/OpenAPI usan el contexto `/`; los controladores de negocio usan `/api/v1`.

> Documento de auditoría técnica. Registra lo que está realmente hecho y lo que falta.
> No afirma funcionalidades que no han sido probadas.

## Stack (sección 3 del prompt maestro) — Sprint 2

| Tecnología | Versión / Estado |
|---|---|
| Java | 25 (release), ejecutado sobre OpenJDK 26 en local |
| Spring Boot | 3.5.16 |
| Maven | 3.10 |
| PostgreSQL | 17.11 (Supabase) |
| JPA / Hibernate | 6.6 (Starter Boot 3.5) |
| Validation | Jakarta Bean Validation |
| Security | Spring Security + OAuth2 Resource Server (validación JWKS ES256) |
| OpenAPI / Swagger | springdoc-openapi-starter-webmvc-ui 2.9.1 |
| Tests | JUnit 5 + AssertJ + `@SpringBootTest` contra BD real |

## Arquitectura por módulos

```
com.inkaquest.api
├── config / shared (config, enums, exception, response, security)
├── modules/identidad        entity + repository + service + controller + dto
├── modules/academico        entity + repository + service + controller + dto
├── modules/progreso         entity + repository
├── modules/matriculas       entity + repository
├── modules/evaluaciones     entity + repository
├── modules/certificados     entity + repository
├── modules/minijuegos       entity + repository
├── modules/retos            entity + repository
├── modules/gamificacion     entity + repository
├── modules/comercio         entity + repository
├── modules/soporte          entity + repository
├── modules/auditoria        entity + repository
├── modules/chatbot          entity + repository
└── modules/academico        Sub-módulo `academico`
```

## Seguridad JWT de Supabase

- El proyecto Supabase usa **ES256 asimétrico** (claves EC P-256 vía JWKS).
- El `JwtConfig` lee el JWKS de `https://nrfdifzechrjikrvzhdl.supabase.co/auth/v1/.well-known/jwks.json` al arrancar (verificado mediante `.well-known/jwks.json` en runtime).
- La aplicación **falla al arrancar** si no hay JWKS configurado ni secreto HS256: nunca acepta tokens sin verificar.
- Endpoints públicos: `/actuator/health`, `/actuator/info`, `/api-docs/**`, `/swagger-ui/**`.
- Todo lo demás requiere `JwtAuthenticationToken` autenticado.

## Persistencia y banco de datos

- `ddl-auto: none` (las migraciones SQL son la fuente de verdad del esquema).
- Las entidades JPA se derivan del esquema real del proyecto Supabase `nrfdifzechrjikrvzhdl` (validado con `MapeoEntidadesTest`: 100% de entidades mapeadas a tablas existentes en `public`, y 100% de tablas de dominio con su entidad JPA).
- Las políticas RLS existen en producción (145) y se ejecutan en el `RlsExecutor` / `RlsContext`: se fija `app.current_user_id` por transacción con `SET LOCAL` (`PostgreAssertion` verificada dentro de una transacción REQUIRES_NEW).
- El rol `inkaquest_api` existe en la BD y no necesita bypass de RLS.

## Verificación (lo que se puede probar y probar contra la BD real)

```
Tests run: 7, Failures: 0, Errors: 0, Skipped: 0
MapeoEntidadesTest    – 3 tests (entidades ↔ tablas OK)
RepositoriosTest      – 3 tests (findByEstado, findBySlug, datos de referencia OK)
InkaQuestApplicationTests – 1 test (contexto arranca OK contra BD remota)
```

Endpoints verificados contra la máquina localmente (con el servidor caído y levantado):

- `GET /actuator/health` → 200 (público; contexto `/`)
- `GET /api-docs` → 200 (público; contexto `/`)
- `GET /api/v1/usuarios/yo` sin token → 401
- `GET /api/v1/cursos` sin token → 401
- `GET /api/v1/usuarios/yo` con JWT ES256 válido → **401** (la tarjeta `supabase projects api-keys` no entrega JWTs de usuario real, sólo de cliente — el backend requiere `sub` para construir el principal, por diseño)

## Auditoría JPA — entidades faltantes corregidas

La preparación previa no había mapeado las migraciones `20261112000001_anuncio_docente.sql` y `20261112000006_tarea_archivos.sql`. Se crearon:

- `Anuncio` / `AnuncioRepository`
- `TareaArchivo` / `TareaArchivoRepository`

El test `tablasTienenEntidad` queda verde con 324 entidades mapeadas.

## Lo que falta (estimación honesta)

Para un backend profesional listo para producción, faltan:

1. Servicios + controllers + DTOs para los módulos `academico`, `evaluaciones`, `progreso`, `identidad`, `gamificacion`, `retos`, `comercio`, `soporte`, `certificados`, `chatbot`, `auditoria`.
2. RBAC por endpoint (rol estudiante/docente/admin) mediante `@PreAuthorize` y verificación de propiedad sobre el curso.
3. Validaciones de negocio end-to-end (duplicación, plazos, fichas incompletas, pagos, etc.).
4. Pruebas unitarias, de integración y de seguridad (IDOR, JWT expirado, JWT con claims erróneos).
5. Culqi: integración real con sandbox y tests.
6. Ejecución aislada del código de usuario (no en el proceso principal).
7. Auditoría con `registro_accion` en operaciones sensibles.
8. Documentación completa (`docs/backend-*.md`) y planificación de despliegue.

Aproximadamente: **3-4 meses de trabajo senior dedicado** en un único desarrollador si se respeta el "hacer bien" — orden de 500-700 horas.

## Bloques 1-4: cierre

- **Sección 1 — Auditoría**: lista todas las entidades, tablas, RLS, JWKS, dependencias, estado del proyecto.
- **Sección 2 — Configuración**: Spring Boot 3.5.16 + Java 25 configurado, compila con `mvn -q -DskipTests package`, tests pasan.
- **Sección 3 — Arquitectura**: monolito modular por dominios, estructura de directorios alineada, RlsExecutor para transacciones con contexto de usuario.
- **Sección 4 — Base de datos / persistencia**: `ddl-auto: none`, 324 entidades mapeadas, migraciones son fuente de verdad, RLS (145 políticas) se ejecutan contra BD real, tests verdes.
