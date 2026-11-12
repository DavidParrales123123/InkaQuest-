# Auditoría e integración backend — InkaQuest

**Fecha:** 12-11-2026  
**Base:** `InkaQuest_auditado_y_ajustes.zip`  
**Alcance:** inspección estática del frontend Angular, backend Spring Boot, documentación y migraciones incluidas. No se dispuso de credenciales ni conexión al Supabase remoto durante esta intervención.

## 1. Inventario real

- Frontend Angular 22: 21 servicios de dominio en `core/services` (más `global-error-bus.service.ts`).
- Backend: 14 módulos, 410 archivos Java originales; tras añadir el controlador y servicio del chatbot hay 18 controladores y 22 clases de servicio de aplicación/negocio (la cifra puede variar si se cuentan servicios auxiliares).
- Los módulos `evaluaciones` y `minijuegos` contienen entidades y repositorios, pero no tenían controladores ni servicios de aplicación.
- El proyecto ya tenía `ApiResponse`, `GlobalExceptionHandler`, Spring Security, validación JWT de Supabase y `RlsExecutor`; no correspondía duplicar esas piezas.

## 2. Rutas y contrato

- Los controladores Spring Boot existentes publican rutas bajo `/api/v1`.
- `environment.ts` configura `apiUrl` como `http://localhost:8080/api/v1`; por ello los servicios Angular deben pasar rutas relativas como `/chatbot/conversaciones`, no volver a anteponer `/api` ni `/api/v1`.
- Los controladores REST existentes devuelven `ApiResponse<T>`. `ApiClientService` ahora desenvuelve `data` de forma centralizada y mantiene compatibilidad con respuestas sin envoltorio.
- Los errores de validación de cuerpo y parámetros ahora usan `ApiResponse` con `errors` opcional. Las respuestas 401, 403 y 429 de los filtros de seguridad también usan el mismo contrato.

## 3. Cambios incorporados en esta intervención

1. Se añadieron `ChatbotController`, `ChatbotService` y DTOs para los cuatro endpoints que consume Angular:
   - `GET /api/v1/chatbot/conversaciones`
   - `GET /api/v1/chatbot/conversaciones/{id}/mensajes`
   - `POST /api/v1/chatbot/conversaciones`
   - `POST /api/v1/chatbot/mensajes`
2. El usuario se obtiene del `sub` del JWT verificado; no se acepta un `usuarioId` del cliente.
3. Las consultas y escrituras del chatbot ejecutan dentro de `RlsExecutor`, y se verifica que la conversación pertenezca al usuario.
4. El historial se guarda en `chatbot_mensaje` y se envía al proveedor IA desde el backend. La clave se configura con `CHATBOT_API_KEY`; modelo y URL con `CHATBOT_MODEL` y `CHATBOT_API_URL`.
5. Se actualizó `ApiClientService` para desenvolver `ApiResponse` y se añadió la configuración del proveedor IA a `application.yml` y `.env.example`.
6. Se unificó el formato de respuestas de validación y de errores de autenticación/autorización/rate-limit.

## 4. Estado de integración por área

| Área | Estado observado | Trabajo que falta para cierre real |
|---|---|---|
| Identidad / perfiles | Controladores y servicios existentes | Completar permisos finos, recuperación de acceso coordinada con Supabase Auth y pruebas por rol. |
| Cursos / estructura | Controladores, servicios y repositorios existentes | Revisar todos los métodos Angular y cubrir recursos/contenidos y operaciones de publicación. |
| Matrículas | Controlador y servicio existentes | Completar cancelaciones, seguimiento y activación solo tras pago confirmado. |
| Progreso | Controlador y servicio existentes | Pruebas de idempotencia y conciliación con RPC/migraciones. |
| Actividades / tareas / evaluaciones | Entidades y repositorios; sin controlador ni servicio de aplicación para evaluaciones | Crear casos de uso, DTOs y endpoints alineados con el frontend. |
| Minijuegos | Entidades y repositorios; sin controlador ni servicio de aplicación | Crear APIs de sesión/resultado y validar resultados de forma autoritativa. |
| Retos | Controlador y servicio de envíos existentes | Implementar judge aislado; no ejecutar código de estudiantes dentro del proceso Spring Boot. |
| Gamificación | Controlador y servicio existentes | Completar mutaciones transaccionales, misiones, inventario, canjes y validación anti-fraude. |
| Docentes / administración | Endpoints parciales en identidad, cursos y reportes | Completar operaciones y autorización de todos los flujos de UI. |
| Notificaciones / mensajería / soporte | Controladores y servicios existentes | Validar paginación, permisos, entrega y estados contra todos los flujos Angular. |
| Chatbot | Cuatro endpoints añadidos | Configurar proveedor y validar con JWT, RLS, cuota y pruebas de integración. |
| Certificados | Controlador y servicio existentes | Generación de PDF, revocación, descarga autorizada y verificación integral. |
| Comercio / pagos | Controladores, servicios Culqi y entidades existentes | Verificar firma del webhook, idempotencia, checkout real, reembolsos y activación transaccional. |

## 5. Acceso directo a Supabase desde Angular

La revisión encontró que varios servicios todavía usan Supabase directamente para operaciones de dominio o RPC. Entre ellos aparecen actividad/archivos, administración, catálogo de cursos, matrícula gratuita, juegos, progreso, soporte y Storage. Supabase Auth y Storage pueden permanecer en el cliente cuando corresponda; las operaciones de negocio deben migrarse de forma gradual a REST, pero solo después de disponer de endpoints equivalentes y pruebas. No se eliminaron llamadas que aún son la única implementación funcional para evitar romper pantallas o inventar contratos.

## 6. Pendientes externos y configuración

- Configurar `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `SUPABASE_JWKS_URI`, CORS y demás variables en el entorno real.
- Configurar `CHATBOT_API_KEY` únicamente en el backend. Sin esa variable el chatbot devuelve 503 deliberadamente; no se simula una respuesta IA.
- Configurar `apiUrl` y claves públicas de Supabase para cada entorno Angular.
- No se ejecutaron migraciones ni escrituras contra la base remota.

## 7. Validación pendiente

No fue posible ejecutar la compilación del backend en este entorno: el proyecto exige Java 25 y Maven, mientras que el entorno disponible tiene Java 21 y no tiene Maven ni `mvnw`. Tampoco se ejecutó el build Angular: no hay `node_modules` y la versión de Node disponible (22.16.0) no satisface el mínimo declarado por el proyecto (22.22.3). Por tanto, los cambios deben pasar `mvn test`/`mvn package` con JDK 25 y `npm ci`, `npm run build` y `npm run test:ci` con una versión de Node compatible antes de desplegarse.

**Conclusión:** se avanzó en integración transversal y se implementó el backend del chatbot, pero no se declara el proyecto completamente terminado. Los módulos de evaluación, minijuegos, ejecución segura, pagos reales, certificados PDF y migración total de los servicios Angular requieren trabajo adicional y pruebas con el entorno Supabase autorizado.
