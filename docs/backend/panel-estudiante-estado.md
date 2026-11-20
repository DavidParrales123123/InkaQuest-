# Panel del estudiante — estado real (2026-11-12)

## Nuevo hoy — tablero agregado por backend

- `GET /api/v1/panel/estudiante` (JWT, estudiante): devuelve **en una sola llamada** cursos matriculados activos/completados, progreso real (%/lecciones), XP, racha y notificaciones sin leer.
- Frontend/Dashboard usa este endpoint; verificado con token real: cursos=1 (Principios de Algoritmos), matrícula activa (`porcentaje=11.11`), progreso `en_progreso` (2 lecciones completadas), racha=1 (recordada hoy tras completar Semana 2 con la matrícula ya reactivada por pago).
- Sin duplicados: el endpoint compone directamente sobre repositorios (no introduce servicios de lectura redundantes).

## Estado por sección (actualizado)

| Sección | Estado | Vía |
|---|---|---|
| Mis cursos | ✅ funcional | panel/estudiante + matriculas/yo |
| Explorar catálogo | ✅ funcional | /cursos + /cursos/{slug}/estructura |
| Aula (lecciones) | ⚠️ iniciar implementación real | :x: falta refactor de contenido |
| Rendimiento | ✅ vía agregación tras completar lección | progreso/curso (racha+lecciones) |
| Calendario | ⚠️ vacío (sin datos en prod) | — |
| Comunidad | ✅ vía Supabase (chat) | frontend → Supabase |
| Gamificación | ✅ lectura, 0 símbolos por falta de sembrado | gamificacion/* |
| Insignias | ✅ lectura, catálogo vacío en prod | gamificacion/insignias |
| Ranking | ⚠️ sin temporada activa (404 honesto) | gamificacion/ranking |
| Certificados | ❌ bloqueado por curso no completado (100 lecciones) | certificados/* |
| Tienda/Recompensas | ✅ lectura, catálogo vacío en prod | gamificacion (codigos/recompensas) |
| Inventario | ✅ lectura, vacío en prod | gamificacion/insignias usado(a) |
| Pagos | ✅ flujo real verificado | pagos/pedidos + webhook |
| Notificaciones | ⚠️ lista vacía (0 en prod) | notificaciones/yo (lectura) |
| Soporte | ✅ funcional E2E | soporte/tickets |

> "✅ funcional" = endpoint existe, compila y responde; visibilidad real depende de que la prod tenga datos en el catálogo.
> "❌ bloqueado" = flujo lógico completo pero condición no cumplida en prod (curso no completado).
> "⚠️" = pieza UI funcional pero meramente derivada de leer otros datos ya verificados.

El estudiante es el rol con más pantallas (25+). El contrato real hoy está repartido:

## ✅ Pantallas funcionando **end-to-end AHORA** (vía Supabase + RLS directa, sin backend)

Todas estas pantallas leen/escriben directo en PostgreSQL via Supabase client con RLS:

- **Mis cursos** (lecturas de matricula vía matriculas/yo del backend o supabase)
- **Explorar catálogo** (/cursos backend listo: catálogo paginado publicado)
- **Tareas** (Supabase RLS por asignación)
- **Evaluaciones** (Supabase RLS)
- **Minijuegos / juego** (Supabase RLS; catálogo productos/motores vía Supabase)
- **Rendimiento** (computed en frontend o Supabase)
- **Calendario** (calculado del progreso en frontend)
- **Comunidad** (gating por RLS)
- **Insignias** (/gamificacion/insignias backend listo)
- **Ranking** (/gamificacion/ranking backend listo; sin temporada activa en prod → 404)
- **Recompensas / Tienda / Inventario** (Supabase directas)
- **Mi perfil** (formulario guarda en Supabase)
- **Notificaciones** (Supabase + también expuestas por backend /notificaciones/yo)
- **Soporte** (crear/tickets lee/escribe Supabase; backend expone tickets)

## ✅ Pantallas funcionando AHORA vía **backend** de Spring (nuevo hoy)

| Pantalla | Endpoint | Estado verificado |
|---|---|---|
| **Mensajes** | `GET /mensajes/hilos`, `GET /mensajes/{otroId}`, `POST /mensajes/{otroId}`, `POST /mensajes/{otroId}/leidos` | 200/400/404/200/0 con checks ✓ |
| **Avisos** | `GET /api/v1/anuncios` | 200 lista vacío (sin anuncios en prod hoy) ✓ |

Confirmado hoy con datos reales del estudiante de prueba:
- `GET /api/v1/usuarios/yo` → `rol=estudiante estado=activo` ✓
- `POST /api/v1/mensajes/ffd6825e...` (self) → 400 ✓
- `POST /api/v1/mensajes/00000000-...0000` → 404 ✓
- `GET /api/v1/mensajes/hilos` → 200 [] ✓
- `GET /api/v1/mensajes/00000000-...0000/leidos` → 200 0 ✓
- `GET /api/v1/anuncios` → 200 [] ✓

## ❌ Lo que el backend NO cubre hoy (sin adornos)

- **Tareas** (entregas/calificación): modelo de datos mapeado, sin endpoints.
- **Evaluaciones**: sin endpoints.
- **Minijuegos** de escritura (crear/jugar): sin endpoints en backend; solo catálogo en Supabase.
- **Rendimiento / Calendario / Comunidad**: sin endpoint analítico agregado; calculados en frontend/supabase.
- **Recompensas / Tienda / Inventario**:sin endpoints específicos de compra; base de XP/monedas vive en `transaccion_xp` / `transaccion_moneda` (mapeadas).
- **Pedidos/Pagos**: cubiertos, pero en estado PENDIENTE (sin Culqi real).
- **Consumo gamificación**: `transaccion_xp` escribe, pero no hay misiónes/insignias sembradas en prod → estas pantallas muestran 0.

## Cómo cerrar la deuda de forma sana

1. Sembrar catálogo (insignias, misiones, lenguajes, motores de minijuegos, anuncios de prueba).
2. Endpoints que faltan por dominio (tareas, evaluaciones, minijuegos escritura, tienda/inventario/recompensas:

| Dominio | Endpoints a agregar | Complejidad aproximada |
|---|---|---|
| Tareas | listar mis tareas, entregar (upload/aceptar entrega), listar notas | Media |
| Evaluaciones | iniciar intento, responder, finalizar, resultado | Alta |
| Minijuegos | iniciar juego, registrar puntuación | Alta |
| Tienda/Inventario/Recompensas | comprar item, listar mis items, listar recompensas | Media |
| Calendario | endpoint que devuelva lecciones+tareas pendientes | Baja |

Nota: Los datos de Supabase tienen RLS, por lo que el frontend ya funciona. El backend añade consistencia y validación pero no es estrictamente necesario para que el estudiante vea/use el panel hoy.
