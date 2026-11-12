# Auditoría inicial obligatoria — Fase 1 (InkaQuest)

**Fecha:** 2026-11-11  
**Alcance:** frontend `frontend/inkaquest-web`, backend `backend/inkaquest-api`, esquema/datos Supabase (remoto), recursos visuales oficiales y documentación existente.  
**Tipo:** diagnóstico técnico y funcional basado en inspección directa del repositorio y del estado reportado/verificado en la sesión de trabajo (sin invención de endpoints, tablas, contratos ni datos).

> Esta auditoría consolida la Fase 1 del plan maestro. Los hallazgos alimentan las fases siguientes (arquitectura/diseño, recursos visuales, layouts/auth, módulos por rol, integraciones y validación).

## 1. Rutas y ubicación del proyecto (obligatorias)

| Elemento | Ruta inspeccionada | Estado |
|---|---|---|
| Directorio principal | `C:\Users\david\Desktop\Proyecto inkaquest desde cero` | Existe. **No es repositorio git**; cambios de trabajo sin commit. |
| Frontend | `...\frontend\inkaquest-web` | Existe. Todo el trabajo frontend se realiza aquí (sin crear otro proyecto Angular). |
| Recursos visuales oficiales (fuente externa) | `C:\Users\david\Desktop\proyecto mejorado\imagen` | Existe (13 archivos). **Solo lectura de referencia**: no se modifican ni eliminan originales. |
| Backend | `...\backend\inkaquest-api` | Existe (Maven, Java/Spring Boot). |
| Supabase/migraciones/seed | `...\supabase\migrations`, `...\supabase\seed` | Existen; migraciones 0000–0012 aplicadas en remoto según contexto verificado. |
| Documentación | `...\docs` | Existe (docs frontend + base-de-datos/arquitectura/seguridad/despliegue). |

## 2. Frontend — stack, dependencias y configuración

### 2.1 Identidad y versiones (`frontend/inkaquest-web/package.json`)
- **Aplicación:** `inkaquest-web` (v0.1.0), SPA, `private: true`, `packageManager: npm@11.19.1`, `engines.node: ^22.22.3 || ^24.15.0 || >=26.0.0` (corregido en auditoría 2026-11-12).
- **Angular:** `^22.2.0` (`@angular/core`, `common`, `compiler`, `forms`, `platform-browser`, `router`).
- **Runtime/estado/reactividad:** `rxjs ~7.8.0`, `zone.js ^0.15.1`, componentes standalone y uso de Signals/RxJS según arquitectura del proyecto.
- **UI/visualización/iconos:** `tailwindcss ^4.1.13` + `@tailwindcss/postcss`, `lucide-angular ^1.71.0`, `chart.js ^4.6.1`.
- **Integración datos/auth:** `@supabase/supabase-js ^2.119.0`.
- **Calidad/tooling (dev):** Angular CLI/build `^22.2.0`, TypeScript `~6.0.2`, ESLint/`angular-eslint`, Prettier, Vitest/jsdom, `ng-packagr`, Sass.
- **Scripts:** `start` (`ng serve`), `build`/`build:dev`/`build:prod`, `watch`, `lint`/`lint:fix`, `format`/`format:check`, `test`/`test:ci`.

### 2.2 Configuración Angular (`angular.json`, `app.config.ts`, `tsconfig*`)
- **Builder:** `@angular/build:application` (entrada `src/main.ts`, `index.html`, polyfills `zone.js`, estilos `src/tailwind.css` + `src/styles.scss`, assets `public/` y `src/assets` → `assets/`).
- **Schematics por defecto:** componente `scss`, `changeDetection: OnPush`, `standalone: true`.
- **Producción:** `outputHashing: all`, budgets `initial 500kB/1MB (warn/error)` y `componentStyle 4kB/8kB`; **development:** sin optimización/sourcemaps/licencias extraídas.
- **Providers globales (`src/app/app.config.ts`):** `provideBrowserGlobalErrorListeners`, `provideZoneChangeDetection({ eventCoalescing: true })`, `provideRouter(routes, withComponentInputBinding(), withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }))`, `provideHttpClient(withFetch(), withInterceptors([authInterceptor, errorInterceptor]))`, `APP_CONFIG` inyectado con `APP_CONFIG_VALUE`.
- **TypeScript estricto:** `tsconfig.json` con `strict`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `target/module ES2022`, `experimentalDecorators`, `skipLibCheck`. `tsconfig.app.json` incluye `src/**/*.ts` y excluye specs.
- **Estado de compilación conocido:** `npx tsc -p tsconfig.app.json --noEmit` en verde tras los últimos cambios registrados (según contexto de trabajo).

### 2.3 Variables de entorno (`src/environments/`)
- `environment.ts` y `environment.prod.ts` existen pero **`apiUrl`, `supabaseUrl`, `supabaseAnonKey` están vacíos** (configuración pública pendiente por entorno; credenciales sensibles fuera del cliente).
- `core/config/app-config.ts` centraliza parámetros públicos de la aplicación (inyectado como `APP_CONFIG`).

### 2.4 Estilos y Tailwind
- **Tailwind v4:** `src/tailwind.css` con `@import "tailwindcss"` y `@theme` (tokens: colores institucionales `navy #1B2A4A`, `teal #12736B`, `gold #F2A541`, `surface #EAF3F2`, `inkared #B3002D`; tipografías `Poppins`/`Inter`; escalas de color por rol; sombras). PostCSS configurado (`postcss.config.json`, `@tailwindcss/postcss`).
- **Estilos globales:** `src/styles.scss` (base tipográfica, normalizaciones/ajustes globales del proyecto).
- **Lint/formato:** `eslint.config.js`, `.prettierrc`, `.editorconfig` presentes.

## 3. Estructura del frontend (inspección)

### 3.1 Árbol principal (`src/app`)
- **`core/`**: `config` (1), `guards` (1: `auth.guard.ts` con `authGuard`/`roleGuard`), `interceptors` (2: `auth.interceptor.ts`, `error.interceptor.ts`), `models` (1: `domain.models.ts`), `services` (19), `tokens` (1: `api.tokens.ts`), `README.md`.
- **`shared/`**: componentes reutilizables `button`, `course-card`, `data-panel`, `empty-state`, `logo`, `page-header`, `skeleton`, `stat-card`, `status-badge`; utilidades `curso-imagen.util.ts`; `README.md`.
- **`layouts/`**: `public-layout` (+ `navbar`, `footer`), `auth-layout`, `panel-layout`, `student-layout`, `teacher-layout`, `admin-layout`.
- **`features/`**: `public` (10), `auth` (6), `student` (25 directorios), `teacher` (23), `admin` (33), `shared` (2: `notifications`, `support`), `home` (1) — componentes standalone con lazy loading por ruta.
- **Raíz app:** `app.ts/html/scss`, `app.config.ts`, `app.routes.ts` (tablero central de rutas; ~113 entradas `path:` detectadas), `app.spec.ts`.

### 3.2 Servicios (`core/services`, 19)
`activity`, `admin`, `api-client`, `auth`, `certificate`, `challenge`, `course`, `enrollment`, `evaluation`, `game`, `gamification`, `notification`, `payment`, `progress`, `reward`, `storage`, `supabase`, `support`, `teacher`.  
- Consumo principal vía Supabase/PostgREST (anon key + RLS) y Storage; `api-client`/interceptor preparados para API REST Spring Boot (`/api`) cuando existan endpoints.
- Servicios de dominio implementados/adaptados al esquema real (p. ej. `game`, `activity`, `challenge`, `admin`/asignaciones `docente_curso`, `progress`/RPC, mensajería/soporte/notificaciones según tablas disponibles) con tipado y manejo de estados/errores en la capa de UI.

### 3.3 Guards e interceptores
- **Guards (UX):** `authGuard`, `roleGuard` (`core/guards/auth.guard.ts`) — redirigen a login/denegado según sesión/rol; **la autorización real reside en Spring Security y Supabase RLS**.
- **Interceptors:** `auth.interceptor.ts` (adjunta contexto de sesión/token cuando aplica), `error.interceptor.ts` (normalización/manejo centralizado de errores HTTP/operación).

### 3.4 Modelos/tokens (`core/models`, `core/tokens`)
- `domain.models.ts`: contratos/modelos tipados alineados al esquema (incluye entidades de mensajería como `Mensaje` y modelos usados por módulos académico/evaluación/juegos/progreso, etc.). Alineación continua requerida frente a esquema real/DTOs futuros (sin duplicar ni inventar propiedades).
- `api.tokens.ts`: tokens de inyección para configuración/capa API.

### 3.5 Rutas y navegación (resumen por áreas)
Definidas en `src/app/app.routes.ts` con **lazy loading** y protección por rol:
- **Públicas (`PublicLayout`):** `/` (home), `/inicio`, `/sobre-nosotros`, `/cursos`, `/cursos/:id`, `/planes`, `/docentes`, `/faq`, `/contacto`, `/testimonios`, `/verificar-certificado/:codigo`, legales, `/solicitar-acceso-docente` (auth), `**` → 404.
- **Auth (`AuthLayout`):** `/auth/login`, `/auth/registro`, `/auth/recuperar-contrasena`, `/auth/restablecer-contrasena`, `/auth/callback`, + aliases `/login`, `/registro`, `/recuperar-password`.
- **Estudiante (`StudentLayout`, `authGuard` + `roleGuard(estudiante)`):** dashboard, perfil, cursos/mis-cursos, aula `:id`, unidades/lecciones, actividades/tareas/evaluaciones, minijuegos + `:id`, retos + `:id`, progreso/rendimiento, gamificación/logros/rankings/recompensas/tienda/inventario, certificados, pagos, notificaciones, soporte, calendario, comunidad (con redirects de compatibilidad).
- **Docente (`TeacherLayout`, rol `docente`):** dashboard, perfil, cursos + editor `:id`, unidades/lecciones/recursos, actividades/tareas/evaluaciones/minijuegos/retos, estudiantes/seguimiento, entregas/calificaciones, analítica, vista previa, mensajes, calendario, banco-preguntas (adaptado), anuncios (adaptado), grupos (cohortes).
- **Admin (`AdminLayout`, rol `administrador`):** dashboard, usuarios/estudiantes/docentes/solicitudes, roles/permisos, cursos/categorías/unidades/lecciones/recursos/matrículas, actividades/evaluaciones/motores-juegos, gamificación/insignias/eventos/rankings/recompensas/tienda, certificados, pedidos/pagos/reembolsos/cupones/reportes, notificaciones, soporte, configuración, auditoría, perfil.
- **Zona compartida autenticada:** `/app/notificaciones`, `/app/soporte`.

## 4. Recursos visuales oficiales (origen vs frontend)

### 4.1 Origen externo (`C:\Users\david\Desktop\proyecto mejorado\imagen`, 13 archivos)
- `logo.png`
- 12 portadas de cursos (nombres con caracteres especiales/codificación en filesystem): *Algoritmos y Estructuras de Datos*, *Análisis y Diseño de Algoritmos*, *Base de Datos 1*, *Base de Datos 2*, *Diseño de patrones*, *Introducción a las TIC*, *Principios de Algoritmos*, *Programación Orientada a Objetos*, *Redes y comunicación de datos 1*, *Sistemas Operativos*, *Taller de Programación Java*, *Taller de Programación Web*.

### 4.2 Frontend (`src/assets/images`)
- **Organización:** `brand/` (`logo.png`, `logo.webp`), `courses/` (24 archivos: 12 cursos en `.png` y `.webp`), `inventario.json`.
- **Directorios requeridos por convención aún vacíos/no poblados:** `icons/`, `illustrations/`, `other/` (no existen como carpetas con contenido en el árbol actual).
- **Uso:** `shared/utilities/curso-imagen.util.ts` mapea cursos→imagen; `shared/components/logo` y layouts/páginas consumen logo/portadas. **Verificación pendiente por Fase 3/14:** cobertura en todas las interfaces exigidas (navbar, home, auth, footer, paneles estudiante/docente/admin, catálogo/detalle/cursos inscritos, etc.) y carga correcta en build/serve.
- **Documentación:** `docs/recursos-visuales.md` existe (inventario y notas); debe mantenerse/actualizarse con correspondencia exacta curso↔archivo, ubicaciones finales e interfaces de uso tras verificación.

## 5. Backend Spring Boot (`backend/inkaquest-api`)

- **Estructura:** `src/main/java/com/inkaquest` con `InkaQuestApplication.java` y módulos por dominio: `academico`, `auditoria`, `certificados`, `chatbot`, `comercio`, `evaluaciones`, `gamificacion` (entre otros presentes en árbol) compuestos por **entidades JPA y repositorios**.
- **API REST:** **no se encontraron `*Controller*` ni `*Dto*`** en `src/main/java` (0 controllers, 0 services de aplicación REST expuestos, 0 DTOs). `target/` contiene artefactos compilados/reportes de tests previos.
- **Implicación:** no hay endpoints REST operativos para consumo desde `ApiClientService`; funcionalidades que requieren backend (Culqi/checkout/webhooks y activación de matrícula, ejecución segura/judge de retos, chatbot/IA, URLs firmadas/uploads server-side, emisión/revocación/descarga oficial de certificados, compras transaccionales, notificaciones masivas, operaciones admin/docente sensibles avanzadas) quedan **pendientes de implementación backend** y deben integrarse sin simularse en cliente.
- **DTOs/contratos:** inexistentes en backend; modelos frontend deben alinearse a esquema real y a futuros contratos cuando se definan.

## 6. Base de datos Supabase (remoto)

- **Proyecto:** `nrfdifzechrjikrvzhdl` (producción).
- **Esquema (estado verificado en contexto):** 121 tablas con RLS habilitado, 0 tablas sin política, 212 políticas, 56 funciones, 6 buckets de Storage.
- **Correcciones aplicadas en BD (idempotentes/funcionales):** políticas `pol_tarea_select`, `pol_evaluacion_select`; función `public.fn_registrar_completado_leccion` creada con `GRANT EXECUTE` a `authenticated`.
- **Datos/seed relevantes:** `catalogo_cursos.sql` ejecutado (7 categorías activas, 12 cursos publicados); 96 motores activos y 96 juegos publicados insertados.
- **Datos operativos actuales:** 1 docente, **0** asignaciones `docente_curso`, **0** matrículas (condiciona flujos E2E de docente/estudiante).
- **Storage:** bucket `recursos` privado (acceso por matrícula/docente/admin según políticas), `avatares` y `portadas-curso` públicos (verificar configuración/uso efectivo en UI).
- **Visibilidad/reglas de negocio:** elementos visibles según publicación y pertenencia (curso publicado, contenido publicado, estructura/lección, matrícula activa/completada para progreso y archivos en `recursos`, asignación docente activa en `docente_curso`). Autoridad en BD/RPC/RLS/backend (no en cliente).

## 7. Documentación existente (inspeccionada)

- **Frontend:** `docs/frontend-arquitectura.md`, `frontend-modulos.md`, `frontend-rutas.md`, `frontend-integracion-backend.md`, `frontend-modelos.md`, `frontend-pendientes.md`, `recursos-visuales.md`.
- **Transversal:** `docs/README.md`, `docs/base-de-datos/*` (diccionario, ER, relaciones, RLS, funciones/triggers, índices, migraciones, integración Spring Boot, etc.), `docs/arquitectura/*`, `docs/seguridad/MODELO-SEGURIDAD.md`, `docs/backend/CONFIGURACION-SPRING-BOOT.md`, `docs/frontend/CONFIGURACION-ANGULAR.md`, `docs/despliegue/ESTRATEGIA-VERCEL-BACKEND.md`.
- **Observación:** los docs frontend describen arquitectura e inventario iniciales; requieren actualización tras completar/ajustar módulos y verificaciones de fases 2–14 (sin perder información válida).

## 8. Funcionalidades implementadas (resumen verificado por estructura/cambios)

- **Base:** app Angular 22 standalone, router lazy, layouts por rol, guards/interceptores, `APP_CONFIG`, cliente Supabase y `ApiClientService`, modelos/servicios de dominio, componentes compartidos, mapeo de imágenes de curso, integración Storage preparada.
- **Público/Auth:** páginas públicas principales y auth (login/registro/recuperación/restablecimiento/callback/solicitud docente) con rutas y layouts.
- **Estudiante:** dashboard/perfil/cursos-aula/unidades-lecciones/actividades-tareas-evaluaciones/progreso-gamificación/logros-rankings-recompensas-tienda-inventario/certificados/pagos/notificaciones/soporte + `classroom`, `assignments`, `performance`, `calendar`, `community`, detalle de retos y minijuegos (`retos/:id`, `minijuegos/:id`) y enlaces.
- **Docente:** dashboard/perfil/cursos-editor/unidades-lecciones-recursos/tareas-entregas-calificaciones/estudiantes/evaluaciones/analítica/vista previa + `activities`, `games` (instancias/motores por curso), `retos` (CRUD/publicación), `messages`, `calendar`, `seguimiento`, `question-bank` (adaptado), `announcements` (adaptado), `groups` (cohortes).
- **Admin:** dashboard y gestión de entidades/áreas listadas en rutas; `/admin/docentes` con listado de **todos** los docentes y gestión de asignaciones `docente_curso` (asignar/reactivar, activar/desactivar, responsable, eliminar) y visibilidad en `/admin/cursos`.
- **BD/semillas de soporte:** políticas y RPC de progreso aplicadas; catálogos/cursos y motores/juegos publicados sembrados para habilitar flujos de catálogo.

## 9. Funcionalidades parciales, adaptadas o pendientes (brechas principales)

| Área | Estado | Dependencia / nota |
|---|---|---|
| Entornos (`environment*`) | Pendiente de configurar valores reales | `apiUrl/supabaseUrl/supabaseAnonKey` vacíos; no exponer secretos. |
| Backend REST (controllers/services/DTOs) | **Ausente** | Requerido para pagos Culqi/webhooks/activación matrícula, judge/ejecución segura de retos, chatbot IA, URLs firmadas, emisión/revocación/descarga oficial certificados, compras transaccionales tienda, notificaciones masivas y operaciones sensibles avanzadas. **Preparar integración, no simular.** |
| Pagos/matrículas (flujo real) | Parcial (UI/consulta preparada) | Activación solo tras confirmación válida en backend; sin almacenar datos sensibles de tarjeta; precios validados en servidor. |
| Evaluaciones autoritativas | Parcial | Corrección y gestión de preguntas/opciones/`es_correcta` no en cliente; depende de BD/RPC/backend. |
| Minijuegos (ejecución completa) | Parcial | Catálogo/instancias/config y motores por curso gestionables; ejecución interactiva completa/registro autoritativo de resultados y recompensas depende de motores/runtime/BD. |
| Retos de programación | Parcial | CRUD/visualización/envío registrado; ejecución de código debe ser servicio backend aislado y seguro (no en Angular/Spring monolítico directo). |
| Gamificación/recompensas/certificados (otorgamiento) | Parcial (lectura/UX) | XP, monedas, insignias, niveles, rachas, canjes y emisión deben ser validados/registrados por backend/BD. |
| Módulos sin contrato/tablas dedicadas | Adaptados | Anuncios, grupos personalizados, banco de preguntas independiente, foros/comunidad dedicados: UI/estados claros sobre capacidades reales, sin datos falsos. |
| Datos de prueba para E2E | Insuficiente | 0 asignaciones `docente_curso`, 0 matrículas; requiere asignación, cursos/estructura/contenidos publicados y matrículas activas según RLS. |
| Recursos visuales (cobertura UI) | Parcialmente verificado | 13 originales → assets organizados (logo + 12 cursos png/webp); faltan poblar/verificar `icons/illustrations/other` y confirmar uso del logo/portadas en **todas** las interfaces exigidas. |
| Pruebas y calidad integral | Parcial | `tsc` OK; pendientes `lint`, `build`, `test`/`test:ci`, revisión de rutas/recursos/responsive/accesibilidad y correcciones. |

## 10. Riesgos y restricciones de seguridad/arquitectura (a respetar)

- **No** exponer `service_role`, claves privadas, secretos Culqi/IA, credenciales de BD ni tokens administrativos en Angular.
- **No** decidir en cliente XP/insignias/monedas/recompensas, corrección de evaluaciones/retos, activación de matrícula ni emisión/revocación de certificados.
- Guards frontend = UX; autorización real = **Spring Security + Supabase RLS**.
- No ejecutar código arbitrario en Angular; no simular pagos/auth reales; no inventar endpoints/tablas/propiedades; no duplicar modelos/servicios/código; conservar trabajo correcto y motores/juegos existentes.

## 11. Plan de ejecución por fases (estado)

| Fase | Objetivo | Estado |
|---|---|---|
| 1 | Auditoría inicial (proyecto, stack, rutas/módulos/servicios/modelos/guards/interceptores, estilos/config, Supabase, backend/DTOs, recursos, estado y brechas) | **Completada (este documento)** |
| 2 | Configuración Angular, estructura, arquitectura y sistema de diseño | Pendiente de verificación/ajustes |
| 3 | Integración del logo, imágenes de cursos y recursos oficiales | Pendiente de verificación completa de cobertura |
| 4 | Layouts, navegación, componentes compartidos y autenticación | Implementado base; verificar completitud/UX/estados |
| 5 | Interfaces públicas y catálogo | Implementado base; verificar requisitos completos |
| 6 | Panel del estudiante | Implementado/adaptado; verificar completitud por prompt |
| 7 | Aula virtual y módulos académicos | Implementado/adaptado; verificar completitud |
| 8 | Gamificación, minijuegos y retos | Implementado/adaptado con límites de autoridad/runtime |
| 9 | Pagos, matrículas y certificados | Parcial/preparado; depende de backend para flujo real |
| 10 | Panel del docente | Implementado/adaptado; verificar completitud |
| 11 | Panel del administrador | Implementado/adaptado; verificar completitud |
| 12 | Notificaciones, soporte y chatbot | Parcial/preparado; chatbot/acciones sensibles dependen de backend |
| 13 | Integración completa con backend y Supabase | Parcial (Supabase activo, backend REST ausente) |
| 14 | Pruebas, correcciones, optimización y compilación final | Pendiente ejecución integral |

## 12. Conclusión de Fase 1

El frontend cuenta con una base sólida (Angular 22 standalone, Tailwind v4, Supabase, arquitectura por dominios, rutas lazy y paneles por rol con múltiples módulos implementados o adaptados al esquema real) y documentación/recursos iniciales disponibles. Las principales brechas para alcanzar el alcance completo del prompt son: **configuración de entornos**, **ausencia de API REST/DTOs en backend** (bloquea flujos transaccionales/seguros/autoritativos), **autoridad de negocio en BD/RPC/motores** (evaluaciones, recompensas, ejecución), **datos E2E** (asignaciones/matrículas) y **verificación integral** (cobertura visual, calidad, responsive, accesibilidad, build/tests). Las fases siguientes deben cerrar lo implementable en frontend, dejar integraciones pendientes explícitas y documentadas, y validar sin afirmar funcionalidades no verificadas.
