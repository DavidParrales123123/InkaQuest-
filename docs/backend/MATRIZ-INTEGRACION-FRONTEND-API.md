# Matriz de integración Angular ↔ Spring Boot

**Fecha de revisión:** 12 de noviembre de 2026. Esta matriz refleja el código fuente incluido en el ZIP; no implica que cada endpoint haya sido probado en runtime.

| Dominio Angular | Servicio del frontend | Acceso actual predominante | Backend encontrado | Trabajo necesario |
|---|---|---|---|---|
| Autenticación/perfil | `auth.service.ts` | Supabase Auth + HTTP Spring | `PerfilController`, `AdminUsuariosController` | Alinear contratos y retirar fallback de perfil directo cuando la API esté estable. |
| Cursos públicos | `course.service.ts` | Supabase JS | `CursoController` | Conectar catálogo/detalle a `/api/v1/cursos`; resolver acceso anónimo de catálogo si se requiere público. |
| Gestión docente de cursos | `course.service.ts`, `teacher.service.ts`, `admin.service.ts` | Supabase JS | `CursoEscrituraController` | Migrar operaciones de estructura y validar propiedad/rol en cada endpoint. |
| Matrículas | `enrollment.service.ts` | Supabase JS | `MatriculaController` | Conectar listado, alta y baja; probar duplicados, estados y permisos. |
| Progreso | `progress.service.ts` | Supabase JS | `ProgresoController` | Conectar progreso y finalización de lecciones; verificar reglas de avance. |
| Actividades/tareas/entregas | `activity.service.ts` | Supabase JS + Storage | Entidades/repositorios existentes; sin controlador REST de dominio encontrado | Implementar API de docente/estudiante, adjuntos, plazos, entregas y calificación. Mantener Storage privado y URLs firmadas. |
| Evaluaciones | `evaluation.service.ts` | Supabase JS | Entidades/repositorios existentes; sin controlador REST de dominio encontrado | Implementar creación, preguntas/opciones, intentos, respuestas, corrección y límites de intentos. |
| Minijuegos | `game.service.ts` | Supabase JS | Entidades/repositorios existentes; sin controlador REST de dominio encontrado | Implementar catálogo, asignación, ejecución, intentos y persistencia de resultados. |
| Retos de programación | Servicio/pantallas de retos | Revisar consumo completo | `RetosController` | Verificar ejecución aislada de código y límites; nunca ejecutar código arbitrario dentro del proceso web. |
| Gamificación | `gamification.service.ts`, `reward.service.ts` | Supabase JS | `GamificacionController` | Conectar XP, insignias, misiones, ranking, monedas y compras virtuales; validar idempotencia. |
| Mensajería | `message.service.ts` | Supabase JS / Realtime | `MensajesController` | Conectar API, revisar permisos de conversación y decidir estrategia Realtime. |
| Anuncios | `anuncio.service.ts` | Supabase JS | `AnunciosController` | Conectar lectura y publicación por rol/curso. |
| Notificaciones | `notification.service.ts` | Supabase JS / Realtime | `NotificacionesController` | Conectar lectura y marcado; validar destinatario. |
| Pagos/cupones | `payment.service.ts` | Supabase JS | `PedidosController`, `CuponesController` | Centralizar el flujo en backend; probar Culqi sandbox, firma de webhook, idempotencia y reembolsos. |
| Certificados | `certificate.service.ts` | Revisar flujo de cliente | `CertificadosController` | Conectar emisión/verificación y comprobar criterios de finalización. |
| Soporte | `support.service.ts` | Supabase JS | `SoporteController` | Conectar tickets y mensajes; limitar acceso al propietario y al personal autorizado. |
| Administración | `admin.service.ts` | Supabase JS | `AdminUsuariosController`, `AdminAuditoriaController`, controladores de cursos/cupones | Migrar operaciones administrativas; aplicar RBAC y auditoría por operación. |
| Chatbot | `chatbot.service.ts` | HTTP Spring | No se encontró controlador de chatbot | Crear API de conversaciones/mensajes y configurar proveedor/modelo de IA antes de habilitar respuestas. |

## Contrato de rutas

- Base local del cliente: `http://localhost:8080/api/v1`.
- Producción: `VITE_API_URL=https://<host-backend>/api/v1`.
- Los controladores declaran `/api/v1` directamente; el contexto del servidor es `/`.
- Actuator health: `/actuator/health` (sin `/api`).
- El backend debe responder con `ApiResponse<T>` según el contrato común; el cliente debe extraer `data` de forma consistente.

## Orden recomendado de migración

1. Identidad, perfil, roles y autorización.
2. Catálogo, estructura de cursos y matrículas.
3. Aula: actividades, tareas, archivos, entregas, evaluaciones y progreso.
4. Docentes y administración.
5. Gamificación, juegos, retos y recompensas.
6. Mensajería, notificaciones, anuncios y soporte.
7. Pagos, certificados y chatbot.

Cada dominio debe migrarse con pruebas de contrato, integración PostgreSQL/RLS y pruebas negativas de autorización antes de retirar sus consultas directas de Supabase en Angular.
