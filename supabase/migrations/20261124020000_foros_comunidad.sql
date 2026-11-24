-- =============================================================================
-- InkaQuest - Migración 20261124020000
-- Comunidad / foros por curso (Opción A).
--
-- Aditiva: crea SOLO tablas, funciones, policies y triggers nuevos. No modifica
-- ni elimina nada de lo existente.
--
-- Acceso: docente asignado al curso, estudiantes matriculados y administradores.
-- Moderación: fijar/cerrar/borrar temas solo docente/admin; el autor puede
-- editar o borrar sus propios temas/respuestas.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1) Tablas
-- -----------------------------------------------------------------------------
create table if not exists public.foro (
    id              uuid primary key default gen_random_uuid(),
    curso_id        uuid not null unique references public.curso (id) on delete cascade,
    titulo          text not null default 'Comunidad del curso',
    descripcion     text,
    creado_en       timestamptz not null default now(),
    actualizado_en  timestamptz not null default now()
);

create table if not exists public.foro_tema (
    id                   uuid primary key default gen_random_uuid(),
    foro_id              uuid not null references public.foro (id) on delete cascade,
    autor_id             uuid not null references public.perfil (id) on delete cascade,
    titulo               text not null check (char_length(btrim(titulo)) between 3 and 160),
    cuerpo               text not null check (char_length(btrim(cuerpo)) between 1 and 8000),
    fijado               boolean not null default false,
    cerrado              boolean not null default false,
    creado_en            timestamptz not null default now(),
    actualizado_en       timestamptz not null default now(),
    ultima_actividad_en  timestamptz not null default now()
);

create table if not exists public.foro_respuesta (
    id             uuid primary key default gen_random_uuid(),
    tema_id        uuid not null references public.foro_tema (id) on delete cascade,
    autor_id       uuid not null references public.perfil (id) on delete cascade,
    cuerpo         text not null check (char_length(btrim(cuerpo)) between 1 and 8000),
    es_solucion    boolean not null default false,
    creado_en      timestamptz not null default now(),
    actualizado_en timestamptz not null default now()
);

create index if not exists idx_foro_tema_foro on public.foro_tema (foro_id, ultima_actividad_en desc);
create index if not exists idx_foro_respuesta_tema on public.foro_respuesta (tema_id, creado_en);

alter table public.foro enable row level security;
alter table public.foro force row level security;
alter table public.foro_tema enable row level security;
alter table public.foro_tema force row level security;
alter table public.foro_respuesta enable row level security;
alter table public.foro_respuesta force row level security;

grant select, insert, update, delete on public.foro, public.foro_tema, public.foro_respuesta to authenticated;

-- -----------------------------------------------------------------------------
-- 2) Funciones auxiliares (SECURITY DEFINER: evitan recursión de policies)
-- -----------------------------------------------------------------------------
create or replace function public.fn_foro_curso(p_foro_id uuid)
returns uuid language sql stable security definer set search_path = '' as $$
    select curso_id from public.foro where id = p_foro_id;
$$;

create or replace function public.fn_tema_curso(p_tema_id uuid)
returns uuid language sql stable security definer set search_path = '' as $$
    select f.curso_id
      from public.foro_tema t
      join public.foro f on f.id = t.foro_id
     where t.id = p_tema_id;
$$;

create or replace function public.fn_tema_cerrado(p_tema_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
    select coalesce((select cerrado from public.foro_tema where id = p_tema_id), true);
$$;

/** Crea (una vez) el foro de un curso. Idempotente y autorizado. */
create or replace function public.fn_foro_asegurar(p_curso_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
    v_caller uuid := public.efectivo_user_id();
    v_foro   uuid;
begin
    if v_caller is not null
       and not (public.app_is_admin()
                or public.app_es_docente_del_curso(p_curso_id)
                or public.app_esta_matriculado(p_curso_id)) then
        raise exception 'No tienes acceso a este curso.' using errcode = '42501';
    end if;

    insert into public.foro (curso_id, titulo)
    values (p_curso_id, 'Comunidad del curso')
    on conflict (curso_id) do update set curso_id = excluded.curso_id
    returning id into v_foro;

    return v_foro;
end;
$$;

comment on function public.fn_foro_asegurar(uuid) is
    'Devuelve el foro del curso, creándolo si no existe. Solo miembros del curso.';

revoke all on function public.fn_foro_asegurar(uuid) from public, anon;
grant execute on function public.fn_foro_asegurar(uuid) to service_role, authenticated;

-- -----------------------------------------------------------------------------
-- 3) Policies RLS
-- -----------------------------------------------------------------------------
drop policy if exists pol_foro_select on public.foro;
create policy pol_foro_select on public.foro
    for select to authenticated
    using (
        public.app_is_admin()
        or public.app_es_docente_del_curso(curso_id)
        or public.app_esta_matriculado(curso_id)
    );

-- Temas: lectura para miembros del curso; escritura solo del autor.
drop policy if exists pol_foro_tema_select on public.foro_tema;
create policy pol_foro_tema_select on public.foro_tema
    for select to authenticated
    using (
        public.app_is_admin()
        or public.app_es_docente_del_curso(public.fn_foro_curso(foro_id))
        or public.app_esta_matriculado(public.fn_foro_curso(foro_id))
    );

drop policy if exists pol_foro_tema_insert on public.foro_tema;
create policy pol_foro_tema_insert on public.foro_tema
    for insert to authenticated
    with check (
        autor_id = public.efectivo_user_id()
        and (
            public.app_is_admin()
            or public.app_es_docente_del_curso(public.fn_foro_curso(foro_id))
            or public.app_esta_matriculado(public.fn_foro_curso(foro_id))
        )
    );

drop policy if exists pol_foro_tema_update on public.foro_tema;
create policy pol_foro_tema_update on public.foro_tema
    for update to authenticated
    using (
        autor_id = public.efectivo_user_id()
        or public.app_is_admin()
        or public.app_es_docente_del_curso(public.fn_foro_curso(foro_id))
    )
    with check (
        autor_id = public.efectivo_user_id()
        or public.app_is_admin()
        or public.app_es_docente_del_curso(public.fn_foro_curso(foro_id))
    );

drop policy if exists pol_foro_tema_delete on public.foro_tema;
create policy pol_foro_tema_delete on public.foro_tema
    for delete to authenticated
    using (
        autor_id = public.efectivo_user_id()
        or public.app_is_admin()
        or public.app_es_docente_del_curso(public.fn_foro_curso(foro_id))
    );

-- Respuestas: lectura para miembros; escritura del autor si el tema no está cerrado.
drop policy if exists pol_foro_respuesta_select on public.foro_respuesta;
create policy pol_foro_respuesta_select on public.foro_respuesta
    for select to authenticated
    using (
        public.app_is_admin()
        or public.app_es_docente_del_curso(public.fn_tema_curso(tema_id))
        or public.app_esta_matriculado(public.fn_tema_curso(tema_id))
    );

drop policy if exists pol_foro_respuesta_insert on public.foro_respuesta;
create policy pol_foro_respuesta_insert on public.foro_respuesta
    for insert to authenticated
    with check (
        autor_id = public.efectivo_user_id()
        and not public.fn_tema_cerrado(tema_id)
        and (
            public.app_is_admin()
            or public.app_es_docente_del_curso(public.fn_tema_curso(tema_id))
            or public.app_esta_matriculado(public.fn_tema_curso(tema_id))
        )
    );

drop policy if exists pol_foro_respuesta_update on public.foro_respuesta;
create policy pol_foro_respuesta_update on public.foro_respuesta
    for update to authenticated
    using (autor_id = public.efectivo_user_id() or public.app_is_admin()
           or public.app_es_docente_del_curso(public.fn_tema_curso(tema_id)))
    with check (autor_id = public.efectivo_user_id() or public.app_is_admin()
                or public.app_es_docente_del_curso(public.fn_tema_curso(tema_id)));

drop policy if exists pol_foro_respuesta_delete on public.foro_respuesta;
create policy pol_foro_respuesta_delete on public.foro_respuesta
    for delete to authenticated
    using (autor_id = public.efectivo_user_id() or public.app_is_admin()
           or public.app_es_docente_del_curso(public.fn_tema_curso(tema_id)));

-- -----------------------------------------------------------------------------
-- 4) Triggers: moderación, actividad y notificaciones
-- -----------------------------------------------------------------------------
create or replace function public.fn_foro_proteger_moderacion()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
    if (new.fijado is distinct from old.fijado or new.cerrado is distinct from old.cerrado)
       and not (public.app_is_admin()
                or public.app_es_docente_del_curso(public.fn_foro_curso(new.foro_id))) then
        raise exception 'Solo el docente o administrador puede fijar o cerrar temas.'
            using errcode = '42501';
    end if;
    return new;
end;
$$;

drop trigger if exists trg_foro_proteger_moderacion on public.foro_tema;
create trigger trg_foro_proteger_moderacion
    before update of fijado, cerrado on public.foro_tema
    for each row execute function public.fn_foro_proteger_moderacion();

create or replace function public.fn_foro_tema_tocar_actividad()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
    update public.foro_tema
       set ultima_actividad_en = now(), actualizado_en = now()
     where id = coalesce(new.tema_id, old.tema_id);
    if tg_op = 'DELETE' then
        return old;
    end if;
    return new;
end;
$$;

drop trigger if exists trg_foro_tema_tocar_actividad on public.foro_respuesta;
create trigger trg_foro_tema_tocar_actividad
    after insert or delete on public.foro_respuesta
    for each row execute function public.fn_foro_tema_tocar_actividad();

-- Notificación a los docentes del curso cuando se abre un tema.
create or replace function public.fn_foro_notificar_tema()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
    v_curso uuid := public.fn_foro_curso(new.foro_id);
begin
    insert into public.notificacion (
        titulo, mensaje, canal, destinatario_id, entidad_tipo, entidad_id,
        creado_por, clave_idempotencia
    )
    select 'Nuevo tema en la comunidad',
           left(new.titulo, 200),
           'in_app', dc.docente_id, 'foro_tema', new.id, new.autor_id,
           'foro_tema:' || new.id::text || ':' || dc.docente_id::text
      from public.docente_curso dc
     where dc.curso_id = v_curso and dc.activo
       and dc.docente_id <> new.autor_id
    on conflict (clave_idempotencia) do nothing;

    insert into public.notificacion_destinatario (notificacion_id, usuario_id, canal, estado, enviada_en)
    select n.id, n.destinatario_id, 'in_app', 'enviada', now()
      from public.notificacion n
     where n.entidad_tipo = 'foro_tema' and n.entidad_id = new.id
    on conflict (notificacion_id, usuario_id, canal) do nothing;

    return new;
end;
$$;

drop trigger if exists trg_foro_notificar_tema on public.foro_tema;
create trigger trg_foro_notificar_tema
    after insert on public.foro_tema
    for each row execute function public.fn_foro_notificar_tema();

-- Notificación al autor del tema cuando alguien responde.
create or replace function public.fn_foro_notificar_respuesta()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
    v_autor_tema uuid;
begin
    select autor_id into v_autor_tema from public.foro_tema where id = new.tema_id;
    if v_autor_tema is null or v_autor_tema = new.autor_id then
        return new;
    end if;

    insert into public.notificacion (
        titulo, mensaje, canal, destinatario_id, entidad_tipo, entidad_id,
        creado_por, clave_idempotencia
    )
    values ('Respuesta en tu tema de la comunidad', left(new.cuerpo, 200), 'in_app',
            v_autor_tema, 'foro_tema', new.tema_id, new.autor_id,
            'foro_resp:' || new.id::text || ':' || v_autor_tema::text)
    on conflict (clave_idempotencia) do nothing;

    insert into public.notificacion_destinatario (notificacion_id, usuario_id, canal, estado, enviada_en)
    select n.id, n.destinatario_id, 'in_app', 'enviada', now()
      from public.notificacion n
     where n.entidad_tipo = 'foro_tema' and n.entidad_id = new.tema_id
       and n.clave_idempotencia = 'foro_resp:' || new.id::text || ':' || v_autor_tema::text
    on conflict (notificacion_id, usuario_id, canal) do nothing;

    return new;
end;
$$;

drop trigger if exists trg_foro_notificar_respuesta on public.foro_respuesta;
create trigger trg_foro_notificar_respuesta
    after insert on public.foro_respuesta
    for each row execute function public.fn_foro_notificar_respuesta();

-- -----------------------------------------------------------------------------
-- 5) Foros existentes para todos los cursos (el trigger llama con sistema)
-- -----------------------------------------------------------------------------
select public.fn_foro_asegurar(c.id) from public.curso c;

commit;

notify pgrst, 'reload schema';
