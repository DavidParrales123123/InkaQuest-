-- =============================================================================
-- InkaQuest - Migración 20261124010000
-- Rachas calculadas en FECHA LOCAL (América/Lima), no en UTC.
--
-- Problema: current_date en Supabase es UTC. A las 20:00 en Lima ya es 01:00 UTC
-- del día siguiente, por eso la racha avanzaba antes de que terminara el día
-- local (ejemplo real: historial con fecha 2026-11-24 creado el 23 a las 20:33
-- hora Lima).
--
-- Solución:
--  1) fn_actualizar_racha acepta la fecha local del cliente (con default
--     América/Lima en servidor) y nunca acepta una fecha futura.
--  2) Se recalculan racha_actual / mejor_racha / ultima_actividad /
--     perfil.racha_dias a partir de creado_en convertido a hora Lima.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1) Función con fecha local
-- -----------------------------------------------------------------------------
drop function if exists public.fn_actualizar_racha(uuid);

create or replace function public.fn_actualizar_racha(
    p_usuario_id uuid,
    p_fecha_local date default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_caller     uuid := public.efectivo_user_id();
    v_hoy_lima   date := date(now() at time zone 'America/Lima');
    v_hoy        date;
    v_racha      integer;
    v_ultima     date;
    v_nueva      integer;
    v_xp_racha   integer;
begin
    if v_caller is null then
        raise exception 'Autenticación requerida.' using errcode = '42501';
    end if;
    if v_caller <> p_usuario_id and not public.app_is_admin() then
        raise exception 'No puedes modificar la racha de otro usuario.' using errcode = '42501';
    end if;

    -- El cliente informa su día local; el servidor nunca acepta uno futuro.
    v_hoy := coalesce(p_fecha_local, v_hoy_lima);
    if v_hoy > v_hoy_lima then
        v_hoy := v_hoy_lima;
    end if;

    perform pg_advisory_xact_lock(hashtext('racha:' || p_usuario_id::text));

    select racha_actual, ultima_actividad into v_racha, v_ultima
      from public.racha where usuario_id = p_usuario_id;

    if v_racha is null then v_racha := 0; v_ultima := null; end if;

    -- Mismo día local: no cambia la racha, pero sincroniza el perfil
    -- (el backend también escribe en public.racha).
    if v_ultima = v_hoy then
        perform public.fn_activar_escritura_sistema();
        update public.perfil set racha_dias = v_racha where id = p_usuario_id;
        perform public.fn_desactivar_escritura_sistema();
        return v_racha;
    end if;

    if v_ultima = v_hoy - 1 then v_nueva := v_racha + 1; else v_nueva := 1; end if;

    insert into public.racha (usuario_id, racha_actual, mejor_racha, ultima_actividad)
    values (p_usuario_id, v_nueva, v_nueva, v_hoy)
    on conflict (usuario_id) do update
        set racha_actual = excluded.racha_actual,
            mejor_racha = greatest(public.racha.mejor_racha, excluded.mejor_racha),
            ultima_actividad = excluded.ultima_actividad;

    insert into public.historial_racha (usuario_id, fecha, racha)
    values (p_usuario_id, v_hoy, v_nueva)
    on conflict (usuario_id, fecha) do nothing;

    select coalesce(r.valor, 0) into v_xp_racha
      from public.regla_progresion r
     where r.activa and r.tipo = 'racha'
     order by r.valor desc limit 1;

    if v_xp_racha > 0 then
        perform public.fn_registrar_xp(p_usuario_id, v_xp_racha, 'racha_diaria', 'racha', null);
    end if;

    if v_nueva >= 7 then
        perform public.fn_otorgar_insignia(
            p_usuario_id,
            (select id from public.insignia where codigo = 'RACHA_7_DIAS' limit 1),
            'racha_7_dias');
    end if;

    perform public.fn_activar_escritura_sistema();
    update public.perfil set racha_dias = v_nueva where id = p_usuario_id;
    perform public.fn_desactivar_escritura_sistema();

    return v_nueva;
end;
$$;

comment on function public.fn_actualizar_racha(uuid, date) is
    'Actualiza la racha usando el día local del usuario (América/Lima por omisión). Idempotente por día local.';

revoke all on function public.fn_actualizar_racha(uuid, date) from public, anon;
grant execute on function public.fn_actualizar_racha(uuid, date) to service_role, authenticated;

-- -----------------------------------------------------------------------------
-- 2) Corrección de datos históricos (fechas UTC -> fechas Lima)
-- -----------------------------------------------------------------------------
create temp table tmp_racha_origen as
select usuario_id,
       date(creado_en at time zone 'America/Lima') as fecha_local,
       creado_en as momento,
       coalesce(xp_otorgado, 0) as xp
  from public.historial_racha
union all
select usuario_id, date(creado_en at time zone 'America/Lima'), creado_en, 0
  from public.racha
union all
select usuario_id, date(actualizado_en at time zone 'America/Lima'), actualizado_en, 0
  from public.racha;

create temp table tmp_racha_dias as
select usuario_id, fecha_local,
       min(momento) as primera_creacion,
       max(xp) as xp
  from tmp_racha_origen
 group by usuario_id, fecha_local;

create temp table tmp_racha_calc as
with ordenadas as (
    select usuario_id, fecha_local,
           lag(fecha_local) over (partition by usuario_id order by fecha_local) as previa
      from tmp_racha_dias
), marcadas as (
    select usuario_id, fecha_local,
           sum(case when previa = fecha_local - 1 then 0 else 1 end)
               over (partition by usuario_id order by fecha_local
                     rows between unbounded preceding and current row) as grupo
      from ordenadas
), consecutivas as (
    select m.usuario_id, m.fecha_local,
           row_number() over (partition by m.usuario_id, m.grupo order by m.fecha_local)::integer as racha,
           d.primera_creacion, d.xp
      from marcadas m
      join tmp_racha_dias d on d.usuario_id = m.usuario_id and d.fecha_local = m.fecha_local
), mejores as (
    select usuario_id, max(racha) as mejor from consecutivas group by usuario_id
), ultimas as (
    select distinct on (usuario_id) usuario_id, fecha_local as ultima, racha as actual
      from consecutivas order by usuario_id, fecha_local desc
)
select c.usuario_id, c.fecha_local, c.racha, c.primera_creacion, c.xp,
       m.mejor, u.ultima, u.actual
  from consecutivas c
  join mejores m on m.usuario_id = c.usuario_id
  join ultimas u on u.usuario_id = c.usuario_id;

delete from public.historial_racha
 where usuario_id in (select usuario_id from tmp_racha_calc);

insert into public.historial_racha (usuario_id, fecha, racha, xp_otorgado, creado_en)
select usuario_id, fecha_local, racha, xp, primera_creacion
  from tmp_racha_calc;

update public.racha r
   set racha_actual = c.actual,
       mejor_racha = greatest(r.mejor_racha, c.mejor),
       ultima_actividad = c.ultima,
       actualizado_en = now()
  from (select usuario_id, max(actual) as actual, max(mejor) as mejor, max(ultima) as ultima
          from tmp_racha_calc group by usuario_id) c
 where r.usuario_id = c.usuario_id;

select public.fn_activar_escritura_sistema();
update public.perfil p
   set racha_dias = c.actual
  from (select usuario_id, max(actual) as actual from tmp_racha_calc group by usuario_id) c
 where p.id = c.usuario_id;
select public.fn_desactivar_escritura_sistema();

drop table tmp_racha_calc;
drop table tmp_racha_dias;
drop table tmp_racha_origen;

commit;

notify pgrst, 'reload schema';
