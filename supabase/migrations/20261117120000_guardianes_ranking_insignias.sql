-- =============================================================================
-- Guardianes: ranking del curso + insignias del videojuego
-- -----------------------------------------------------------------------------
-- 1) Siembra insignias del juego (idempotente, con codigo estable).
-- 2) guardianes_ranking(): tabla de clasificación del curso para la campaña
--    del videojuego. Solo lectura; visible a matriculados activos/completados,
--    docente asignado o administrador del curso.
-- 3) guardianes_mejores_tiempos(): mejor tiempo por nivel (victoria).
-- 4) guardianes_finalizar_intento(): otorga las insignias por hito al ganar.
-- =============================================================================

begin;

-- ---------- 1. Insignias del videojuego (seed) ----------
insert into public.insignia (codigo, nombre, descripcion, icono, xp_otorgado, rareza, activa)
select v.codigo, v.nombre, v.descripcion, v.icono, v.xp, v.rareza, true
  from (values
    ('guardian_primera_victoria', 'Primera victoria',    'Ganaste tu primera partida del videojuego.',            '🏅',  50, 'comun'),
    ('guardian_templo',           'Guardián del Templo', 'Superaste el templo de la selva (nivel 5).',            '🌴', 120, 'raro'),
    ('guardian_desierto',         'Guardián del Desierto','Superaste el desierto (nivel 9).',                      '🏜️', 150, 'raro'),
    ('guardian_portal',           'Guardián del Portal', 'Superaste el portal arcano (nivel 12).',                '🔮', 180, 'epico'),
    ('guardian_glacial',          'Guardián del Glacial','Superaste el glacial (nivel 15).',                      '❄️', 220, 'epico'),
    ('guardian_algoritmo',        'Guardián del Algoritmo','Completaste los 18 niveles del videojuego.',           '👑', 500, 'legendario')
  ) as v(codigo, nombre, descripcion, icono, xp, rareza)
  where not exists (select 1 from public.insignia i where i.codigo = v.codigo or i.nombre = v.nombre);

-- ---------- 2. Ranking del curso ----------
create or replace function public.guardianes_ranking()
returns table (
    estudiante_id uuid,
    nombre text,
    apellido text,
    avatar_url text,
    nivel_max integer,
    victorias integer,
    xp_total integer,
    es_yo boolean
)
language plpgsql stable
security definer
set search_path = ''
as $$
declare
    v_caller uuid := public.efectivo_user_id();
    v_curso  uuid := 'ab8e59ef-ab9f-40eb-8f31-790ac7edba4a';
begin
    if v_caller is null then raise exception 'Autenticación requerida.' using errcode = '42501'; end if;
    if not exists (select 1 from public.matricula m
                    where m.estudiante_id = v_caller and m.curso_id = v_curso
                      and m.estado in ('activa','completada'))
       and not exists (select 1 from public.docente_curso dc
                        where dc.docente_id = v_caller and dc.curso_id = v_curso and dc.activo = true)
       and not public.app_is_admin() then
        raise exception 'No estás autorizado para ver el ranking.' using errcode = '42501';
    end if;

    return query
      select p.id,
             p.nombre,
             p.apellido,
             p.avatar_url,
             coalesce(max(gn.numero) filter (where i.estado = 'completado'), 0)::integer,
             count(i.id) filter (where i.estado = 'completado')::integer,
             coalesce(sum(i.xp_recibido), 0)::integer,
             (p.id = v_caller)
        from public.perfil p
        join public.matricula m on m.estudiante_id = p.id
                               and m.curso_id = v_curso
                               and m.estado in ('activa','completada')
        left join public.guardianes_intento i on i.estudiante_id = p.id
        left join public.guardianes_nivel gn on gn.id = i.nivel_id
       group by p.id, p.nombre, p.apellido, p.avatar_url
       order by 5 desc, 6 desc, 7 desc
       limit 100;
end;
$$;

-- ---------- 3. Mejores tiempos (1 por nivel) ----------
create or replace function public.guardianes_mejores_tiempos()
returns table (
    nivel_numero integer,
    nombre text,
    apellido text,
    tiempo_segundos bigint,
    es_yo boolean
)
language plpgsql stable
security definer
set search_path = ''
as $$
declare
    v_caller uuid := public.efectivo_user_id();
    v_curso  uuid := 'ab8e59ef-ab9f-40eb-8f31-790ac7edba4a';
begin
    if v_caller is null then raise exception 'Autenticación requerida.' using errcode = '42501'; end if;
    if not exists (select 1 from public.matricula m
                    where m.estudiante_id = v_caller and m.curso_id = v_curso
                      and m.estado in ('activa','completada'))
       and not exists (select 1 from public.docente_curso dc
                        where dc.docente_id = v_caller and dc.curso_id = v_curso and dc.activo = true)
       and not public.app_is_admin() then
        raise exception 'No estás autorizado para ver los mejores tiempos.' using errcode = '42501';
    end if;

    return query
      select distinct on (gn.numero) gn.numero, p.nombre, p.apellido, i.tiempo_segundos, (p.id = v_caller) as es_yo
        from public.guardianes_intento i
        join public.perfil p on p.id = i.estudiante_id
        join public.guardianes_nivel gn on gn.id = i.nivel_id
       where i.estado = 'completado'
       order by gn.numero, i.tiempo_segundos asc;
end;
$$;

comment on function public.guardianes_ranking() is
    'Tabla de clasificación del curso en el videojuego: mayor nivel superado, victorias y XP. Solo curso.';
comment on function public.guardianes_mejores_tiempos() is
    'Mejor tiempo (mínimo) registrado con victoria por nivel, visible solo para el curso.';

revoke all on function public.guardianes_ranking() from public, anon;
grant execute on function public.guardianes_ranking() to authenticated;
revoke all on function public.guardianes_mejores_tiempos() from public, anon;
grant execute on function public.guardianes_mejores_tiempos() to authenticated;

-- ---------- 4. Otorgar insignias al ganar ----------
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
        return jsonb_build_object('ok', true,
                                  'xp', v_int.xp_recibido,
                                  'monedas', v_int.monedas_recibidas,
                                  'resultado', case when v_int.estado = 'completado' then 'victoria' else 'derrota' end,
                                  'leccion_id', (select leccion_id from public.guardianes_nivel where id = v_int.nivel_id),
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
            perform public.fn_registrar_completado_leccion(v_caller,
                (select u.curso_id from public.leccion l
                   join public.modulo mu on mu.id = l.modulo_id
                   join public.unidad  u  on u.id = mu.unidad_id
                  where l.id = v_nivel.leccion_id),
                v_nivel.leccion_id, 0);
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

    -- Insignias del juego por hitos (acumulativas, solo con victoria)
    if p_resultado = 'victoria' then
        perform public.fn_otorgar_insignia(v_caller,
            (select id from public.insignia where codigo = 'guardian_primera_victoria' limit 1),
            'guardia_primera_victoria');
        if v_nivel.numero >= 5 then
            perform public.fn_otorgar_insignia(v_caller,
                (select id from public.insignia where codigo = 'guardian_templo' limit 1),
                'guardia_templo');
        end if;
        if v_nivel.numero >= 9 then
            perform public.fn_otorgar_insignia(v_caller,
                (select id from public.insignia where codigo = 'guardian_desierto' limit 1),
                'guardia_desierto');
        end if;
        if v_nivel.numero >= 12 then
            perform public.fn_otorgar_insignia(v_caller,
                (select id from public.insignia where codigo = 'guardian_portal' limit 1),
                'guardia_portal');
        end if;
        if v_nivel.numero >= 15 then
            perform public.fn_otorgar_insignia(v_caller,
                (select id from public.insignia where codigo = 'guardian_glacial' limit 1),
                'guardia_glacial');
        end if;
        if v_nivel.numero >= 18 then
            perform public.fn_otorgar_insignia(v_caller,
                (select id from public.insignia where codigo = 'guardian_algoritmo' limit 1),
                'guardia_algoritmo');
        end if;
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

revoke all on function public.guardianes_finalizar_intento(uuid, text, smallint, smallint, bigint, numeric) from public, anon;
grant execute on function public.guardianes_finalizar_intento(uuid, text, smallint, smallint, bigint, numeric) to authenticated;

commit;
