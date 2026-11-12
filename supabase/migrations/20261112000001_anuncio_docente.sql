-- =============================================================================
-- InkaQuest - Migración 20261112000001
-- Módulo "Anuncios" del docente: avisos dirigidos a los estudiantes de un
-- curso (sin tabla histórica aparte; las notificaciones se generan aparte).
-- =============================================================================

create table if not exists public.anuncio (
    id              uuid primary key default gen_random_uuid(),
    curso_id        uuid        not null references public.curso (id) on delete cascade,
    docente_id      uuid        not null references public.perfil (id) on delete cascade,
    titulo          text        not null check (char_length(titulo) between 3 and 200),
    contenido       text        not null check (char_length(contenido) between 1 and 10000),
    fijado          boolean     not null default false,
    estado          text        not null default 'publicado'
                                check (estado in ('borrador', 'publicado', 'archivado')),
    creado_en       timestamptz not null default now(),
    actualizado_en  timestamptz not null default now()
);

create index if not exists idx_anuncio_curso
    on public.anuncio (curso_id, fijado desc, creado_en desc);

alter table public.anuncio enable row level security;

-- Solo el docente asignado al curso (o el admin) puede ver los anuncios.
drop policy if exists pol_anuncio_select on public.anuncio;
create policy pol_anuncio_select on public.anuncio
    for select to authenticated
    using (public.app_es_docente_del_curso(curso_id) or public.app_is_admin());

-- Crear: docente asignado al curso y actúa en su propio nombre (o admin).
drop policy if exists pol_anuncio_insert on public.anuncio;
create policy pol_anuncio_insert on public.anuncio
    for insert to authenticated
    with check (
        (public.app_es_docente_del_curso(curso_id) and docente_id = public.efectivo_user_id())
        or public.app_is_admin()
    );

-- Actualizar/archivar: mismo alcance que crear.
drop policy if exists pol_anuncio_update on public.anuncio;
create policy pol_anuncio_update on public.anuncio
    for update to authenticated
    using (public.app_es_docente_del_curso(curso_id) or public.app_is_admin())
    with check (
        (public.app_es_docente_del_curso(curso_id) and docente_id = public.efectivo_user_id())
        or public.app_is_admin()
    );

drop policy if exists pol_anuncio_delete on public.anuncio;
create policy pol_anuncio_delete on public.anuncio
    for delete to authenticated
    using (public.app_es_docente_del_curso(curso_id) or public.app_is_admin());

-- Actualizado automático.
create or replace function public.fn_anuncio_tocar_actualizado()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    new.actualizado_en := now();
    return new;
end;
$$;

comment on function public.fn_anuncio_tocar_actualizado() is
    'Mantiene actualizado_en en cambios de anuncios.';

drop trigger if exists trg_anuncio_actualizado on public.anuncio;
create trigger trg_anuncio_actualizado
    before update on public.anuncio
    for each row execute function public.fn_anuncio_tocar_actualizado();
