# Secciones 11-20 — Estado real tras la jornada

Última actualización: 2026-11-12. Verificado contra la BD real `nrfdifzechrjikrvzhdl`
mediante: `mvn clean test` (7/7 verdes) y una sesión E2E completa con el token del
usuario de prueba `ffd6825e-3638-45cc-aec1-26a4ef33fa85` (rol `estudiante`).

## Resumen por sección

| # | Sección | Estado | Verificación |
|---|---------|--------|--------------|
| 11 | Estudiantes | Parcial: listado/detalle por rol para admin (`GET /api/v1/admin/usuarios?rol=estudiante&q=`, `GET /api/v1/admin/usuarios/{id}`). Sin página de "cuenta estudiante" completa (datos académicos, asistencia, insignias). | 403 para estudiante ✓; compilación ✓ |
| 12 | Docentes | Parcial: flujo solicitud→aprobación existente + `GET /api/v1/admin/solicitudes-docente?estado=...` y `GET /api/v1/admin/usuarios?rol=docente`. Sin panel docente dedicado (hoja de vida, evaluaciones agregadas). | 403 para estudiante ✓; compilación ✓ |
| 13 | Cursos | Creado: crear, editar (borrador/en_revisión), enviar a revisión, publicar (admin), archivar (admin), listar admin por estado, listar docente (creados o asignados), estructura-árbol pública. Sin: eliminación de curso, duplicar curso, versionado, portada/upload, pre-requisitos, gestión de categorías. | 403 para estudiante ✓; compilación ✓ |
| 14 | Unidades/Módulos/Lecciones | CRUD completo de los tres niveles + `/estructura` (árbol) con filtrado de publicados para no-propietarios. Bloqueo de borrado con hijos/progreso. Sin: reordenar en lote, importar contenido, tipos de recurso enriquecido, recursos/material descargable. | Estructura real cargada ✓; compilación ✓ |
| 15 | Matrículas | Listar propias, inscribirse, cancelar, `docente/cursos/{slug}/estudiantes`. Sin: flujo de pago sincronizado (Culqi pendiente), matriculación masiva, lista escrita. | E2E inscripción→cancelar ✓ |
| 16 | Progreso académico | Marcar lección completada (idempotente, recomputa % de unidad y curso, sincroniza matrícula, acumula XP), `/progreso/yo`. Sin: XP automático por lección XP=0 en catálogo real, racha diaria, insignias, niveles, misiones. | E2E completo ✓ (guardado 400 sin matrícula, 5.56 % persistido, idempotencia ✓) |
| 17 | Actividades | NO implementado. | — |
| 18 | Tareas y entregas | NO implementado. | — |
| 19 | Evaluaciones | NO implementado (banco de preguntas, intentos, calificación automática). | — |
| 20 | Minijuegos y motores | NO implementado. | — |

## Verificado en vivo contra la BD de producción

1. `GET /api/v1/usuarios/yo` → 200 (DTO real).
2. `GET /api/v1/progreso/yo` → 200.
3. `GET /api/v1/matriculas/yo` → 200.
4. `GET /api/v1/cursos?page=0&size=50` → 12 cursos reales publicados.
5. `GET /api/v1/cursos/principios-algoritmos/estructura` → árbol real (3 unidades, 18 lecciones).
6. `POST /api/v1/progreso/lecciones/{id}/completar` sin matrícula → HTTP 400 ✓.
7. `POST /api/v1/matriculas/matricularme` (curso gratuito real) → HTTP 200.
8. `POST .../completar` → HTTP 200, `leccionesCompletadas=1`, `porcentajeCurso=5.56`.
9. Re-completar → HTTP 200 idempotente (sin doble XP).
10. `GET /matriculas/yo` → matrícula con `porcentajeProgreso=5.56` y XP sincronizados.
11. `DELETE /matriculas/{id}` → matrícula cancelada.
12. Guardas de rol: estudiante → 403 en `POST /cursos`, `PUT /cursos/{slug}`, `GET /admin/usuarios`, `GET /admin/solicitudes-docente`; anónimo → 401; `leccionId` inexistente → 404.

## DATOS ESCRITOS EN LA BD (limpiar/controlar)

Usuario de prueba `ffd6825e-3638-45cc-aec1-26a4ef33fa85` (rol estudiante):

- `public.matricula` fila `5cef1bf7-256d-4dbc-b372-e8a6716c22f5` (curso
  `principios-algoritmos`, hoy estado `cancelada`, `porcentajeProgreso=5.56`).
- `public.progreso_curso` (1 fila, porcentaje 5.56 %, completadas=1).
- `public.progreso_unidad` (1 fila, unidad 1, porcentaje alto).
- `public.progreso_leccion` (lección `52276577-5996-4146-ae94-458f1bd57d5c`
  — "Semana 1", estado `completado`, XP obtenido 0 porque la lección otorga 0).

SQL de purga (ejecutable por el dueño del proyecto en el SQL Editor):

```sql
delete from public.progreso_leccion
  where estudiante_id = 'ffd6825e-3638-45cc-aec1-26a4ef33fa85'
    and leccion_id = '52276577-5996-4146-ae94-458f1bd57d5c';
delete from public.progreso_unidad
  where estudiante_id = 'ffd6825e-3638-45cc-aec1-26a4ef33fa85';
delete from public.progreso_curso
  where estudiante_id = 'ffd6825e-3638-45cc-aec1-26a4ef33fa85';
delete from public.matricula
  where id = '5cef1bf7-256d-4dbc-b372-e8a6716c22f5';
```

## EL GRAN HALLAZGO: RLS no está activa en el backend

El backend nunca pudo ejecutar `set local role inkaquest_api`: el rol de conexión
`postgres` no tiene permiso en esta instancia gestionada de Supabase
(«ERROR: permission denied to set role "inkaquest_api"», SQLSTATE 42501).
Además el `dataSource.getConnection()` original ni siquiera participaba de la
transacción (conexión independiente, auto-commit) — corregido con
`DataSourceUtils`.

Hoy el código **degrada con ruido** (log WARNING una vez por proceso, la
transacción sobrevive, la autorización sigue aplicándose contra
`public.perfil`), nunca en silencio. Para activar RLS de verdad hay UNA acción
administrativa en el SQL Editor del proyecto:

```sql
GRANT inkaquest_api TO postgres;
```

Tras ella no hace falta cambiar código: el backend pasará a fijar el rol y el
contexto transaction-local (`app.current_user_id`) en cada transacción.

## Lo que NO existe (recordatorio sin maquillado)

Culqi (cobros), ejecución aislada de código de estudiante, chatbot IA,
certificados, reportes consolidados para roles, integración Angular→backend,
deploy de producción, toda la capa de escritura docente→estudiante del catálogo
informativo (17–19), y la capa cero de pruebas unitarias de servicios (los 7
tests actuales cubren contexto + esquema + repos).
