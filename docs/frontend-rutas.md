# Rutas del frontend InkaQuest

Inventario de rutas implementadas en `frontend/inkaquest-web/src/app/app.routes.ts` (lazy loading, guards UX `authGuard`/`roleGuard`). La autorización real se aplica en Spring Security y Supabase RLS.

> **Nota:** existen rutas de compatibilidad/redirección en algunos módulos para mantener navegación coherente. Las rutas listadas reflejan el tablero principal actual.

## 1. Públicas (layout `PublicLayoutComponent`)

| Ruta | Componente/área | Acceso | Descripción |
|---|---|---|---|
| `/` | `features/public/home` | Público | Inicio: hero, propuesta, ruta/cómo funciona, práctica, gamificación, cursos destacados (datos reales), docentes/testimonios, FAQ y CTA |
| `/cursos` | `features/public/course-catalog` | Público | Catálogo con búsqueda, filtros, orden y paginación |
| `/cursos/:slug` | `features/public/course-detail` | Público | Detalle de curso, estructura académica, actividades e inscripción |
| `/sobre-nosotros` | `features/public/about` | Público | Información institucional |
| `/planes` | `features/public/pricing` | Público | Planes y precios |
| `/docentes` | `features/public/teachers` | Público | Presentación del rol docente y acceso por solicitud (información honesta según permisos/RLS) |
| `/faq` | `features/public/faq` | Público | Preguntas frecuentes |
| `/contacto` | `features/public/contact` | Público | Contacto |
| `/testimonios` | `features/public/testimonials` | Público | Testimonios referenciales/ilustrativos de experiencia (sin datos inventados de usuarios) |
| `/verificar-certificado` | `features/public/certificate-verify` | Público | Verificación de certificados |
| `/verificar-certificado/:codigo` | `features/public/certificate-verify` | Público | Verificación por código |
| `/terminos` | `features/public/legal` (`tipo=terminos`) | Público | Términos y condiciones |
| `/privacidad` | `features/public/legal` (`tipo=privacidad`) | Público | Política de privacidad |
| `/pagos` | `features/public/legal` (`tipo=pagos`) | Público | Política de pagos y reembolsos |
| `/solicitar-acceso-docente` | `features/auth/teacher-request` | Autenticado | Solicitud de acceso docente (en contexto público/layout) |
| `**` | `features/public/not-found` | Público | 404 |

## 2. Autenticación (layout `AuthLayoutComponent`)

| Ruta | Componente | Acceso | Descripción |
|---|---|---|---|
| `/auth/login` | `features/auth/login` | Público | Inicio de sesión |
| `/auth/registro` | `features/auth/register` | Público | Registro de estudiante |
| `/auth/recuperar-contrasena` | `features/auth/forgot-password` | Público | Solicitud de recuperación |
| `/auth/restablecer-contrasena` | `features/auth/reset-password` | Público | Restablecimiento de contraseña |
| `/auth/callback` | `features/auth/callback` | Público | Retorno/callback de Supabase Auth |
| `/login`, `/registro`, `/recuperar-password` | redirects | Público | Alias de compatibilidad |

## 3. Estudiante (`/estudiante`, `StudentLayoutComponent`, rol `estudiante`)

| Ruta | Componente | Descripción |
|---|---|---|
| `/estudiante/dashboard` | `features/student/dashboard` | Panel principal |
| `/estudiante/perfil` | `features/student/profile` | Perfil, avatar, datos y seguridad |
| `/estudiante/cursos` | `features/student/my-courses` | Cursos inscritos y acceso |
| `/estudiante/aula/:id` | `features/student/classroom` | Aula virtual: estructura, contenidos, recursos y progreso |
| `/estudiante/unidades` | `features/student/units` | Unidades de cursos matriculados |
| `/estudiante/lecciones` | `features/student/lessons` | Lecciones de cursos matriculados |
| `/estudiante/actividades` | `features/student/activities` | Actividades publicadas |
| `/estudiante/tareas` | `features/student/assignments` | Tareas y entregas |
| `/estudiante/evaluaciones` | `features/student/evaluaciones` | Evaluaciones/intentos |
| `/estudiante/minijuegos` | `features/student/games` | Minijuegos y actividades de juego |
| `/estudiante/minijuegos/:id` | `features/student/game-detail` | Detalle de juego/motor/configuración visible |
| `/estudiante/retos` | `features/student/challenges` | Retos y envíos |
| `/estudiante/retos/:id` | `features/student/challenge-detail` | Detalle de reto y envío de solución |
| `/estudiante/progreso` | `features/student/progress` | Progreso académico |
| `/estudiante/rendimiento` | `features/student/performance` | Rendimiento/resumen |
| `/estudiante/calendario` | `features/student/calendar` | Calendario de actividades |
| `/estudiante/comunidad` | `features/student/community` | Espacio comunitario (adaptado a capacidades reales) |
| `/estudiante/gamificacion` | `features/student/gamification` | XP, racha, monedas, reglas/eventos |
| `/estudiante/insignias` | `features/student/achievements` | Insignias/logros |
| `/estudiante/rankings` | `features/student/rankings` | Rankings |
| `/estudiante/recompensas` | `features/student/rewards` | Recompensas |
| `/estudiante/tienda` | `features/student/store` | Tienda virtual |
| `/estudiante/inventario` | `features/student/inventory` | Inventario |
| `/estudiante/certificados` | `features/student/certificates` | Certificados |
| `/estudiante/pagos` | `features/student/payments` | Matrículas, pedidos, transacciones y reembolsos |
| `/estudiante/notificaciones` | `features/shared/notifications` | Notificaciones |
| `/estudiante/soporte` | `features/shared/support` | Soporte/tickets |
| `/estudiante/chatbot` | `features/shared/chatbot` | Asistente (UI e integración backend preparada) |

## 4. Docente (`/docente`, `TeacherLayoutComponent`, rol `docente`)

| Ruta | Componente | Descripción |
|---|---|---|
| `/docente/dashboard` | `features/teacher/dashboard` | Panel docente |
| `/docente/perfil` | `features/teacher/profile` | Perfil y cuenta |
| `/docente/cursos` | `features/teacher/courses` | Cursos asignados |
| `/docente/cursos/:id` | `features/teacher/course-editor` | Gestión/edición de curso y estructura |
| `/docente/unidades` | `features/teacher/units` | Unidades |
| `/docente/lecciones` | `features/teacher/lessons` | Lecciones |
| `/docente/recursos` | `features/teacher/resources` | Recursos |
| `/docente/actividades` | `features/teacher/activities` | Actividades/tareas por curso-lección |
| `/docente/tareas` | `features/teacher/assignments` | Tareas |
| `/docente/evaluaciones` | `features/teacher/evaluaciones` | Evaluaciones |
| `/docente/minijuegos` | `features/teacher/games` | Instancias de juego y motores por curso |
| `/docente/retos` | `features/teacher/retos` | Retos de programación |
| `/docente/estudiantes` | `features/teacher/students` | Estudiantes |
| `/docente/seguimiento` | `features/teacher/seguimiento` | Seguimiento académico |
| `/docente/entregas` | `features/teacher/submissions` | Entregas |
| `/docente/calificaciones` | `features/teacher/grades` | Calificaciones |
| `/docente/analitica` | `features/teacher/analytics` | Analítica |
| `/docente/vista-previa` | `features/teacher/preview` | Vista previa (simulación, sin afectar datos reales) |
| `/docente/mensajes` | `features/teacher/messages` | Mensajes |
| `/docente/calendario` | `features/teacher/calendar` | Calendario |
| `/docente/banco-preguntas` | `features/teacher/question-bank` | Banco (adaptado, sin exponer respuestas sensibles) |
| `/docente/anuncios` | `features/teacher/announcements` | Anuncios (adaptado) |
| `/docente/grupos` | `features/teacher/groups` | Grupos/cohortes |
| `/docente/notificaciones` | `features/shared/notifications` | Notificaciones |
| `/docente/soporte` | `features/shared/support` | Soporte |
| `/docente/chatbot` | `features/shared/chatbot` | Asistente (UI e integración backend preparada) |

## 5. Administrador (`/admin`, `AdminLayoutComponent`, rol `administrador`)

| Ruta | Componente | Descripción |
|---|---|---|
| `/admin/dashboard` | `features/admin/dashboard` | Panel administrativo |
| `/admin/usuarios` | `features/admin/users` | Usuarios |
| `/admin/estudiantes` | `features/admin/students` | Estudiantes |
| `/admin/docentes` | `features/admin/teachers` | Docentes y asignaciones `docente_curso` |
| `/admin/solicitudes` | `features/admin/teacher-requests` | Solicitudes docentes |
| `/admin/roles` | `features/admin/roles` | Roles |
| `/admin/permisos` | `features/admin/permissions` | Permisos |
| `/admin/cursos` | `features/admin/courses` | Cursos (y visibilidad de docentes asignados) |
| `/admin/categorias` | `features/admin/categories` | Categorías |
| `/admin/unidades` | `features/admin/units` | Unidades |
| `/admin/lecciones` | `features/admin/lessons` | Lecciones |
| `/admin/recursos` | `features/admin/resources` | Recursos |
| `/admin/matriculas` | `features/admin/enrollments` | Matrículas |
| `/admin/actividades` | `features/admin/activities` | Actividades |
| `/admin/evaluaciones` | `features/admin/evaluations` | Evaluaciones |
| `/admin/motores-juegos` | `features/admin/game-engines` | Motores/juegos |
| `/admin/gamificacion` | `features/admin/gamification` | Gamificación |
| `/admin/insignias` | `features/admin/badges` | Insignias |
| `/admin/eventos` | `features/admin/events` | Eventos |
| `/admin/rankings` | `features/admin/rankings` | Rankings |
| `/admin/recompensas` | `features/admin/rewards` | Recompensas |
| `/admin/tienda` | `features/admin/store` | Tienda |
| `/admin/certificados` | `features/admin/certificates` | Certificados |
| `/admin/pedidos` | `features/admin/orders` | Pedidos |
| `/admin/pagos` | `features/admin/payments` | Pagos/transacciones |
| `/admin/reembolsos` | `features/admin/refunds` | Reembolsos |
| `/admin/cupones` | `features/admin/coupons` | Cupones |
| `/admin/reportes` | `features/admin/reports` | Reportes |
| `/admin/notificaciones` | `features/admin/notifications` | Notificaciones |
| `/admin/soporte` | `features/admin/support` | Soporte |
| `/admin/configuracion` | `features/admin/settings` | Configuración |
| `/admin/auditoria` | `features/admin/audit` | Auditoría |
| `/admin/perfil` | `features/admin/profile` | Perfil admin |
| `/admin/chatbot` | `features/shared/chatbot` | Asistente (UI e integración backend preparada) |

## 6. Zona compartida autenticada

| Ruta | Componente | Acceso | Descripción |
|---|---|---|---|
| `/app/notificaciones` | `features/shared/notifications` | Autenticado | Notificaciones del usuario |
| `/app/soporte` | `features/shared/support` | Autenticado | Soporte/tickets del usuario |
| `/app/chatbot` | `features/shared/chatbot` | Autenticado | Asistente (UI e integración backend preparada) |

## 7. Notas
- Todas las rutas de funcionalidad usan `loadComponent` (lazy loading).
- Los guards de frontend son de UX; la seguridad efectiva depende de Supabase RLS y, cuando exista, Spring Security en backend.
- Algunas rutas/vistas muestran estados vacíos o adaptados cuando no hay datos, permisos o contratos backend equivalentes.
