# Arquitectura del frontend InkaQuest

Documento actualizado al cierre de fases 1–14. Describe la arquitectura real implementada en `frontend/inkaquest-web`.

## 1. Resumen técnico
- **Framework:** Angular 22 (standalone components, lazy loading por rutas).
- **Lenguaje:** TypeScript estricto.
- **Estilos:** Tailwind CSS v4 + estilos globales/componentes (`tailwind.css`, `styles.scss`, `styles/theme.css`) con tokens de identidad InkaQuest.
- **Estado/reactividad:** Angular Signals y RxJS.
- **Formularios:** Reactive Forms.
- **HTTP:** `HttpClient` con interceptores.
- **Integración:** Supabase (`@supabase/supabase-js`) para Auth/PostgREST/Storage/RPC; capa preparada para API REST Spring Boot.
- **UI/recursos:** componentes compartidos, Chart.js y Lucide disponibles en dependencias, assets oficiales en `src/assets/images`.

## 2. Estructura principal (`src/app`)

| Capa | Propósito | Contenido representativo |
|---|---|---|
| `core/config` | Configuración centralizada | `app-config.ts`, `APP_CONFIG` |
| `core/guards` | Protección UX de rutas | `auth.guard.ts` (`authGuard`, `roleGuard`) |
| `core/interceptors` | Cross-cutting HTTP | `auth.interceptor.ts`, `error.interceptor.ts` |
| `core/models` | Contratos tipados | `domain.models.ts` (alineado a esquema real, evolución según DTOs futuros) |
| `core/services` | Lógica de acceso a datos/dominio | `auth`, `supabase`, `api-client`, `course`, `enrollment`, `progress`, `activity`, `evaluation`, `game`, `challenge`, `gamification`, `reward`, `payment`, `certificate`, `notification`, `support`, `teacher`, `admin`, `storage`, `chatbot` |
| `core/tokens` | Inyección/config | tokens API |
| `shared/components` | UI reutilizable | `logo`, `button`, `page-header`, `course-card`, `data-panel`, `empty-state`, `skeleton`, `stat-card`, `status-badge` |
| `shared/utilities` | Utilidades puras | `curso-imagen.util.ts` |
| `layouts` | Shells de navegación | `public-layout` (+ navbar/footer), `auth-layout`, `panel-layout`, `student-layout`, `teacher-layout`, `admin-layout` |
| `features/public` | Sitio público | home, about, catálogo, detalle curso, planes, docentes, faq, contacto, testimonios, verificación certificado, legal, not-found |
| `features/auth` | Autenticación y flujos de acceso | login, registro, recuperar/restablecer, callback, solicitud docente |
| `features/student` | Panel estudiante | dashboard, perfil, cursos/aula/unidades/lecciones, actividades/tareas/evaluaciones, juegos/retos (detalle), progreso/rendimiento, gamificación/logros/rankings/recompensas/tienda/inventario, certificados, pagos, calendario/comunidad |
| `features/teacher` | Panel docente | dashboard/perfil/cursos-editor, contenido/recursos, actividades/tareas/evaluaciones, juegos/retos, seguimiento/entregas/calificaciones/analítica, mensajes/calendario, módulos adaptados (banco/anuncios/grupos), vista previa |
| `features/admin` | Panel administrador | dashboard, usuarios/roles/permisos, gestión académica/comercial/gamificación/certificados, notificaciones/soporte/reportes/configuración/auditoría, asignaciones docentes |
| `features/shared` | Módulos transversales autenticados | notificaciones, soporte, chatbot |

## 3. Enrutamiento y navegación
- Definición central: `app.routes.ts`.
- **Estrategia:** `loadComponent` (lazy loading) en todas las áreas funcionales.
- **Layouts:** público, auth y paneles por rol; zona compartida `/app/*` autenticada.
- **Protección UX:** `authGuard` y `roleGuard` por rutas/roles.
- **Rutas destacadas añadidas/completadas:** `/docentes`, `/testimonios`, paginación en catálogo, detalle de retos/minijuegos estudiante, rutas `chatbot` en paneles y `/app/chatbot`.

## 4. Flujo de datos y seguridad
- **Lectura/escritura:** servicios de dominio → Supabase PostgREST/Storage/RPC bajo RLS; operaciones sensibles/transaccionales delegadas a backend/BD cuando corresponde.
- **Auth:** sesión Supabase, perfil en `public.perfil`, reacción a cambios/expiración.
- **HTTP backend:** `ApiClientService` + interceptores listos para endpoints REST (`/api`) con JWT.
- **Principio:** el cliente no decide precios finales, activaciones de matrícula, corrección/ejecución autoritativa, recompensas/certificaciones ni acciones sensibles; muestra estados y contratos pendientes honestamente.

## 5. Diseño, UX y recursos
- **Identidad:** paleta/tipografías/tokens institucionales (navy/teal/gold/surface/red), lema “APRENDE · CODIFICA · AVANZA”.
- **Componentes de estado:** skeleton/carga, vacío, error (reintento), éxito/feedback, badges de estado.
- **Responsive/accesibilidad base:** layouts adaptables, navegación móvil, etiquetas/roles/atributos en componentes clave; mejoras progresivas pendientes de QA integral.
- **Recursos:** logo y portadas oficiales en `src/assets/images/{brand,courses,...}` con mapeo `curso-imagen.util.ts`; inventario en `docs/recursos-visuales.md`.

## 6. Decisiones y límites
- Consumo primario Supabase por disponibilidad de esquema/RLS y ausencia de API REST en backend.
- Módulos sin tabla/contrato dedicado implementados con adaptación y estados claros (sin datos falsos).
- Chatbot implementado a nivel UI/servicio preparado; respuestas/acciones reales dependen de backend seguro.
- Backend `inkaquest-api`: entidades/repositorios presentes, **sin controllers/services/DTOs REST**.

## 7. Calidad (Fase 14)
- `tsc -p tsconfig.app.json --noEmit`: OK.
- `ng build` (producción): OK (warnings de diagnósticos y budgets de estilo en vistas ricas).
- `lint`: incidencias preexistentes documentadas; refactor progresivo recomendado.
- Pruebas automatizadas/E2E y QA visual completa: pendientes (ver `docs/frontend-pendientes.md`).
