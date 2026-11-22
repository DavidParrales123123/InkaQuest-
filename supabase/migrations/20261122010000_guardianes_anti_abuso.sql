-- =============================================================================
-- Blindaje anti-abuso de Guardianes y gamificacion
-- -----------------------------------------------------------------------------
-- 1) Una pregunta solo puede responderse UNA vez por intento. Habia 15 filas
--    duplicadas en produccion: cada repeticion correcta daba +15 XP y monedas.
-- 2) guardianes_responder_pregunta es idempotente: devuelve el resultado ya
--    registrado sin volver a premiar, y ya no revela la pista gratis.
-- 3) Las monedas las credita UNICAMENTE el trigger trg_creditar_monedas_por_xp
--    (1 por cada 5 XP). Se quitan los creditos manuales que duplicaban el saldo.
-- 4) fn_actualizar_racha valida identidad y usa un lock para que dos llamadas
--    concurrentes (layout + dashboard) no acuerden dos veces el XP diario.
-- =============================================================================

begin;

-- ---------- 1. Una respuesta por pregunta e intento ----------
delete from public.guardianes_respuesta a
 using public.guardianes_respuesta b
 where a.intento_id = b.intento_id
   and a.pregunta_id = b.pregunta_id
   and a.ctid > b.ctid;

alter table public.guardianes_respuesta
  drop constraint if exists guardianes_respuesta_intento_pregunta_uniq;
alter table public.guardianes_respuesta
  add constraint guardianes_respuesta_intento_pregunta_uniq
  unique (intento_id, pregunta_id);

-- ---------- 2. Chequeo idempotente y sin pista gratis ----------
create or replace function public.guardianes_responder_pregunta(
    p_intento_id  uuid,
    p_pregunta_id uuid,
    p_respuesta   text,
    p_duracion_ms integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_caller    uuid := public.efectivo_user_id();
    v_int       public.guardianes_intento%rowtype;
    v_p         public.guardianes_pregunta%rowtype;
    v_prev      public.guardianes_respuesta%rowtype;
    v_correcta  boolean;
    v_xp        integer := 0;
    v_coins     integer := 0;
begin
    if v_caller is null then
        raise exception 'Autenticación requerida.' using errcode = '42501';
    end if;

    select * into v_int
      from public.guardianes_intento
     where id = p_intento_id
       and estudiante_id = v_caller;
    if not found then
        raise exception 'Intento no encontrado.' using errcode = '22023';
    end if;
    if v_int.estado <> 'en_curso' then
        raise exception 'El intento no está en curso.' using errcode = '22023';
    end if;

    select * into v_p
      from public.guardianes_pregunta
     where id = p_pregunta_id
       and nivel_id = v_int.nivel_id;
    if not found then
        raise exception 'Pregunta no encontrada para este nivel.' using errcode = '22023';
    end if;

    -- Idempotencia: responder dos veces la misma pregunta no otorga mas premios.
    select * into v_prev
      from public.guardianes_respuesta
     where intento_id = p_intento_id
       and pregunta_id = p_pregunta_id;
    if found then
        return jsonb_build_object(
            'es_correcta', v_prev.es_correcta,
            'explicacion', v_p.explicacion,
            'xp', 0, 'monedas', 0, 'ya_respondida', true);
    end if;

    v_correcta := lower(btrim(coalesce(v_p.correcta, ''))) = lower(btrim(coalesce(p_respuesta, '')));

    begin
        insert into public.guardianes_respuesta
            (intento_id, pregunta_id, respuesta, es_correcta, duracion_ms)
        values
            (p_intento_id, p_pregunta_id, coalesce(p_respuesta, ''), v_correcta,
             greatest(0, coalesce(p_duracion_ms, 0)));
    exception when unique_violation then
        -- Carrera entre dos clics: el primero gana, el segundo no premia.
        return jsonb_build_object(
            'es_correcta', v_correcta, 'explicacion', v_p.explicacion,
            'xp', 0, 'monedas', 0, 'ya_respondida', true);
    end;

    if v_correcta then
        v_xp := 15;
        -- El trigger trg_creditar_monedas_por_xp acredita floor(15/5) = 3.
        v_coins := 3;
        perform public.fn_registrar_xp(v_caller, v_xp, 'reto_resuelto', 'guardianes_pregunta', v_p.id);
        update public.guardianes_intento
           set xp_recibido = xp_recibido + v_xp,
               monedas_recibidas = monedas_recibidas + v_coins
         where id = p_intento_id;
    end if;

    insert into public.guardianes_evento (estudiante_id, intento_id, evento, datos)
    values (v_caller, p_intento_id, 'chequeo_academico',
            jsonb_build_object('pregunta_id', v_p.id, 'correcta', v_correcta,
                               'xp', v_xp, 'monedas', v_coins,
                               'duracion_ms', p_duracion_ms));

    -- No se devuelve 'pista': era informacion gratis para quien llamara al RPC.
    return jsonb_build_object('es_correcta', v_correcta,
                              'explicacion', v_p.explicacion,
                              'xp', v_xp, 'monedas', v_coins);
end;
$$;

comment on function public.guardianes_responder_pregunta(uuid, uuid, text, integer) is
    'Califica el chequeo academico. Idempotente por pregunta/intento; las monedas las acredita el trigger de XP.';

-- ---------- 3. Cierre de intento: monedas solo desde el trigger ----------
create or replace function public.guardianes_finalizar_intento(
    p_intento_id    uuid,
    p_resultado     text,
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

    -- Cierre idempotente
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
        -- Misma regla que el trigger (1 moneda por cada 5 XP): el valor
        -- devuelto y guardado refleja lo que realmente se acredita.
        v_coins := floor(v_xp / 5)::integer;
    else
        v_xp := 0; v_coins := 0;
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
            end if;
        end if;
        -- Monedas: solo el trigger de transaccion_xp. No se insertan aqui.
    end if;

    insert into public.guardianes_evento (estudiante_id, intento_id, evento, datos)
    values (v_caller, p_intento_id,
            case when p_resultado = 'victoria' then 'victoria' else p_resultado end,
            jsonb_build_object('xp', v_xp, 'monedas', v_coins, 'matados', p_matados,
                               'hordas', p_hordas, 'tiempo', p_tiempo));

    return jsonb_build_object('ok', true, 'xp', v_xp, 'monedas', v_coins,
                              'xp_total', v_xp_total, 'monedas_total', v_coins_total);
end;
$$;

-- ---------- 4. Racha: identidad y concurrencia ----------
create or replace function public.fn_actualizar_racha(p_usuario_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_caller    uuid := public.efectivo_user_id();
    v_racha     integer;
    v_ultima    date;
    v_hoy       date := current_date;
    v_nueva     integer;
    v_xp_racha  integer;
begin
    -- Un usuario no puede alterar la racha de otro. El backend usa
    -- service_role y fija app.current_user_id al usuario real.
    if v_caller is null then
        raise exception 'Autenticación requerida.' using errcode = '42501';
    end if;
    if v_caller <> p_usuario_id and not public.app_is_admin() then
        raise exception 'No puedes modificar la racha de otro usuario.' using errcode = '42501';
    end if;

    -- Serializa llamadas concurrentes (layout + dashboard) para que solo
    -- una otorgue el XP del dia.
    perform pg_advisory_xact_lock(hashtext('racha:' || p_usuario_id::text));

    select racha_actual, ultima_actividad into v_racha, v_ultima
      from public.racha where usuario_id = p_usuario_id;

    if v_racha is null then v_racha := 0; v_ultima := null; end if;
    if v_ultima = v_hoy then return v_racha; end if;

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

revoke all on function public.fn_actualizar_racha(uuid) from public, anon;
grant execute on function public.fn_actualizar_racha(uuid) to service_role, authenticated;

commit;
