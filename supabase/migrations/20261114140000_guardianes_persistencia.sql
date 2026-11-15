-- Persistencia del videojuego: registra el resultado de cada partida y permite
-- completar el nivel desde la UI del estudiante, reflejando XP y progreso de lekctione.
--
-- API:
--   guardianes_iniciar_intento(p_nivel_id uuid)
--   guardianes_finalizar_intento(p_intento_id, p_resultado, p_matados, p_hordas_consumidas,
--                                p_tiempo_segundos, p_precision)
--   guardianes_estado_campagna()
--
-- Cuando p_resultado = 'victoria', se marca la lekctione del nivel como completada
-- para el estudiante y se acreditan XP/monedas.

create or replace function public.guardianes_iniciar_intento(p_nivel_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_caller uuid := public.efectivo_user_id();
    v_id     uuid;
begin
    if v_caller is null then raise exception 'Autenticación requerida.' using errcode = '42501'; end if;

    if not exists (
        select 1
          from public.matricula m
          join public.leccion l on l.id = (select leccion_id from public.guardianes_nivel where id = p_nivel_id)
          join public.modulo mu on mu.id = l.modulo_id
          join public.unidad u  on u.id = mu.unidad_id
         where m.estudiante_id = v_caller
           and m.curso_id = u.curso_id
           and m.estado in ('activa', 'completada')
    ) then
        raise exception 'No estás matriculado en este curso.' using errcode = '42501';
    end if;

    insert into public.guardianes_intento (estudiante_id, nivel_id, estado)
    values (v_caller, p_nivel_id, 'en_curso')
    returning id into v_id;

    return v_id;
end;
$$;

comment on function public.guardianes_iniciar_intento(uuid) is
    'Crea un intento de partida del videojuego y devuelve el intento_id.';

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
    v_xp     integer := 0;
    v_coins  integer := 0;
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

    select * into v_nivel from public.guardianes_nivel where id = v_int.nivel_id;

    if p_resultado = 'victoria' then
        v_xp    := v_nivel.xp_recompensa;
        v_coins := v_nivel.monedas_recompensa;
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
           xp_recibido = v_xp,
           monedas_recibidas = v_coins,
           terminado_en = now()
     where id = p_intento_id;

    if v_xp > 0 then
        perform public.fn_registrar_xp(v_caller, v_xp, 'leccion_completada', 'guardianes_nivel', v_nivel.id);
        if v_nivel.leccion_id is not null then
            perform public.fn_registrar_completado_leccion(v_caller, v_nivel.leccion_id, v_nivel.leccion_id, 0);
        end if;
        insert into public.monedero (usuario_id, saldo)
        values (v_caller, v_coins)
        on conflict (usuario_id) do update
           set saldo = public.monedero.saldo + v_coins,
               actualizado_en = now();
        insert into public.transaccion_moneda (usuario_id, monedas, saldo_resultante, concepto, referencia_tipo, referencia_id)
        values (v_caller, v_coins, (select saldo from public.monedero where usuario_id = v_caller), 'guardianes_nivel', 'guardianes', v_nivel.id);
    end if;

    insert into public.guardianes_evento (estudiante_id, intento_id, evento, datos)
    values (v_caller, p_intento_id,
            case when p_resultado = 'victoria' then 'victoria' else p_resultado end,
            jsonb_build_object('xp', v_xp, 'monedas', v_coins, 'matados', p_matados, 'hordas', p_hordas, 'tiempo', p_tiempo));

    return jsonb_build_object('ok', true, 'xp', v_xp, 'monedas', v_coins,
                              'resultado', p_resultado,
                              'leccion_id', v_nivel.leccion_id);
end;
$$;

comment on function public.guardianes_finalizar_intento(uuid, text, smallint, smallint, bigint, numeric) is
    'Cierra un intento de partida: marca resultado, acredita XP/monedas (solo victoria), registra auditoría.';

revoke all on function public.guardianes_iniciar_intento(uuid) from public, anon;
revoke all on function public.guardianes_finalizar_intento(uuid, text, smallint, smallint, bigint, numeric) from public, anon;
grant execute on function public.guardianes_iniciar_intento(uuid) to authenticated;
grant execute on function public.guardianes_finalizar_intento(uuid, text, smallint, smallint, bigint, numeric) to authenticated;
