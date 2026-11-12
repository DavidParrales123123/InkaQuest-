# Secciones 21-30 — Estado real (tema: Gamificación y retos)

Última actualización: 2026-11-12. El prompt maestro no está en el disco, así que
esto cubre el tema elegido por el usuario ("Gamificación y retos"). Nada aquí
reclama más de lo verificado contra la BD real `nrfdifzechrjikrvzhdl`.

## Lo implementado y verificado en vivo (endpoint a endpoint)

| Endpoint | Estado verificado |
|---|---|
| `GET /api/v1/gamificacion/yo` | 200 — XP=0, nivel=1, racha=0, monedas=0, insignias=0, misiones=0 |
| `GET /api/v1/gamificacion/insignias` | 200 — catálogo vacío (prod sin insignias sembradas) |
| `GET /api/v1/gamificacion/misiones` | 200 — lista vacía (prod sin misiones sembradas) |
| `GET /api/v1/gamificacion/temporada-actual` | 200 — sin temporada activa (`data` omitida por JSON NON_NULL) |
| `GET /api/v1/gamificacion/ranking` | 404 — "No hay una temporada activa en este momento." ✓ correcto |
| `GET /api/v1/gamificacion/transacciones-xp` | 200 — página vacía (lecciones XP=0 ⇒ sin transacciones) |
| `GET /api/v1/lenguajes` | 200 — lista vacía (prod sin lenguajes sembrados) |
| `GET /api/v1/retos?page=` | 200 — catálogo vacío (prod sin retos publicados) |
| `GET /api/v1/retos/{id}` | código verificado; 404 para inexistente ✓ |
| `GET /api/v1/retos/{id}/intentos-restantes` | código verificado; 404 para inexistente ✓ |
| `POST /api/v1/retos/{id}/envios` | código verificado; 404 para reto inexistente ✓; 400 validación ✓ |
| `GET /api/v1/retos/{id}/envios/yo` | código verificado |
| `POST /api/v1/progreso/lecciones/{id}/completar` | intacto; ahora también registra actividad en `racha`/`historial_racha` (solo al completar de verdad, dentro de la misma transacción) |

## Lo implementado pero NO verificable con los datos de producción actuales

- **Registro de racha e historial de racha** (`GamificacionRecorder`): el fixture
  quedó inutilizable porque la matrícula del usuario de prueba en el curso
  gratuito quedó cancelada y el re-enrolamiento está bloqueado (400, correcto).
  El registro solo ocurre al completar una lección; hoy esa vía no puederrepetirse
  con este fixture. El código está centralizado en un solo componente sin
  transacción propia (joins a la transacción de completado), por lo que no hay
  posibilidad de medio-escribir XP sin la lección asociada.
- **Transacción de XP** (`transaccion_xp`, concepto `leccion_completada`): los
  cursos publicados dan XP=0 a todas las lecciones; el insert solo se dispara con
  XP>0. Inexistente en prod hasta que el catálogo otorgue XP.

## Lo que FALTA (sin maquillar)

1. **Bonus diario de racha**: no hay regla de negocio/valor configurado; el campo
   `historial_racha.xp_otorgado` se persiste en 0. Hace falta decisión de producto
   (p. ej. +10 XP por día de racha o según `regla_progresion`).
2. **Flujo de misiones**: completar misiones, otorgar recompensas (XP/monedas/insignia),
   expirar misiones vencidas. No existe; falta también sembrar las misiones de la app.
3. **Flujo de insignias**: requisitos (`requisito_insignia`), progresión y concesión
   automática. Solo existe la lectura del catálogo.
4. **Minijuegos (Juego/Motor/IntentoJuego/...)**: sin endpoints; la entidad está mapeada.
5. **Retos**: la EJECUCIÓN/EVALUACIÓN del código del estudiante NO existe. Hace falta
   sandbox aislado (compilación, memoria/tiempo límite, tests ocultos) y un sistema
   de cola/ejecutores. Los envíos quedan `pendiente` hoy.
6. **Ranking**: sin temporada activa en prod; no hay cálculo/actualización de posiciones.
7. **Tienda virtual** (monedas, inventario, compras) — entidades sin tocar.

## Datos/acciones reales pendientes que habilitan esto

1. Sembrar en Supabase: `lenguaje`, `insignia` (catálogo + `requisito_insignia`),
   `mision`, `temporada` (o activar una), `regla_progresion`.
2. `GRANT inkaquest_api TO postgres;` para activar RLS en el backend (ver secciones-11-20.md).
3. Definir/desplegar la infraestructura de ejecución de retos (fuera del alcance de un endpoint).
4. Editar las lecciones del catálogo para asignar XP distinto de 0 si se desea ver
   transacciones de XP reales.

## Nota de comportamiento verificado hoy

- El backend responde con lógica correcta en modo RLS degradado (autorización en
  capa de servicio; todos los endpoints devuelven 403/404/400 según corresponda).
- `mvn clean test`: 7/7 verde tras los cambios de esta sesión.
