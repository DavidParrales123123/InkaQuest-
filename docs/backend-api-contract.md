# Contrato de la API — InkaQuest Backend

Base: `/api/v1`. Autenticación: `Authorization: Bearer <JWT de Supabase>` (JWKS ES256).
Respuestas uniformes con el envoltorio `ApiResponse` (`success`, `message`, `data`, `error`, `timestamp`, `path` solo en error). Validación con Bean Validation; errores de validación usan cuerpo `{success:false, message, error:"VALIDATION_ERROR", path, errors:{campo:mensaje}}`.

**Códigos HTTP:** 200/201 · 400 `BAD_REQUEST` · 401 (sin token) · 403 `FORBIDDEN` · 404 `NOT_FOUND` · 409 `CONFLICT` · 422 `UNPROCESSABLE_ENTITY` · 429 `TOO_MANY_REQUESTS` (header `Retry-After`) · 503 `SERVICE_UNAVAILABLE` (proveedor deshabilitado) · 500 `INTERNAL_ERROR`.

**Reglas de oro:** el rol se lee SIEMPRE de `public.perfil.rol` (nunca del token). El precio de un curso y el descuento SIEMPRE se calculan en el backend. Las calificaciones y el XP los calcula el backend. Las confirmaciones de pago NUNCA dependen del navegador (solo de un evento verificado directamente contra la API autenticada de Culqi).

## Auth y perfil

| Endpoint | Roles | Descripción |
|---|---|---|
| `GET /api/v1/usuarios/yo` | autenticado | Perfil completo (auto-promueve `pendiente_verificacion`→`activo` cuando el JWT trae email confirmado) |
| `POST /api/v1/usuarios/asegurar` | autenticado | Crea el perfil si no existe (idempotente; rol **estudiante**, nunca acepta rol del body) |
| `PUT /api/v1/usuarios/yo` | autenticado | Actualiza perfil (rol NO se toca desde aquí; soporta `fechaNacimiento`) |
| `POST /api/v1/usuarios/yo/solicitud-docente` | autenticado | Solicita cambio a docente |
| `GET /api/v1/usuarios/yo/solicitud-docente` | autenticado | Mis solicitudes |
| `GET /api/v1/admin/solicitud-docente` | administrador | Solicitudes pendientes |
| `POST /api/v1/admin/solicitud-docente/{id}/aprobar` | administrador | Aprueba (audita en `registro_accion`) |
| `POST /api/v1/admin/solicitud-docente/{id}/rechazar` | administrador | Rechaza (audita) |
| `GET /api/v1/admin/usuarios?rol=&q=&page=&size=` | administrador | Listar/paginar usuarios por rol |
| `GET /api/v1/admin/usuarios/{id}` | administrador | Detalle de usuario |
| `POST /api/v1/admin/usuarios/{id}/estado-cuenta?estado=activo\|suspendido` | administrador | Activar/suspender cuenta (audita; prohibido suspenderse a uno mismo) |
| `GET /api/v1/admin/auditoria?entidad=&accion=&page=&size=` | administrador | Registro de auditoría paginado |
| `GET /api/v1/admin/solicitudes-docente?estado=` | administrador | Solicitudes por estado |

## Cursos y estructura

| Endpoint | Roles | Descripción |
|---|---|---|
| `GET /api/v1/cursos?q=&page=&size=` | autenticado | Catálogo publicado paginado |
| `GET /api/v1/cursos/{slug}` | autenticado | Detalle publicado |
| `POST /api/v1/cursos` | docente/admin | Crear curso (borrador) |
| `PUT /api/v1/cursos/{slug}` | creador/asignado/admin | Editar (solo borrador/en_revisión) |
| `POST /api/v1/cursos/{slug}/enviar-revision` | creador/asignado/admin | borrador→en_revisión |
| `POST /api/v1/admin/cursos/{slug}/publicar` | administrador | en_revisión→publicado |
| `POST /api/v1/admin/cursos/{slug}/archivar` | administrador | publicado→archivado |
| `GET /api/v1/admin/cursos?estado=&page=&size=` | administrador | Listar por estado |
| `GET /api/v1/docente/cursos` | docente/admin | Mis cursos (creados o asignados) |
| `GET /api/v1/docente/cursos/{slug}/estudiantes` | asignado/creador/admin | Matriculados en mi curso |
| `GET /api/v1/cursos/{slug}/estructura` | autenticado* | Árbol unidades→módulos→lecciones (*no propietario: solo publicadas) |
| `POST /api/v1/cursos/{slug}/unidades` | asignado/creador/admin | Crear unidad |
| `PUT /api/v1/unidades/{id}` | asignado/creador/admin | Editar unidad |
| `DELETE /api/v1/unidades/{id}` | asignado/creador/admin | Eliminar (falla si hay módulos) |
| `POST /api/v1/unidades/{unidadId}/modulos` | asignado/creador/admin | Crear módulo |
| `PUT /api/v1/modulos/{id}` | asignado/creador/admin | Editar módulo |
| `DELETE /api/v1/modulos/{id}` | asignado/creador/admin | Eliminar (falla si hay lecciones) |
| `POST /api/v1/modulos/{moduloId}/lecciones` | asignado/creador/admin | Crear lección |
| `PUT /api/v1/lecciones/{id}` | asignado/creador/admin | Editar lección |
| `DELETE /api/v1/lecciones/{id}` | asignado/creador/admin | Eliminar (falla si hay progreso) |

## Matrículas y progreso

| Endpoint | Roles | Descripción |
|---|---|---|
| `GET /api/v1/matriculas/yo` | autenticado | Mis matrículas |
| `POST /api/v1/matriculas/matricularme` | autenticado | Inscribirse en curso publicado |
| `DELETE /api/v1/matriculas/{id}` | autenticado (propietario) | Cancelar matrícula |
| `GET /api/v1/progreso/yo` | autenticado | Mi progreso por curso |
| `POST /api/v1/progreso/lecciones/{leccionId}/completar` | autenticado | Completar lección (idempotente; recomputa % y racha) |
| `GET /api/v1/reportes/docente/cursos/{slug}/rendimiento` | asignado/creador/admin | Alumnos activos/completados + progreso medio |
| `GET /api/v1/reportes/admin/resumen` | administrador | Agregado: usuarios, catálogo, matrículas, ingresos PEN/USD |

## Comercio y pagos

| Endpoint | Roles | Descripción |
|---|---|---|
| `GET /api/v1/cupones/validar?codigo=&subtotal=` | autenticado | Valida cupón; el descuento lo calcula el backend |
| `POST /api/v1/pedidos/iniciar` | autenticado | Crea pedido+transacción (idempotente por `claveIdempotencia`); opcional `culqiToken` |
| `GET /api/v1/pedidos/yo` | autenticado | Mis pedidos |
| `GET /api/v1/pedidos/{numero}` | propietario/admin | Detalle |
| `POST /api/v1/webhooks/culqi` | **público** (el ID del evento se verifica consultando Culqi con la llave privada del servidor) | Confirma el pago, captura la transacción, paga el pedido, activa la matrícula, consume 1 uso del cupón. Idempotente por `eventoId` |
| `GET /api/v1/admin/cupones` | administrador | Listar cupones |
| `POST /api/v1/admin/cupones` | administrador | Crear cupón |
| `POST /api/v1/admin/cupones/{id}/estado?activo=` | administrador | Activar/desactivar |

**Notas Culqi.** Sin `CULQI_API_KEY`, el servidor no puede crear ni verificar cargos. La autenticidad del webhook se comprueba consultando `GET /v2/events/{id}` y `GET /v2/charges/{id}` con la llave privada; se valida evento, cargo, captura, pedido, importe y moneda antes de actualizar la matrícula. La documentación pública de Culqi describe el ID/tipo del evento y la consulta autenticada, pero no define un header HMAC estándar; por ello no se presupone `X-Culqi-Signature`. La matrícula nunca se activa desde el navegador. El flujo Sandbox aún requiere credenciales y una prueba de extremo a extremo.

## Gamificación y retos

| Endpoint | Roles | Descripción |
|---|---|---|
| `GET /api/v1/gamificacion/yo` | autenticado | XP/nivel/racha/monedas/insignias/misiones |
| `GET /api/v1/gamificacion/insignias` | autenticado | Catálogo + mi progreso |
| `GET /api/v1/gamificacion/misiones` | autenticado | Misiones activas + mi progreso |
| `GET /api/v1/gamificacion/temporada-actual` | autenticado | Temporada activa |
| `GET /api/v1/gamificacion/ranking` | autenticado | Top 20 + mi puesto (404 si no hay temporada activa) |
| `GET /api/v1/gamificacion/transacciones-xp?page=&size=` | autenticado | Historial de XP |
| `GET /api/v1/retos?page=&size=` | autenticado | Retos publicados (0 en prod hoy) |
| `GET /api/v1/retos/{id}` | autenticado | Detalle + casos públicos (nunca ocultos) |
| `GET /api/v1/retos/{id}/intentos-restantes` | autenticado | Intentos antes de agotarlos (-1 ilimitado) |
| `POST /api/v1/retos/{id}/envios` | autenticado | Envía solución (queda `pendiente` — no hay sandbox) |
| `GET /api/v1/retos/{id}/envios/yo` | autenticado | Mis envíos |
| `GET /api/v1/lenguajes` | autenticado | Lenguajes activos |

## Certificados, notificaciones y soporte

| Endpoint | Roles | Descripción |
|---|---|---|
| `POST /api/v1/certificados/cursos/{cursoSlug}/emitir` | autenticado (curso completado) | Emitir certificado (idempotente) |
| `GET /api/v1/certificados/yo` | autenticado | Mis certificados |
| `GET /api/v1/certificados/verificar/{codigo}` | **público** | Verificación mínima (+1 a `veces_verificado`) |
| `GET /api/v1/notificaciones/yo?page=&size=` | autenticado | Mis notificaciones |
| `GET /api/v1/notificaciones/yo/no-leidas` | autenticado | Cantidad |
| `POST /api/v1/notificaciones/{id}/leida` | autenticado (propietario) | Marcar una como leída |
| `POST /api/v1/notificaciones/leidas` | autenticado | Marcar todas como leídas |
| `POST /api/v1/soporte/tickets` | autenticado | Crear ticket |
| `GET /api/v1/soporte/tickets/yo` | autenticado | Mis tickets con respuestas |
| `GET /api/v1/soporte/tickets/{id}` | autor/admin | Detalle |
| `POST /api/v1/soporte/tickets/{id}/mensajes` | autor/admin | Añadir mensaje |
| `POST /api/v1/soporte/tickets/{id}/cerrar` | autor/admin | Cerrar |

## Infraestructura transversal

| Endpoint | Roles | Descripción |
|---|---|---|
| `GET /actuator/health` | público | Health (DB UP) ✓; `metrics` NO expuesto |
| Rate limit: 20/min rutas estrictas (`/api/v1/webhooks/culqi`, `/api/v1/certificados/verificar/**`) | público | `429` + `Retry-After` + `X-RateLimit-Limit` / `X-RateLimit-Remaining` ✓ |
| Rate limit: 60/min resto (configurable: `RATE_LIMIT_MAX_PER_MINUTE`/`RATE_LIMIT_STRICT_PER_MINUTE`) | público | `429` + mismos headers ✓ |
| `POST /api/v1/webhooks/culqi` | Verificación remota del evento y cargo mediante API privada Culqi | Implementación preparada; prueba Sandbox pendiente |

## Hardening (sesión 2026-11-12)

- **Validation de entrada en todos los endpoints:** `@Validated` a nivel clase en los 15 controladores; `@Size/@Pattern/@Min/@Max/@NotBlank/@NotNull` en `@RequestParam`/`@PathVariable` (page/size limitados, slug pattern, código/número patrón, búsqueda acotada). Pedidos al validador: `400 VALIDATION_ERROR` con `errors{campo:mensaje}`. UUID inválidos→400 (conversion). 400 confirmados E2E con prod OFF ✓.
- **Sin endpoints abiertos en prod:** `metrics` no expuesto (404), `/swagger-ui` y `/api-docs` deshabilitados en perfil `prod` (404 E2E ✓, reactivar: `SPRINGDOC_API_DOCS_ENABLED=true`), `health` pública solo (200 ✓, sin details), `actuator` muestra solo `health` (404 para metrics/img vars ✓). Error detallado apagado: `include-message: never`, `include-exception: false`.
- **Logs estructurados JSON en prod** (`logback-spring.xml` con `JsonStructuredLayout` propio, sin dependencias nuevas; legible `local`/`dev`). Formato confirmado E2E ✓.
- **Profile `prod`** (`SPRING_PROFILES_ACTIVE=prod`): `application-prod.yml` exige `DB_URL` sin fallbacks, `APP_CORS_ALLOWED_ORIGINS` sin localhost, docs deshabilitados, actuator reducido. Verificado E2E: health→UP, 404 en todas las rutas cerradas, logs JSON limpios, 400/401/429 ✓.
- **Errores 404 correctos:** `NoResourceFoundException` → 404 (antes escapaban 500) ✓; `ConstraintViolationException` → 400 (antes 500) ✓; `MethodArgumentNotValidException` (cuerpos) y `MissingServletRequestParameterException` → 400 ✓; recurso aridadensión=500 nunca se expone stack ✓.

> **Pendiente sin adornar:** la verificación de tests no cubre el perfil `prod` en CI (no hay pipeline); el rate-limit es por instancia, no distribuido; no hay CSP a nivel de servidor (queda como recomendación de headers de Vercel); `/actuator/info` sigue público (contenido no sensible; verificado vacío).

## Cuenta del ejecutor

Ningún endpoint acepta un UUID de usuario del cuerpo/parámetros para suplantar: el usuario siempre sale del JWT verificado. Roles: `estudiante` < `docente` < `administrador` (según permisos por funcionalidad, no jerárquicos universales).
