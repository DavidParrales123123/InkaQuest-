-- Solicitudes de docente duplicadas del mismo usuario: deduplicar y prevenir.
--
-- Contexto. El flujo REAL de alta de solicitud (/solicitud-docente) inserta
-- directo en public.solicitud_docente vía PostgREST tras comprobar
-- "obtenerMiSolicitud" — una comprobación TOCTOU: dos pestañas/dispositivos
-- enviando a la vez pasan ambas el check e insertan dos filas idénticas
-- (caso real en producción: darrell.perez.ramirez@gmail.com generó dos
-- solicitudes en el mismo milisegundo).
--
-- Esta migración, en orden:
--   1) Colapsa duplicados ya existentes conservando la MÁS ANTIGUA (el
--      contenido es idéntico; no hay decisiones tomadas ni auditoría de
--      por medio).
--   2) Registra la deduplicación en public.registro_accion.
--   3) Crea un índice único PARCIAL por usuario: una sola solicitud
--      pendiente/en_revision por persona, aunque se llame a la API dos
--      veces en paralelo o desde el cliente REST directo.

-- 1) Colapsa duplicados pendientes (conserva la más antigua).
with borradas as (
    delete from public.solicitud_docente a
     using public.solicitud_docente b
     where a.usuario_id = b.usuario_id
       and a.estado in ('pendiente', 'en_revision')
       and b.estado in ('pendiente', 'en_revision')
       and a.creado_en > b.creado_en
     returning a.id
)
insert into public.registro_accion
    (codigo_evento, accion, entidad_tipo, exito, valor_nuevo, correlation_id)
select 'solicitud_docente_dedup', 'eliminar', 'solicitud_docente', true,
       jsonb_build_object('duplicadas_eliminadas', count(*)),
       gen_random_uuid()
  from borradas;

-- 2) Índice único parcial: una solicitud pendiente/en_revision por usuario.
create unique index if not exists solicitud_docente_unica_pendiente
    on public.solicitud_docente (usuario_id)
    where estado in ('pendiente', 'en_revision');

comment on index public.solicitud_docente_unica_pendiente is
    'Impide dos solicitudes pendientes/en_revision para el mismo usuario, incluso bajo condiciones de carrera.';
