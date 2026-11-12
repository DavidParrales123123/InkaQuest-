-- =============================================================================
-- InkaQuest - Migración 20261112000006
-- Archivos complementarios para tareas (adjuntos del docente) y ampliación
-- de MIME types de los buckets de entregas y recursos.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Tabla tarea_archivo: adjuntos (Word, PDF, Excel, PowerPoint, ZIP...)
--    El docente los agrega como complemento de la tarea; el estudiante los
--    descarga. Cascada al eliminar la tarea.
-- -----------------------------------------------------------------------------
create table if not exists public.tarea_archivo (
    id            uuid primary key default gen_random_uuid(),
    tarea_id      uuid not null references public.tarea (id) on delete cascade,
    nombre        text not null,
    ruta_storage  text not null,
    mime_type     text,
    tamano_bytes  bigint,
    creado_en     timestamptz not null default now()
);

create index if not exists idx_tarea_archivo_tarea on public.tarea_archivo (tarea_id);

alter table public.tarea_archivo enable row level security;

drop policy if exists pol_tarea_archivo_select on public.tarea_archivo;
create policy pol_tarea_archivo_select on public.tarea_archivo
    for select to authenticated
    using (
        exists (
            select 1
              from public.tarea t
              join public.actividad a on a.id = t.actividad_id
             where t.id = tarea_archivo.tarea_id
               and (
                   public.app_es_docente_del_curso(a.curso_id)
                   or public.app_esta_matriculado(a.curso_id)
                   or public.app_is_admin()
               )
        )
    );

drop policy if exists pol_tarea_archivo_insert on public.tarea_archivo;
create policy pol_tarea_archivo_insert on public.tarea_archivo
    for insert to authenticated
    with check (
        exists (
            select 1
              from public.tarea t
              join public.actividad a on a.id = t.actividad_id
             where t.id = tarea_archivo.tarea_id
               and (public.app_es_docente_del_curso(a.curso_id) or public.app_is_admin())
        )
    );

drop policy if exists pol_tarea_archivo_delete on public.tarea_archivo;
create policy pol_tarea_archivo_delete on public.tarea_archivo
    for delete to authenticated
    using (
        exists (
            select 1
              from public.tarea t
              join public.actividad a on a.id = t.actividad_id
             where t.id = tarea_archivo.tarea_id
               and (public.app_es_docente_del_curso(a.curso_id) or public.app_is_admin())
        )
    );

grant select, insert, delete on public.tarea_archivo to authenticated;

-- -----------------------------------------------------------------------------
-- 2. Ampliación de MIME types: el bucket de entregas debe aceptar documentos
--    Office de la universidad (Word/Excel/PowerPoint) además del PDF/ZIP;
--    el bucket de recursos acepta presentaciones PowerPoint.
-- -----------------------------------------------------------------------------
update storage.buckets
   set file_size_limit = 26214400::bigint,   -- 25 MB
       allowed_mime_types = array[
           'application/pdf','image/png','image/jpeg','text/plain','application/zip',
           'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
           'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/csv',
           'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation',
           'application/octet-stream'
       ]
 where id = 'entregas';

update storage.buckets
   set file_size_limit = 52428800::bigint,   -- 50 MB
       allowed_mime_types = array[
           'application/pdf','application/zip','text/plain','image/png','image/jpeg','application/json',
           'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
           'application/vnd.ms-excel','text/csv','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
           'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation',
           'application/octet-stream'
       ]
 where id = 'recursos';
