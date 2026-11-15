-- Chequeo académico de Guardianes del Conocimiento.
-- Entre hordas (después de elegir mejora), el estudiante responde 1 pregunta
-- de la lección asociada al nivel. Acierto = +15 XP y +3 monedas (reto_resuelto).
-- Un fallo nunca bloquea el avance: se muestra la explicación y se continúa.
--
-- RPCs:
--   guardianes_pregunta_aleatoria(p_nivel_id, p_excluir)  -> 1 fila sin la respuesta correcta
--   guardianes_responder_pregunta(p_intento_id, p_pregunta_id, p_respuesta, p_duracion_ms)

-- ── Pregunta aleatoria (sin revelar la correcta) ─────────────────────────────
create or replace function public.guardianes_pregunta_aleatoria(
    p_nivel_id uuid,
    p_excluir  uuid[] default '{}'
)
returns table (pregunta_id uuid, enunciado text, opciones jsonb, tema text, dificultad text, tipo text)
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_caller uuid := public.efectivo_user_id();
begin
    if v_caller is null then
        raise exception 'Autenticación requerida.' using errcode = '42501';
    end if;

    -- Solo estudiantes matriculados en el curso dueño del nivel
    if not exists (
        select 1
          from public.matricula m
          join public.leccion l  on l.id = (select leccion_id from public.guardianes_nivel where id = p_nivel_id)
          join public.modulo  mu on mu.id = l.modulo_id
          join public.unidad  u  on u.id = mu.unidad_id
         where m.estudiante_id = v_caller
           and m.curso_id      = u.curso_id
           and m.estado in ('activa', 'completada')
    ) then
        raise exception 'No estás matriculado en este curso.' using errcode = '42501';
    end if;

    return query
        select p.id, p.enunciado, p.opciones, p.tema, p.dificultad, p.tipo
          from public.guardianes_pregunta p
         where p.nivel_id = p_nivel_id
           and coalesce(p.estado, 'activa') = 'activa'
           and p.opciones is not null
           and jsonb_array_length(p.opciones) >= 2
           and not (p.id = any (coalesce(p_excluir, '{}'::uuid[])))
         order by random()
         limit 1;
end;
$$;

comment on function public.guardianes_pregunta_aleatoria(uuid, uuid[]) is
    'Devuelve 1 pregunta activa de la lección del nivel (sin revelar la correcta), excluyendo ids ya vistos.';

-- ── Calificar respuesta y premiar el acierto ─────────────────────────────────
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

    -- La pregunta debe pertenecer al nivel del intento (anti fuera de contexto)
    select * into v_p
      from public.guardianes_pregunta
     where id = p_pregunta_id
       and nivel_id = v_int.nivel_id;
    if not found then
        raise exception 'Pregunta no encontrada para este nivel.' using errcode = '22023';
    end if;

    v_correcta := lower(btrim(coalesce(v_p.correcta, ''))) = lower(btrim(coalesce(p_respuesta, '')));

    insert into public.guardianes_respuesta
        (intento_id, pregunta_id, respuesta, es_correcta, duracion_ms)
    values
        (p_intento_id, p_pregunta_id, coalesce(p_respuesta, ''), v_correcta, greatest(0, coalesce(p_duracion_ms, 0)));

    if v_correcta then
        v_xp := 15;
        v_coins := 3;

        perform public.fn_registrar_xp(v_caller, v_xp, 'reto_resuelto', 'guardianes_pregunta', v_p.id);

        insert into public.monedero (usuario_id, saldo)
        values (v_caller, v_coins)
        on conflict (usuario_id) do update
           set saldo = public.monedero.saldo + v_coins,
               actualizado_en = now();
        insert into public.transaccion_moneda
            (usuario_id, monedas, saldo_resultante, concepto, referencia_tipo, referencia_id)
        values (v_caller, v_coins,
                (select saldo from public.monedero where usuario_id = v_caller),
                'guardianes_chequeo', 'guardianes', v_p.id);

        update public.guardianes_intento
           set xp_recibido       = xp_recibido + v_xp,
               monedas_recibidas = monedas_recibidas + v_coins
         where id = p_intento_id;
    end if;

    insert into public.guardianes_evento (estudiante_id, intento_id, evento, datos)
    values (v_caller, p_intento_id, 'chequeo_academico',
            jsonb_build_object('pregunta_id', v_p.id, 'correcta', v_correcta,
                               'xp', v_xp, 'monedas', v_coins,
                               'duracion_ms', p_duracion_ms));

    return jsonb_build_object('es_correcta', v_correcta,
                              'correcta',    v_p.correcta,
                              'explicacion', v_p.explicacion,
                              'pista',       v_p.pista,
                              'xp',          v_xp,
                              'monedas',     v_coins);
end;
$$;

comment on function public.guardianes_responder_pregunta(uuid, uuid, text, integer) is
    'Califica la respuesta del chequeo académico, registra el intento y acredita +15 XP / +3 monedas si acierta.';

revoke all on function public.guardianes_pregunta_aleatoria(uuid, uuid[]) from public, anon;
revoke all on function public.guardianes_responder_pregunta(uuid, uuid, text, integer) from public, anon;
grant execute on function public.guardianes_pregunta_aleatoria(uuid, uuid[]) to authenticated;
grant execute on function public.guardianes_responder_pregunta(uuid, uuid, text, integer) to authenticated;
