-- =============================================================================
-- InkaQuest - Migración 20261112000005
-- Crea un minijuego (juego + contenido) para un docente, usando uno de los
-- 96 motores sembrados. Autorizado solo para docentes del curso destino.
-- =============================================================================

create or replace function public.fn_crear_juego_docente(
    p_curso_id       uuid,
    p_motor_codigo   text,
    p_nombre         text,
    p_descripcion    text,
    p_dificultad     text,
    p_xp_otorgado    integer,
    p_tiempo_limite_seg integer,
    p_contenido      jsonb,
    p_leccion_id     uuid default null
)
returns table (juego_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_motor_id  uuid;
    v_juego_id  uuid;
    v_codigo    text;
    v_dificultad public.nivel_dificultad;
begin
    -- Solo un docente asignado al curso (o admin) puede crear juegos.
    if not public.app_es_docente_del_curso(p_curso_id) and not public.app_is_admin() then
        raise exception 'No tienes permisos sobre este curso.';
    end if;

    -- El motor debe existir y estar activo.
    select id into v_motor_id
    from public.motor
    where codigo = p_motor_codigo
      and estado = 'activo';
    if v_motor_id is null then
        raise exception 'Motor no encontrado o inactivo: %', p_motor_codigo;
    end if;

    -- Dificultad por defecto: facil.
    v_dificultad := coalesce(p_dificultad::public.nivel_dificultad, 'facil');

    -- Código único del juego (motor-NNNN aleatorio para evitar colisiones).
    v_codigo := p_motor_codigo || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);

    insert into public.juego (
        motor_id, codigo, nombre, descripcion, estado, dificultad,
        xp_otorgado, tiempo_limite_seg, creado_por, publicado_en
    ) values (
        v_motor_id, v_codigo, trim(p_nombre), p_descripcion, 'publicado',
        v_dificultad, greatest(0, coalesce(p_xp_otorgado, 0)),
        nullif(p_tiempo_limite_seg, 0),
        public.efectivo_user_id(), now()
    )
    returning id into v_juego_id;

    -- Guardar contenido del juego como configuración (clave=contenido).
    if p_contenido is not null then
        insert into public.configuracion_juego (juego_id, clave, valor, descripcion)
        values (v_juego_id, 'contenido', p_contenido, 'Contenido del minijuego');
    end if;

    return query select v_juego_id;
end;
$$;

comment on function public.fn_crear_juego_docente(uuid, text, text, text, text, integer, integer, jsonb, uuid) is
    'Crea un juego publicado con su contenido y retorna su id (solo docente del curso o admin).';
