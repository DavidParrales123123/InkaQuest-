-- =============================================================================
-- Registro de duración de sesión (tiempo con la pestaña abierta/visible).
-- -----------------------------------------------------------------------------
-- Hasta ahora solo se guardaba tiempo de estudio/juego. Esta tabla registra
-- cuánto tiempo estuvo abierta la pestaña, de forma pasiva, sin tocar la UI.
-- =============================================================================

begin;

create table if not exists public.sesion_actividad (
    id                  uuid primary key default gen_random_uuid(),
    usuario_id          uuid not null references public.perfil(id) on delete cascade,
    iniciada_en         timestamptz not null default now(),
    ultima_actividad_en timestamptz not null default now(),
    finalizada_en       timestamptz,
    segundos_activos    integer not null default 0
);

create index if not exists idx_sesion_actividad_usuario_fecha
    on public.sesion_actividad (usuario_id, iniciada_en desc);

-- RLS (el loop global de la migración base ya habilita FORCE para tablas nuevas).
drop policy if exists pol_sesion_actividad_select on public.sesion_actividad;
create policy pol_sesion_actividad_select on public.sesion_actividad
    for select to authenticated
    using (usuario_id = public.efectivo_user_id() or public.app_is_admin());

drop policy if exists pol_sesion_actividad_insert on public.sesion_actividad;
create policy pol_sesion_actividad_insert on public.sesion_actividad
    for insert to authenticated
    with check (usuario_id = public.efectivo_user_id());

drop policy if exists pol_sesion_actividad_update on public.sesion_actividad;
create policy pol_sesion_actividad_update on public.sesion_actividad
    for update to authenticated
    using (usuario_id = public.efectivo_user_id())
    with check (usuario_id = public.efectivo_user_id());

grant select, insert, update on public.sesion_actividad to authenticated;

-- Inicia una sesión y devuelve su id.
create or replace function public.sesion_iniciar()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_usuario uuid := public.efectivo_user_id();
    v_id      uuid;
begin
    if v_usuario is null then
        raise exception 'Autenticación requerida.' using errcode = '42501';
    end if;
    insert into public.sesion_actividad (usuario_id) values (v_usuario)
    returning id into v_id;
    return v_id;
end;
$$;

-- Actualiza el acumulado de segundos y marca cierre cuando corresponde.
create or replace function public.sesion_actualizar(
    p_id      uuid,
    p_segundos integer,
    p_cerrada  boolean default false
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_usuario uuid := public.efectivo_user_id();
begin
    if v_usuario is null then
        return;
    end if;
    update public.sesion_actividad
       set segundos_activos = greatest(segundos_activos, greatest(coalesce(p_segundos, 0), 0)),
           ultima_actividad_en = now(),
           finalizada_en = case when coalesce(p_cerrada, false) then coalesce(finalizada_en, now()) else finalizada_en end
     where id = p_id
       and usuario_id = v_usuario;
end;
$$;

revoke all on function public.sesion_iniciar() from public, anon;
grant execute on function public.sesion_iniciar() to authenticated;
revoke all on function public.sesion_actualizar(uuid, integer, boolean) from public, anon;
grant execute on function public.sesion_actualizar(uuid, integer, boolean) to authenticated;

commit;
