-- =============================================================================
-- Insignias funcionales de extremo a extremo
-- -----------------------------------------------------------------------------
-- 1) fn_actualizar_racha: otorga la insignia 'Racha 7 días' cuando la racha
--    del usuario alcanza 7 (el catálogo la ofrecía pero nadie la otorgaba).
-- 2) Backfill retroactivo (una sola vez): asigna también las insignias a
--    estudiantes que ya cumplían las condiciones ANTES del despliegue.
-- -----------------------------------------------------------------------------
-- Además, el catálogo y el progreso ya se muestran en "Insignias y logros"
-- (Spring lee insignia + insignia_usuario), y las de Guardianes se otorgan en
-- cada victoria (guardianes_finalizar_intento). Con esto quedan CUBIERTAS
-- TODAS las insignias del catálogo.
-- =============================================================================

begin;

-- ---------- 1. Racha: otorga la insignia al llegar a 7 ----------
create or replace function public.fn_actualizar_racha(p_usuario_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_racha     integer;
    v_ultima    date;
    v_hoy       date := current_date;
    v_nueva     integer;
    v_xp_racha  integer;
begin
    select racha_actual, ultima_actividad into v_racha, v_ultima
      from public.racha where usuario_id = p_usuario_id;

    if v_racha is null then
        v_racha := 0;
        v_ultima := null;
    end if;

    -- Mismo dia: no se modifica
    if v_ultima = v_hoy then
        return v_racha;
    end if;

    -- Dia consecutivo: incrementa
    if v_ultima = v_hoy - 1 then
        v_nueva := v_racha + 1;
    else
        v_nueva := 1;
    end if;

    insert into public.racha (usuario_id, racha_actual, mejor_racha, ultima_actividad)
    values (p_usuario_id, v_nueva, v_nueva, v_hoy)
    on conflict (usuario_id) do update
        set racha_actual = excluded.racha_actual,
            mejor_racha = greatest(public.racha.mejor_racha, excluded.mejor_racha),
            ultima_actividad = excluded.ultima_actividad;

    insert into public.historial_racha (usuario_id, fecha, racha)
    values (p_usuario_id, v_hoy, v_nueva)
    on conflict (usuario_id, fecha) do nothing;

    -- XP por racha: consultamos la regla configurable
    select coalesce(r.valor, 0) into v_xp_racha
      from public.regla_progresion r
     where r.activa and r.tipo = 'racha'
     order by r.valor desc
     limit 1;

    if v_xp_racha > 0 then
        perform public.fn_registrar_xp(p_usuario_id, v_xp_racha, 'racha_diaria', 'racha', null);
    end if;

    -- Otorgar insignia de racha de 7 dias (idempotente; solo se otorga una vez)
    if v_nueva >= 7 then
        perform public.fn_otorgar_insignia(
            p_usuario_id,
            (select id from public.insignia where codigo = 'RACHA_7_DIAS' limit 1),
            'racha_7_dias'
        );
    end if;

    -- Actualizacion del perfil (racha): escritura del sistema
    perform public.fn_activar_escritura_sistema();

    update public.perfil
       set racha_dias = v_nueva
     where id = p_usuario_id;

    perform public.fn_desactivar_escritura_sistema();

    return v_nueva;
end;
$$;

comment on function public.fn_actualizar_racha(uuid) is
    'Actualiza la racha diaria del usuario y otorga la insignia RACHA_7_DIAS al llegar a 7 dias.';

revoke all on function public.fn_actualizar_racha(uuid) from public, anon;
grant execute on function public.fn_actualizar_racha(uuid) to service_role, authenticated;

-- ---------- 2. Backfill retroactivo (una sola vez, idempotente) ----------
-- 2a) Insignia de racha: usuarios con racha >= 7 antes del despliegue
do $$
declare
    r record;
begin
    for r in
        select usuario_id from public.racha where racha_actual >= 7
    loop
        perform public.fn_otorgar_insignia(
            r.usuario_id,
            (select id from public.insignia where codigo = 'RACHA_7_DIAS' limit 1),
            'backfill_racha_7_dias'
        );
    end loop;
end $$;

-- 2b) Insignias del videojuego por hitos ya alcanzados antes del despliegue
do $$
declare
    v_umbrales integer[] := array[1, 5, 9, 12, 15, 18];
    v_codigos  text[] := array[
        'guardian_primera_victoria',
        'guardian_templo',
        'guardian_desierto',
        'guardian_portal',
        'guardian_glacial',
        'guardian_algoritmo'
    ];
    v_i    integer;
    r      record;
begin
    for v_i in 1..6 loop
        for r in
            select distinct i.estudiante_id
              from public.guardianes_intento i
              join public.guardianes_nivel gn on gn.id = i.nivel_id
             where i.estado = 'completado'
               and gn.numero >= v_umbrales[v_i]
        loop
            perform public.fn_otorgar_insignia(
                r.estudiante_id,
                (select id from public.insignia where codigo = v_codigos[v_i] limit 1),
                'backfill_' || v_codigos[v_i]
            );
        end loop;
    end loop;
end $$;

commit;
