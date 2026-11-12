# Módulos y funcionalidades del frontend

Inventario actualizado al cierre de fases 1–14. Refleja implementación/adaptación real en `frontend/inkaquest-web`, integración con Supabase/RLS/RPC cuando aplica y dependencias pendientes de backend.

## 1. Núcleo (`core`)
- **Config:** `app-config.ts`, token `APP_CONFIG`, entornos.
- **Guards:** `authGuard`, `roleGuard` (UX; seguridad real en RLS/Spring Security).
- **Interceptores:** `auth.interceptor.ts`, `error.interceptor.ts`.
- **Modelos:** `domain.models.ts` (tipado alineado al esquema; contratos preparados para DTOs backend).
- **Servicios:** `api-client`, `auth`, `supabase`, `storage`, `course`, `enrollment`, `progress`, `activity`, `evaluation`, `game`, `challenge`, `gamification`, `reward`, `payment`, `certificate`, `notification`, `support`, `teacher`, `admin`, `chatbot`.

## 2. Compartidos (`shared`, `layouts`, `features/shared`)
- **Componentes:** `logo`, `button`, `page-header`, `course-card`, `data-panel`, `empty-state`, `skeleton`, `stat-card`, `status-badge`.
- **Utilidades:** `curso-imagen.util.ts`.
- **Layouts:** `public-layout` (navbar/footer), `auth-layout`, `panel-layout`, `student-layout`, `teacher-layout`, `admin-layout`.
- **Transversales autenticados:** `features/shared/notifications`, `features/shared/support`, `features/shared/chatbot` (UI + integración HTTP preparada, pendiente backend/IA).

## 3. Público (`features/public`) — Fase 5
| Módulo | Estado | Detalle |
|---|---|---|
| Home | Implementado | Hero, logo/lema, CTAs auth/panel, ruta/cómo funciona, práctica, gamificación/progreso visual, **cursos destacados reales**, secciones docentes/testimonios, FAQ y CTA final |
| Sobre nosotros | Implementado | Historia, misión, visión, objetivos, valores, identidad/equipo con estado honesto según RLS |
| Catálogo de cursos | Implementado | Listado real, búsqueda, filtros, orden, **paginación**, estados carga/vacío, imágenes oficiales |
| Detalle de curso | Implementado | Portada, información, precio/duración/XP, estructura (unidades/módulos/lecciones), actividades, matrícula/CTA y navegación |
| Planes y precios | Implementado | Información de planes/precios disponible en UI |
| Docentes | Implementado | Presentación institucional del rol docente y flujo de solicitud/aprobación; perfiles públicos limitados por RLS (sin datos inventados) |
| FAQ | Implementado | Preguntas frecuentes |
| Contacto | Implementado | Página de contacto |
| Testimonios | Implementado | Experiencias referenciales claramente señaladas (no opiniones verificadas inventadas) |
| Verificación de certificados | Implementado | Consulta por código (pública) |
| Legal | Implementado | Términos, privacidad, pagos/reembolsos |
| 404 | Implementado | Estado no encontrado |

## 4. Autenticación (`features/auth`) — Fase 4
- Login, registro (estudiante), recuperación y restablecimiento de contraseña, callback de confirmación, solicitud de acceso docente.
- Sesión reactiva Supabase, carga de perfil, manejo de expiración/cambios, redirecciones por rol/retorno.
- Guards de rol/acceso en frontend (UX).

## 5. Estudiante (`features/student`) — Fases 6, 7, 8, 9
| Área | Módulos | Estado |
|---|---|---|
| Panel y perfil | `dashboard`, `profile` | Implementado (resumen, KPIs, accesos, datos personales/avatar, seguridad/restablecimiento contraseña, estado de cuenta) |
| Cursos y aula | `my-courses`, `classroom`, `units`, `lessons` | Implementado (matrículas/estado, estructura semanas/unidades-módulos-lecciones, contenidos y recursos con acceso según permisos, progreso/RPC) |
| Actividades académicas | `activities`, `assignments`, `evaluaciones`, `progress`, `performance`, `calendar` | Implementado/adaptado (listados, detalle/estado, entregas/seguimiento, indicadores; corrección autoritativa en BD/backend) |
| Gamificación | `gamification`, `achievements`, `rankings`, `rewards`, `store`, `inventory` | Implementado (lectura/UX de XP, racha, monedas, reglas, eventos, logros, rankings, recompensas/tienda/inventario; otorgamiento/canjes autoritativos externos) |
| Juegos y retos | `games`, `game-detail`, `challenges`, `challenge-detail` | Implementado (catálogo, instancias por curso, detalle/config visible, retos, casos visibles, historial/envíos; ejecución interactiva/judge/recompensas autoritativas externas) |
| Certificados y pagos | `certificates`, `payments` | Implementado (visualización/estados/enlaces; emisión/activación/checkout/webhooks en backend) |
| Comunicación y apoyo | `notifications` (shared), `support` (shared), `chatbot` (shared), `community` | Notificaciones/soporte implementados; chatbot UI preparada; comunidad adaptada a capacidades reales |

## 6. Docente (`features/teacher`) — Fase 10
| Área | Módulos | Estado |
|---|---|---|
| Panel y perfil | `dashboard`, `profile` | Implementado |
| Cursos y contenido | `courses`, `course-editor`, `units`, `lessons`, `resources` | Implementado/adaptado (gestión de cursos asignados y estructura/contenidos según permisos/RLS) |
| Actividades y evaluación | `activities`, `assignments`, `evaluaciones`, `submissions`, `grades`, `students`, `seguimiento`, `analytics` | Implementado/adaptado (gestión y seguimiento; autoridad de corrección/calificación sensible según contrato/BD) |
| Juegos y retos | `games`, `retos` | Implementado (instancias `actividad_juego`, motores por curso, CRUD/publicación de retos; sin alterar motores base; ejecución/registro autoritativo externo) |
| Herramientas | `messages`, `calendar`, `question-bank`, `announcements`, `groups`, `preview` | Implementados/adaptados a capacidades reales (banco sin exponer respuestas sensibles, anuncios/grupos sin tablas dedicadas equivalentes, vista previa en simulación) |
| Transversales | `notifications`, `support`, `chatbot` | Disponibles (chatbot preparado) |

## 7. Administrador (`features/admin`) — Fase 11
| Área | Módulos | Estado |
|---|---|---|
| Panel y cuenta | `dashboard`, `profile`, `settings` | Implementado |
| Usuarios y acceso | `users`, `students`, `teachers`, `teacher-requests`, `roles`, `permissions` | Implementado (incl. gestión de asignaciones `docente_curso`: asignar/reactivar, activar/desactivar, responsable, eliminar) |
| Académico | `courses`, `categories`, `units`, `lessons`, `resources`, `enrollments`, `activities`, `evaluations` | Implementado/adaptado según datos y permisos |
| Juegos y gamificación | `game-engines`, `gamification`, `badges`, `events`, `rankings`, `rewards`, `store` | Implementado/adaptado (catálogo/configuración visible; autoridad de recompensas/config sensible según BD/backend) |
| Comercial y certificados | `certificates`, `orders`, `payments`, `refunds`, `coupons` | Implementado en lectura/gestión permitida; transacciones/emisión real dependen de backend |
| Operación y control | `notifications`, `support`, `reports`, `audit` | Implementado/adaptado |
| Asistente | `chatbot` (shared) | UI preparada |

## 8. Notas de cumplimiento
- No se inventan endpoints/tablas/datos ni se simulan pagos/auth/autoridad.
- Lógica sensible (pagos, corrección/ejecución, recompensas, certificados, acciones críticas) delegada a BD/RPC/backend.
- Accesibilidad/responsive/QA integral y pruebas automatizadas se consolidan en Fase 14 y mejoras continuas (ver pendientes).
