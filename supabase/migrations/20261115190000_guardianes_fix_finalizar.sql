-- =============================================================================
-- Fix: cierre de intento de Guardianes — resolución de curso y conversión XP→monedas
-- =============================================================================
-- Bugs corregidos respecto a 20261114140000_guardianes_persistencia.sql:
--   1) fn_registrar_completado_leccion se invocaba con el leccion_id en el
--      parámetro p_curso_id (firma real: estudiante, curso, leccion, minutos).
--      La matrícula no se encontraba, la función lanzaba excepción y TODO el
--      cierre del intento se revertía (ni XP, ni monedas, ni progreso de lección,
--      y por tanto el siguiente nivel no se desbloqueaba).
--   2) xp_recibido / monedas_recibidas se SOBRESCRIBÍAN con la recompensa del
--      nivel, borrando el XP acumulado en los chequeos académicos.
--   3) Las monedas de victoria se tomaban de monedas_recompensa fijo; ahora se
--      aplican las reglas del evento Guardianes: por cada 30 XP → 1 moneda.
--   4) Cierre idempotente: si el intento ya estaba cerrado, no se reacredita
--      nada y se devuelven los totales persistidos.
-- =============================================================================

create or replace function public.guardianes_finalizar_intento(
    p_intento_id    uuid,
    p_resultado     text,          -- 'victoria' | 'derrota' | 'abandonado'
    p_matados       smallint default 0,
    p_hordas        smallint default 0,
    p_tiempo        bigint   default 0,
    p_precision     numeric  default 100
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_caller uuid := public.efectivo_user_id();
    v_int    public.guardianes_intento%rowtype;
    v_nivel  public.guardianes_nivel%rowtype;
    v_curso_id uuid;
    v_xp     integer := 0;
    v_coins  integer := 0;
    v_xp_total integer := 0;
    v_coins_total integer := 0;
begin
    if v_caller is null then raise exception 'Autenticación requerida.' using errcode = '42501'; end if;
    if p_resultado not in ('victoria', 'derrota', 'abandonado') then
        raise exception 'Resultado desconocido: %.', p_resultado using errcode = '22023';
    end if;

    select * into v_int
      from public.guardianes_intento
     where id = p_intento_id
       and estudiante_id = v_caller;
    if not found then
        raise exception 'Intento no encontrado.' using errcode = '22023';
    end if;

    -- Idempotencia: un intento ya cerrado no vuelve a generar recompensas
    if v_int.estado <> 'en_curso' then
        select leccion_id into v_curso_id from public.guardianes_nivel where id = v_int.nivel_id;
        return jsonb_build_object('ok', true,
                                  'xp', v_int.xp_recibido,
                                  'monedas', v_int.monedas_recibidas,
                                  'resultado', case when v_int.estado = 'completado' then 'victoria' else 'derrota' end,
                                  'leccion_id', v_curso_id,
                                  'ya_cerrado', true);
    end if;

    select * into v_nivel from public.guardianes_nivel where id = v_int.nivel_id;

    if p_resultado = 'victoria' then
        v_xp    := v_nivel.xp_recompensa;
        -- Regla del evento: 1 moneda por cada 30 XP ganados (para la tienda)
        v_coins := floor(v_xp / 30)::integer;
    else
        v_xp    := 0;
        v_coins := 0;
    end if;

    update public.guardianes_intento
       set estado = case when p_resultado = 'victoria' then 'completado' else 'fallado' end,
           hordas_completadas = p_hordas,
           jefe_derrotado = (p_resultado = 'victoria'),
           puntaje = p_matados * 10,
           precision = regexp_replace(p_precision::text, '[^0-9.]', '')::numeric,
           tiempo_segundos = p_tiempo,
           xp_recibido = xp_recibido + v_xp,
           monedas_recibidas = monedas_recibidas + v_coins,
           terminado_en = now()
     where id = p_intento_id
    returning xp_recibido, monedas_recibidas into v_xp_total, v_coins_total;

    if v_xp > 0 then
        perform public.fn_registrar_xp(v_caller, v_xp, 'leccion_completada', 'guardianes_nivel', v_nivel.id);

        if v_nivel.leccion_id is not null then
            select u.curso_id into v_curso_id
              from public.leccion l
              join public.modulo mu on mu.id = l.modulo_id
              join public.unidad  u  on u.id  = mu.unidad_id
             where l.id = v_nivel.leccion_id;

            if v_curso_id is not null then
                perform public.fn_registrar_completado_leccion(v_caller, v_curso_id, v_nivel.leccion_id, 0);
            else
                raise warning 'guardianes: no se pudo resolver el curso de la leccion %', v_nivel.leccion_id;
            end if;
        end if;

        insert into public.monedero (usuario_id, saldo)
        values (v_caller, v_coins)
        on conflict (usuario_id) do update
           set saldo = public.monedero.saldo + v_coins,
               actualizado_en = now();
        insert into public.transaccion_moneda (usuario_id, monedas, saldo_resultante, concepto, referencia_tipo, referencia_id)
        values (v_caller, v_coins,
                (select saldo from public.monedero where usuario_id = v_caller),
                'guardianes_nivel', 'guardianes', v_nivel.id);
    end if;

    insert into public.guardianes_evento (estudiante_id, intento_id, evento, datos)
    values (v_caller, p_intento_id,
            case when p_resultado = 'victoria' then 'victoria' else p_resultado end,
            jsonb_build_object('xp', v_xp, 'monedas', v_coins, 'matados', p_matados, 'hordas', p_hordas, 'tiempo', p_tiempo));

    return jsonb_build_object('ok', true,
                              'xp', v_xp,
                              'monedas', v_coins,
                              'resultado', p_resultado,
                              'leccion_id', v_nivel.leccion_id,
                              'xp_acumulado', v_xp_total,
                              'monedas_acumuladas', v_coins_total);
end;
$$;

comment on function public.guardianes_finalizar_intento(uuid, text, smallint, smallint, bigint, numeric) is
    'Cierra un intento: marca resultado, acredita XP y monedas (victoria: 1 moneda por cada 30 XP), completa la lección asociada y registra auditoría. Idempotente.';

revoke all on function public.guardianes_finalizar_intento(uuid, text, smallint, smallint, bigint, numeric) from public, anon;
grant execute on function public.guardianes_finalizar_intento(uuid, text, smallint, smallint, bigint, numeric) to authenticated;
