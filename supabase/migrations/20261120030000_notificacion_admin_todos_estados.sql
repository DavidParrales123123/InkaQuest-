-- =============================================================================
-- Avisos del administrador: incluir cuentas pendientes de verificación
-- -----------------------------------------------------------------------------
-- El RPC crear_notificacion_admin solo seleccionaba estado_cuenta = 'activo',
-- por lo que los estudiantes con cuenta pendiente no recibían ningún aviso.
-- Ahora se excluyen únicamente cuentas eliminadas o suspendidas.
-- =============================================================================

begin;

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
    v_admin_id := public.efectivo_user_id();
    if v_admin_id is null then
        raise exception 'Autenticacion requerida.' using errcode = '42501';
    end if;
    if not public.app_is_admin() then
        raise exception 'Solo administradores pueden enviar notificaciones.' using errcode = '42501';
    end if;

    if length(v_titulo) < 3 or length(v_titulo) > 200 then
        raise exception 'El titulo debe tener entre 3 y 200 caracteres.' using errcode = '22023';
    end if;
    if length(v_mensaje) < 10 or length(v_mensaje) > 4000 then
        raise exception 'El mensaje debe tener entre 10 y 4000 caracteres.' using errcode = '22023';
    end if;

    if p_segmento = 'todos' then
        select array_agg(id) into v_destinatarios
          from public.perfil
         where estado_cuenta not in ('eliminado', 'suspendido');
    elsif p_segmento = 'estudiantes' then
        select array_agg(id) into v_destinatarios
          from public.perfil
         where estado_cuenta not in ('eliminado', 'suspendido') and rol = 'estudiante';
    elsif p_segmento = 'docentes' then
        select array_agg(id) into v_destinatarios
          from public.perfil
         where estado_cuenta not in ('eliminado', 'suspendido') and rol = 'docente';
    elsif p_segmento = 'administradores' then
        select array_agg(id) into v_destinatarios
          from public.perfil
         where estado_cuenta not in ('eliminado', 'suspendido') and rol = 'administrador';
    elsif p_segmento = 'usuario' then
        if v_email_norm = '' then
            raise exception 'Indica el correo del destinatario.' using errcode = '22023';
        end if;
        select id into v_objetivo
          from public.perfil
         where lower(email) = v_email_norm
           and estado_cuenta not in ('eliminado', 'suspendido');
        if v_objetivo is null then
            raise exception 'No existe ningun perfil con el correo %.', v_email_norm
                using errcode = '22023';
        end if;
        v_destinatarios := array[v_objetivo];
    else
        raise exception 'Segmento desconocido: %.', p_segmento using errcode = '22023';
    end if;

    if v_destinatarios is null or array_length(v_destinatarios, 1) = 0 then
        raise exception 'No hay destinatarios disponibles en el segmento elegido.'
            using errcode = '22023';
    end if;

    insert into public.notificacion
        (titulo, mensaje, canal, destinatario_id, variables, creado_por, enviada_en, clave_idempotencia)
    values
        (v_titulo, v_mensaje, p_canal, null, '{}'::jsonb, v_admin_id, now(),
         'admin:' || gen_random_uuid()::text)
    returning id into v_notificacion_id;

    insert into public.notificacion_destinatario
        (notificacion_id, usuario_id, canal, estado, enviada_en)
    select v_notificacion_id, d, p_canal, 'enviada', now()
      from unnest(v_destinatarios) as d
    on conflict (notificacion_id, usuario_id, canal) do nothing;
    get diagnostics v_count = row_count;

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

revoke all on function public.crear_notificacion_admin(text, text, text, text, public.canal_notificacion) from public, anon;
grant execute on function public.crear_notificacion_admin(text, text, text, text, public.canal_notificacion) to authenticated;

commit;
