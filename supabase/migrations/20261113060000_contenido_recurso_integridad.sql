-- Para que el "contenido de la lección" funcione coherentemente con el botón
-- único "Agregar material" (bloque de contenido + adjunto asociado):
--
-- 1) contenido -> recurso: la integridad referencial pasa de SET NULL a CASCADE.
--    Al eliminar un bloque de contenido el adjunto (fila en recurso) se elimina
--    en cascada, nunca queda un archivo asociado a nada. (El archivo de Storage
--    ya se borra desde el borde de la aplicación; esto solo preserva la fila.)
--
-- 2) Índice para buscar adjuntos de un contenido rápido (la vista unificada los
--    agrupa bajo su bloque de contenido).
--
-- 3) Orden de bloques de contenido: se conservan la constraint
--    contenido_leccion_id_orden_key (UNIQUE) y el check orden > 0.
--    La app inserta con max(orden)+1 dentro de content,cercado por esa
--    constraint, por lo que el número de orden es siempre coherente y único.

-- ─── 1. FK recurso.contenido_id: SET NULL -> CASCADE ─────────────────────────
alter table public.recurso
    drop constraint recurso_contenido_id_fkey;

alter table public.recurso
    add constraint recurso_contenido_id_fkey
        foreign key (contenido_id)
        references public.contenido (id)
        on delete cascade;

-- ─── 2. Índice de adjuntos por contenido ─────────────────────────────────────
create index if not exists idx_recurso_contenido_id
    on public.recurso (contenido_id)
    where contenido_id is not null;
