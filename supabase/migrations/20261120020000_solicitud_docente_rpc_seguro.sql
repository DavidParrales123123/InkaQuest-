-- =============================================================================
-- Aprobación/rechazo de solicitudes docentes como RPC segura + notificación
-- -----------------------------------------------------------------------------
-- La aprobación pasa a ejecutarse íntegramente en la base (SECURITY DEFINER):
-- valida que quien llama sea administrador, cambia el rol, actualiza la
-- solicitud, registra la auditoría y notifica al estudiante en una sola
-- transacción. Así se elimina la dependencia del flujo Java del backend,
-- que podía fallar por contexto RLS o despliegues desactualizados.
-- =============================================================================

begin;

-- ---------- Aprobar ----------
create or replace function public.aprobar_solicitud_docente(
    p_solicitud_id uuid,
    p_motivo       text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_admin    uuid := public.efectivo_user_id();
    v_usuario  uuid;
    v_estado   text;
    v_notif    uuid;
    v_obs      text := btrim(coalesce(p_motivo, ''));
begin
    if v_admin is null or not public.app_is_admin() then
        raise exception 'Solo un administrador puede aprobar solicitudes.'
            using errcode = '42501';
    end if;

    select usuario_id, estado::text
      into v_usuario, v_estado
      from public.solicitud_docente
     where id = p_solicitud_id
       for update;

    if v_usuario is null then
        raise exception 'Solicitud no encontrada.' using errcode = 'P0002';
    end if;
    if v_estado <> 'pendiente' then
        raise exception 'Solo las solicitudes pendientes pueden aprobarse.'
            using errcode = '22023';
    end if;

    perform public.fn_activar_escritura_sistema();

    update public.perfil
       set rol = 'docente'
     where id = v_usuario;

    update public.solicitud_docente
       set estado = 'aprobada',
           revisado_por = v_admin,
           revisado_en = now(),
           motivo_revision = v_obs
     where id = p_solicitud_id;

    insert into public.registro_accion
        (accion, entidad_tipo, entidad_id, actor_id, usuario_objetivo_id,
         valor_anterior, valor_nuevo, exito, creado_en)
    values
        ('aprobar', 'solicitud_docente', p_solicitud_id, v_admin, v_usuario,
         '{"rol":"estudiante"}'::jsonb, '{"rol":"docente"}'::jsonb, true, now());

    insert into public.notificacion
        (titulo, mensaje, variables, canal, destinatario_id, entidad_tipo,
         entidad_id, enviada_en, clave_idempotencia, creado_por)
    values
        ('Solicitud de docente aprobada',
         'Tu solicitud para ser docente fue aprobada. Ya tienes acceso al panel docente.'
             || case when v_obs = '' then '' else ' Observación: ' || v_obs end,
         '{}'::jsonb, 'in_app', v_usuario, 'solicitud_docente', p_solicitud_id,
         now(), 'solicitud-docente-' || p_solicitud_id || '-aprobada', v_admin)
    on conflict (clave_idempotencia) do nothing
    returning id into v_notif;

    if v_notif is not null then
        insert into public.notificacion_destinatario
            (notificacion_id, usuario_id, canal, estado, enviada_en)
        values (v_notif, v_usuario, 'in_app', 'enviada', now())
        on conflict (notificacion_id, usuario_id, canal) do nothing;
    end if;

    perform public.fn_desactivar_escritura_sistema();

    return jsonb_build_object('ok', true, 'usuario_id', v_usuario);
end;
$$;

-- ---------- Rechazar ----------
create or replace function public.rechazar_solicitud_docente(
    p_solicitud_id uuid,
    p_motivo       text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_admin   uuid := public.efectivo_user_id();
    v_usuario uuid;
    v_estado  text;
    v_notif   uuid;
    v_obs     text := btrim(coalesce(p_motivo, 'Solicitud rechazada por el administrador.'));
begin
    if v_admin is null or not public.app_is_admin() then
        raise exception 'Solo un administrador puede rechazar solicitudes.'
            using errcode = '42501';
    end if;

    select usuario_id, estado::text
      into v_usuario, v_estado
      from public.solicitud_docente
     where id = p_solicitud_id
       for update;

    if v_usuario is null then
        raise exception 'Solicitud no encontrada.' using errcode = 'P0002';
    end if;
    if v_estado <> 'pendiente' then
        raise exception 'Solo las solicitudes pendientes pueden rechazarse.'
            using errcode = '22023';
    end if;

    perform public.fn_activar_escritura_sistema();

    update public.solicitud_docente
       set estado = 'rechazada',
           revisado_por = v_admin,
           revisado_en = now(),
           motivo_revision = v_obs
     where id = p_solicitud_id;

    insert into public.registro_accion
        (accion, entidad_tipo, entidad_id, actor_id, usuario_objetivo_id,
         valor_nuevo, exito, creado_en)
    values
        ('rechazar', 'solicitud_docente', p_solicitud_id, v_admin, v_usuario,
         jsonb_build_object('motivo', v_obs), true, now());

    insert into public.notificacion
        (titulo, mensaje, variables, canal, destinatario_id, entidad_tipo,
         entidad_id, enviada_en, clave_idempotencia, creado_por)
    values
        ('Solicitud de docente rechazada',
         'Tu solicitud para ser docente fue rechazada. Observación: ' || v_obs,
         '{}'::jsonb, 'in_app', v_usuario, 'solicitud_docente', p_solicitud_id,
         now(), 'solicitud-docente-' || p_solicitud_id || '-rechazada', v_admin)
    on conflict (clave_idempotencia) do nothing
    returning id into v_notif;

    if v_notif is not null then
        insert into public.notificacion_destinatario
            (notificacion_id, usuario_id, canal, estado, enviada_en)
        values (v_notif, v_usuario, 'in_app', 'enviada', now())
        on conflict (notificacion_id, usuario_id, canal) do nothing;
    end if;

    perform public.fn_desactivar_escritura_sistema();

    return jsonb_build_object('ok', true, 'usuario_id', v_usuario);
end;
$$;

revoke all on function public.aprobar_solicitud_docente(uuid, text) from public, anon;
revoke all on function public.rechazar_solicitud_docente(uuid, text) from public, anon;
grant execute on function public.aprobar_solicitud_docente(uuid, text) to authenticated;
grant execute on function public.rechazar_solicitud_docente(uuid, text) to authenticated;

commit;
