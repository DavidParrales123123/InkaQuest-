# Pendientes y dependencias del frontend

Estado actualizado al cierre de las fases 1–14 del plan de desarrollo frontend (Nov 2026). El frontend en `frontend/inkaquest-web` es una aplicación Angular funcional y navegable por roles, con integración real a Supabase/RLS/RPC donde aplica, componentes/rutas implementados o adaptados al esquema real, y sin simulación de lógica autoritativa en cliente.

## 1. Verificación realizada (Fase 14)

| Comprobación | Resultado | Notas |
|---|---|---|
| `npx tsc -p tsconfig.app.json --noEmit` | **OK** | Sin errores de tipos en la aplicación. |
| `npm run lint` / `npm run lint:fix` | **Con incidencias preexistentes** | Tras `lint:fix` quedan **53 problemas** (32 errores, 21 warnings) en archivos no introducidos en los últimos ajustes (accesibilidad/template, `viewChild` decorator, `any`, etiquetas, tipos consistentes, etc.). Requiere refactor progresivo dedicado. |
| `npm run build` | **OK** | Compilación de producción exitosa (bundle generado en `dist/inkaquest-web`). Warnings: diagnósticos Angular en algunos componentes y presupuesto de estilo excedido en `public/home` y `public/course-detail` (presupuestos ajustados en `angular.json`; estilos de landing/detalle ricos). |
| `npm run test` / `test:ci` | **No ejecutado en esta sesión** | Suite Vitest/config presente; faltan/pendientes pruebas unitarias y E2E de flujos críticos. |
| Verificación manual en navegador (responsive/accesibilidad completa) | **Pendiente** | Requiere ejecución con `ng serve`, datos/entorno configurados y revisión visual/interacción por rol. |

### Correcciones aplicadas durante validación
- `features/student/challenge-detail/challenge-detail.component.ts`: corregido marcado HTML inválido y limpieza de estructura/template.
- `features/student/performance/performance.component.ts`, `features/admin/teachers/teachers.component.ts`: corrección de `tono` inválido en `app-stat-card`.
- `shared/components/data-panel/data-panel.component.ts`: unificada acción de estado vacío (sin duplicación).
- `angular.json`: ajuste de budgets de estilos de componente para reflejar vistas ricas existentes.
- `features/public/course-catalog/course-catalog.component.ts`: reescritura con paginación y estados coherentes.
- `features/public/home/home.component.ts`: integración de cursos destacados reales y secciones de docentes/testimonios.
- Nuevas rutas/componentes: `/docentes`, `/testimonios`, `/app/chatbot` (y rutas `chatbot` en paneles estudiante/docente/admin).

## 2. Estado funcional por áreas (resumen)

- **Público (Fase 5):** home (hero, logo, lema, CTAs, ruta/cómo funciona, práctica/gamificación, cursos destacados reales, docentes/testimonios, FAQ, CTA), sobre-nosotros, catálogo con búsqueda/filtros/orden/paginación e imágenes oficiales, detalle de curso con estructura/actividades/matrícula, planes, docentes, FAQ, contacto, testimonios, verificación de certificados, términos/privacidad/pagos y 404.
- **Auth y layouts (Fase 4):** login/registro/recuperación/restablecimiento/callback, solicitud docente, layouts público/auth/panel por rol, navegación responsive, guards UX, interceptores y sesión reactiva (Supabase Auth).
- **Estudiante (Fases 6-8):** dashboard, perfil/seguridad (incl. restablecimiento contraseña), cursos/aula/unidades/lecciones/contenidos-recursos, actividades/tareas/evaluaciones, progreso/rendimiento/calendario, gamificación/logros/rankings/recompensas/tienda/inventario, retos y minijuegos (listado/detalle), certificados, pagos/matrículas, notificaciones, soporte y chatbot (UI preparada).
- **Docente (Fase 10):** dashboard/perfil, cursos y editor/estructura, lecciones/recursos, actividades/tareas/evaluaciones, minijuegos y retos (gestión por curso/lección), seguimiento/estudiantes/entregas/calificaciones/analítica, mensajes/calendario/banco-preguntas/anuncios/grupos (adaptados), vista previa y chatbot (UI preparada).
- **Admin (Fase 11):** dashboard y gestión de usuarios/estudiantes/docentes (incl. asignaciones `docente_curso`), solicitudes, roles/permisos, cursos/categorías/unidades/lecciones/recursos/matrículas, actividades/evaluaciones/motores-juegos, gamificación/insignias/eventos/rankings/recompensas/tienda, certificados, pedidos/pagos/reembolsos/cupones/reportes, notificaciones, soporte, configuración, auditoría y perfil/chatbot (UI preparada).
- **Notificaciones/soporte/chatbot (Fase 12):** centro de notificaciones y soporte con datos/acciones permitidas; chatbot con interfaz, historial/estados y servicio HTTP preparado (`/api/chatbot/*`) pendiente de backend/IA.

## 3. Bloqueantes y dependencias (no simuladas en frontend)

### 3.1 Backend REST (`backend/inkaquest-api` sin controllers/services/DTOs)
| Dependencia | Estado frontend | Requiere backend |
|---|---|---|
| Pagos Culqi (checkout, validación de precio/orden, webhooks, confirmación) y activación de matrícula | UI/lectura de matrículas-pedidos-transacciones-reembolsos, flujo guiado | Endpoints seguros, verificación de firma/proveedor, idempotencia, activación solo tras confirmación válida |
| Ejecución/evaluación segura de retos (sandbox, casos ocultos, tiempos/memoria) | CRUD/listado/detalle/envío registrado | Servicio aislado de ejecución/judge y actualización de resultados |
| Chatbot/IA | `ChatbotService` + UI compartida (`/app/chatbot`, paneles) | Endpoints de conversación/mensajes, proveedor IA, control de contexto por rol/permisos, sin claves en cliente |
| Certificados (emisión, revocación, descarga/PDF oficial transaccional) | Listado, detalle y verificación pública según datos disponibles | Emisión autorizada, plantillas/PDF, revocación/auditoría |
| Tienda/compras transaccionales | Catálogo/inventario/lecturas | Operación atómica con validación de saldo/reglas |
| Uploads/URLs firmadas server-side (cuando aplique) | Integración Storage preparada en cliente | Endpoints/firmas y validaciones adicionales si se requieren |
| Notificaciones masivas/segmentadas y operaciones admin/docente sensibles avanzadas | Vistas/acciones básicas según contratos existentes | Servicios/endpoints y reglas de negocio |

### 3.2 Autoridad en BD/RPC/motores/RLS
- Corrección autoritativa de evaluaciones y gestión de preguntas/opciones/`es_correcta`.
- Otorgamiento/registro definitivo de XP, monedas, insignias, niveles, rachas, canjes y certificaciones.
- Ejecución interactiva completa de minijuegos y registro autoritativo de intentos/resultados (motores/runtime + RPC/BD).
- Activación de acceso y visibilidad según RLS/publicación/matrícula/asignación docente.

### 3.3 Datos, configuración y entorno
- src/environments/environment.ts y environment.prod.ts: piUrl, supabaseUrl, supabaseAnonKey vacíos en repositorio (configurar por entorno sin exponer secretos).
- Supabase Auth: confirmar redirects/plantillas de correo (confirmación, recuperación) por entorno.
- **DB remota ejecutada (Nov 2026, proyecto 
rfdifzechrjikrvzhdl, idempotente vía Supabase CLI con acceso autorizado):**
  - Migraciones locales/remotas **0000–0012** verificadas como aplicadas.
  - supabase/seed/catalogo_cursos.sql aplicado (categorías/cursos publicados actualizados sin duplicados).
  - Correcciones de permisos (20260101001200_correccion_permisos.sql) reaplicadas con éxito.
  - **Datos E2E provisionados:** 12 asignaciones activas en docente_curso (docente c7942aa6-2c91-4de8-8b9f-9138fcfb9dce, responsable, asignado por admin 4a3cbe2e-eb6c-4d28-816e-8bbfe8bf2cfc) para todos los cursos publicados; 2 matrículas ctiva para estudiante 37c8521c-c61d-4407-8bd0-f78411ab4eab (principios-algoritmos, introduccion-tic).
  - Verificado: RPC/funciones n_registrar_completado_leccion y pp_is_admin presentes; buckets Storage rchivos, vatares, certificados, entregas, portadas-curso, ecursos presentes con visibilidad esperada.
- Nota: evitar re-ejecutar scripts no idempotentes fuera de los indicados.

### 3.4 Módulos adaptados por ausencia de contrato/tabla dedicada
- Anuncios, grupos personalizados, banco de preguntas independiente, foros/comunidad dedicados y configuraciones internas de catálogo de juegos: UI/estados adaptados a capacidades reales, sin datos falsos ni bypass de seguridad.

## 4. Calidad y siguientes mejoras recomendadas
- Resolver incidencias de lint progresivamente (priorizar errores de accesibilidad y tipado estricto en módulos críticos).
- Añadir pruebas unitarias (componentes, servicios, guards, interceptores, formularios) y E2E (auth por rol, matrícula/pagos guiados, aula/progreso, tareas/evaluaciones, soporte, flujos docente/admin).
- Auditoría de accesibilidad (teclado/foco/etiquetas/contraste/semántica) y responsive en dispositivos reales.
- Revisión de rendimiento/budgets y carga de datos (paginación/consultas) con datasets reales.
- Completar integración backend y contratos DTO al implementarse la API.

## 5. Criterio de cierre frontend (Fase 14)
- [x] Rutas y módulos implementados/adaptados para público, auth, estudiante, docente y admin.
- [x] Guards/interceptores/servicios/modelos y configuración centralizada.
- [x] Integración Supabase (Auth/PostgREST/Storage/RPC) sin exponer secretos; integración HTTP backend preparada.
- [x] Estados de carga/error/vacío/éxito y mensajes honestos ante dependencias pendientes.
- [x] Logo e imágenes oficiales integradas y mapeadas por curso.
- [x] TypeScript y build de producción en verde; incidencias de lint y pruebas adicionales documentadas.
- [x] Documentación de arquitectura, módulos, rutas, integración, modelos, recursos, auditoría y pendientes actualizada.
- [ ] Integración E2E con API Spring Boot + pagos/sandbox/IA/certificados transaccionales (fase backend).
