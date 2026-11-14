-- RPC para que un administrador envie notificaciones in-app segmentadas.
--
-- Contexto. El sistema solo generaba notificaciones via el trigger de
-- anuncios (fn_anuncio_notificar_estudiantes). Ningun componente admin podia
-- crear una notificacion (no hay politica INSERT para authenticated ni
-- endpoint REST). Esta funcion SECURITY DEFINER cierra ese hueco:
--   - exige app_is_admin() (verificado contra public.perfil, no contra el token);
--   - valida el contenido;
--   - inserta en public.notificacion + public.notificacion_destinatario
--     (una fila por destinatario activo);
--   - registra la accion en public.registro_accion (auditoria inmutable);
--   - devuelve el numero de destinatarios efectivos.

create or replace function public.crear_notificacion_admin(
    p_titulo   text,
    p_mensaje  text,
    p_segmento text    default 'todos',
    p_email    text    default null,
    p_canal    public.canal_notificacion default 'in_app'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_admin_id      uuid;
    v_destinatarios uuid[];
    v_objetivo      uuid;
    v_titulo        text := btrim(coalesce(p_titulo, ''));
    v_mensaje       text := btrim(coalesce(p_mensaje, ''));
    v_email_norm    text := lower(btrim(coalesce(p_email, '')));
    v_notificacion_id uuid;
    v_count         integer := 0;
begin
    -- 1) Autorizacion efectiva contra la BD (nunca contra el token).
    v_admin_id := public.efectivo_user_id();
    if v_admin_id is null then
        raise exception 'Autenticacion requerida.' using errcode = '42501';
    end if;
    if not public.app_is_admin() then
        raise exception 'Solo administradores pueden enviar notificaciones.' using errcode = '42501';
    end if;

    -- 2) Validacion de contenido.
    if length(v_titulo) < 3 then
        raise exception 'El titulo es obligatorio (minimo 3 caracteres).'
            using errcode = '22023';
    end if;
    if length(v_titulo) > 200 then
        raise exception 'El titulo no puede superar 200 caracteres.'
            using errcode = '22023';
    end if;
    if length(v_mensaje) < 10 then
        raise exception 'El mensaje es obligatorio (minimo 10 caracteres).'
            using errcode = '22023';
    end if;
    if length(v_mensaje) > 4000 then
        raise exception 'El mensaje no puede superar 4000 caracteres.'
            using errcode = '22023';
    end if;

    -- 3) Resolucion de destinatarios (solo perfiles activos).
    if p_segmento = 'todos' then
        select array_agg(id) into v_destinatarios
          from public.perfil
         where estado_cuenta = 'activo';
    elsif p_segmento = 'estudiantes' then
        select array_agg(id) into v_destinatarios
          from public.perfil
         where estado_cuenta = 'activo' and rol = 'estudiante';
    elsif p_segmento = 'docentes' then
        select array_agg(id) into v_destinatarios
          from public.perfil
         where estado_cuenta = 'activo' and rol = 'docente';
    elsif p_segmento = 'administradores' then
        select array_agg(id) into v_destinatarios
          from public.perfil
         where estado_cuenta = 'activo' and rol = 'administrador';
    elsif p_segmento = 'usuario' then
        if v_email_norm = '' then
            raise exception 'Indica el correo del destinatario.' using errcode = '22023';
        end if;
        select id into v_objetivo
          from public.perfil
         where lower(email) = v_email_norm;
        if v_objetivo is null then
            raise exception 'No existe ningun perfil con el correo %.', v_email_norm
                using errcode = '22023';
        end if;
        v_destinatarios := array[v_objetivo];
    else
        raise exception 'Segmento desconocido: %.', p_segmento using errcode = '22023';
    end if;

    if v_destinatarios is null or array_length(v_destinatarios, 1) = 0 then
        raise exception 'No hay destinatarios activos en el segmento elegido.'
            using errcode = '22023';
    end if;

    -- 4) Notificacion padre (broadcast logico: una por envio).
    insert into public.notificacion
        (titulo, mensaje, canal, destinatario_id, variables, creado_por, enviada_en, clave_idempotencia)
    values
        (v_titulo, v_mensaje, p_canal, null, '{}'::jsonb, v_admin_id, now(),
         'admin:' || gen_random_uuid()::text)
    returning id into v_notificacion_id;

    -- 5) Una fila de delivery+lectura por destinatario.
    insert into public.notificacion_destinatario
        (notificacion_id, usuario_id, canal, estado, enviada_en)
    select v_notificacion_id, d, p_canal, 'enviada', now()
      from unnest(v_destinatarios) as d
    on conflict (notificacion_id, usuario_id, canal) do nothing;
    get diagnostics v_count = row_count;

    -- 6) Auditoria inmutable.
    insert into public.registro_accion
        (codigo_evento, actor_id, entidad_tipo, entidad_id, accion,
         valor_nuevo, exito, correlation_id, duracion_ms)
    values
        ('notificacion_admin_enviada', v_admin_id, 'notificacion', v_notificacion_id, 'crear',
         jsonb_build_object('segmento', p_segmento, 'destinatarios', v_count, 'titulo', v_titulo),
         true, gen_random_uuid(), 0);

    return jsonb_build_object(
        'ok', true,
        'notificacion_id', v_notificacion_id,
        'destinatarios', v_count
    );
end;
$$;

-- Permisos: ejecutable por usuarios autenticados; la funcion valida admin por dentro.
revoke all on function public.crear_notificacion_admin(text, text, text, text, public.canal_notificacion) from public, anon;
grant execute on function public.crear_notificacion_admin(text, text, text, text, public.canal_notificacion) to authenticated;

comment on function public.crear_notificacion_admin(text, text, text, text, public.canal_notificacion) is
    'Envia una notificacion in-app segmentada. Exige app_is_admin(); escribe registro_accion.';
