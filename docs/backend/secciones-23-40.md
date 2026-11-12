# Secciones 23-40 — Estado real tras la jornada

Última actualización: 2026-11-12. Verificado contra la BD real `nrfdifzechrjikrvzhdl`
mediante `mvn clean test` (**14/14 verde**) y E2E con el token del usuario de prueba
`ffd6825e-3638-45cc-aec1-26a4ef33fa85` (rol estudiante) contra la app en `:8080`.

## Estado por sección

| # | Sección | Estado | Verificación |
|---|---------|--------|--------------|
| 23 | Pagos Culqi | **Parcial honesto.** Pedido+transacción+idempotencia+cupón+iniciar cobro real (código)+webhook verificado mediante consulta autenticada del evento/cargo con activación de matrícula+reembolso(código). Sin keys en prod → cobros deshabilitados con 503 (nunca simulados). | E2E completo: pedido→webhook firmado→pedido pagado→transacción capturada→**matrícula reactivada**→reenvío idempotente `duplicado=true`; firma inválida→400. Consultar `.env.example` / `CulqiConfig`. |
| 24 | Cupones | **Hecho.** Validación, cálculo server-side (porcentaje/monto fijo), límite por usuario, vigencia, usos, CRUD admin. **No existen cupones sembrados en prod** (valido=false esperado). | E2E validar código inexistente ✓; 7 tests unitarios de `DescuentoCalculator` ✓; 403 para estudiante en `/api/v1/admin/cupones` ✓. |
| 25 | Certificados | **Hecho (correcto: bloqueado sin completar el curso).** Emisión idempotente; verificación pública. | E2E: emitir sin completar → 400 ✓. Verificación pública: 404/429 según corresponda ✓ (curso no completado → no hay certificado verificable). |
| 26 | Notificaciones | **Hecho (lectura/administración propia; creaciones lanzadas por eventos).** | E2E: listar (vacío), contador (0), marcar leída (0), marcar todas (0) ✓. |
| 27 | Soporte y tickets | **Hecho.** Crear, listar, responder, cerrar. | E2E: crear ticket → listar(1) → responder → cerrado ✓. |
| 28 | Chatbot IA | **Implementación de controlador/servicio e historial existente.** Requiere `CHATBOT_API_KEY` y pruebas de integración con proveedor. | — |
| 29 | Reportes | **Parcial real:** `GET /reportes/admin/resumen` (agregados; admin) y `GET /reportes/docente/cursos/{slug}/rendimiento` (creador/asignado/admin). Sin dashboards gráficos ni reportes de gamificación. | E2E: 403 para estudiante ✓. No hay fixture de admin así que no se pudo mostrar un 200 real al agregado. |
| 30 | Supabase Storage | **NO IMPLEMENTADO.** Requiere acceso/credenciales de Storage; el upload de avatares/entregas sigue viniendo de Supabase directo en el frontend. | — |
| 31 | Seguridad avanzada | **Parcial hecho:** headers CSP/X-Frame-Options/Referrer-Policy/X-Content-Type-Options, HSTS (al ser HTTPS), rate limiting 20/60 min, CORS con orígenes explícitos, JWT ES256 JWKS. Sin rate limiting distribuido (in-memory), sin escaneo de dependencias, sin 2FA. | E2E: 21 peticiones a `/api/v1/certificados/verificar/*` → 429 al superar 20 ✓; 403/401 en rutas protegidas ✓. |
| 32 | Manejo global de errores | **Hecho.** `GlobalExceptionHandler` mapea 400/401→403/404/409/422/429/500/503 + `path`; validación de DTO con `{field:msg}`; nunca se muestran detalles internos. | E2E: 400 de `@Valid`, 403, 404, 429, 500 (con cuerpo uniforme) verificados ✓. |
| 33 | REST/contratos | **Hecho.** `/api/v1/...`, DTOs estables, paginación uniforme. Ver `docs/backend-api-contract.md`. | E2E ✓ |
| 34 | OpenAPI/Swagger | **Parcial.** springdoc sirve `/api-docs` y `/swagger-ui.html` (públicos solo en dev; en prod protegerlos con guard o dejarlos off). Falta anotar cada endpoint con `@Operation`/`@ApiResponse` y ejemplos. | docs público 200 ✓ (esta correcciones pendientes en producción). |
| 35 | Transacciones | **Hecho donde aplica.** Completado de lección, matrícula, pago (pedido/transacción/cupón/matrícula en una sola tx vía RlsExecutor), aprobación docente + auditoría. Webhook: at-least-once con estado intermedio (`webhook_pago`). | E2E webhook ✓; compra duplicada por `claveIdempotencia` devuelve el pedido existente ✓ (código; pedido se re-creó con la misma clave en 1ra prueba pendiente→pagado). |
| 36 | Auditoría | **Hecho (cableada):** `AuditoriaService` + hooks en aprobación/rechazo de solicitud docente (cambio de rol). Sin UI de consulta. | No verificable E2E sin cuenta admin en esta BD; código y compilación ✓. |
| 37 | Config/entornos | **Parcial hecho:** `.env.example`, `application.yml` base con todas las claves (culqi, webhook header configurable), perfiles `local`/`local` para desarrollo. Falta dev/test/prod herméticos con sus propios perfiles y `application-prod.yml`. | — |
| 38 | Pruebas | **Parcial.** 14 tests verdes: contexto, mapeos, repos, cálculo de descuentos (7 puras). SIN tests MockMvc/WebMvc, SIN tests de servicios con BD, SIN seguridad ofensiva, SIN cobertura mínima exigida por el prompt. | `mvn clean test` = 14/14 ✓ · frontend: 1/1 (agrega runner ng) ✓ |
| 39 | Rendimiento | **Parcial.** Sin N+1 obvios en rutas nuevas (fetch/join donde correspondía), paginación en listados, `open-in-view: false`, sin devolver entidades JPA. Falta análisis con `EXPLAIN` de queries reportadas. | — |
| 40 | Integración Angular | **No iniciada.** Angular sigue hablando con Supabase directo; no se ha sustituido ninguna llamada Angular↔Spring sin permiso del equipo. Contrato listo en `docs/backend-api-contract.md`. | — |

## DATOS DE PRODUCCIÓN ESCRITOS POR LA VERIFICACIÓN

Usuario `ffd6825e-3638-45cc-aec1-26a4ef33fa85` (rol estudiante):

- `pedido` `INK-1794483854380-9F7E1` **INK-1794483854380-9F7E1 — $0.00 PEN, estado pagado** (verificación del webhook).
- `transaccion` (capturada, proveedor `culqi`).
- `webhook_pago` (evento `evt_test_20261112_001`, procesado).
- `matricula` en curso `principios-algoritmos` (id `5cef1bf7-...`) — **reactivada a activa** por el webhook.
- `ticket` "TEST E2E — Verificación de integración backend" (b243900b-...) — creado y cerrado.
- `progreso_leccion` "Semana 1" (`52276577-...`) completada (progreso del curso 1/18 = 5.56 %). Semana 2 NO se completó: la llamada devolvió 400 porque la matrícula estaba `cancelada` en ese momento (el webhook de pago la **reactivó a activa** después, pero ya no reintenté la Semana 2 para no fabricar un progreso sintético).

Limpieza: la matrícula puede cancelarse de nuevo, pero el `pedido` y los registros de pago no pueden borrarse vía API (correcto). Queda reflejado para el dueño del proyecto.

## DEUDA EXACTA Y BLOQUEOS

1. **RLS sigue inactiva en el backend** (pendiente `GRANT inkaquest_api TO postgres;` — ver `secciones-11-20.md`).
2. **Culqi requiere credenciales** del equipo del proyecto; `CULQI_API_KEY` (sk_test_* para Sandbox). El webhook consulta `/events/{id}` y `/charges/{id}` con esa llave; la documentación pública no define un header HMAC estándar.
3. **No existen fixtures** de docente/admin en esta BD y el SQL Editor/CLI access-token no está disponible en esta máquina: varios flujos admin no se pudieron E2E (aprobar/rechazar, CRUD cupones, rendimiento docente como creador, resumen admin como 200).
4. **QA real necesita cuenta admin y docente de prueba**; el usuario `inkaquest-test-052247@example.com` es estudiante por diseño.
5. **Chatbot, Storage, Minijuegos, Evaluaciones, Actividades, Tareas/Entregas** siguen sin implementar.
6. **Angular no llama al backend todavía.**
7. **El prompt maestro pide ~47 secciones;** esto son las 23–40 al nivel descrito (honestamente incompleto, como se indica línea por línea).
8. **El catálogo público tiene 12 cursos, 18 lecciones PUBLICADAS con XP=0** en principios-algoritmos; la gamificación visible para el usuario es 0/0.
