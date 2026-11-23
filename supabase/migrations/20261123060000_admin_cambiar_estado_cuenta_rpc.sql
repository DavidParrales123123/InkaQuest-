-- =============================================================================
-- Cambio de estado de cuenta (activar/suspender) como RPC segura.
-- -----------------------------------------------------------------------------
-- El panel admin llamaba a un endpoint REST del backend que podia devolver
-- 500 "Ocurrio un error interno inesperado" (auditoria/RLS/contexto). Esta RPC
-- centraliza la operacion en la BD con SECURITY DEFINER, la misma validacion y
-- auditoria, y devuelve mensajes claros.
-- =============================================================================

begin;

create or replace function public.admin_cambiar_estado_cuenta(
    p_usuario_id uuid,
    p_estado     text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_admin   uuid := public.efectivo_user_id();
    v_anterior text;
    v_email   text;
begin
    if v_admin is null or not public.app_is_admin() then
        raise exception 'Solo un administrador puede cambiar el estado de una cuenta.'
            using errcode = '42501';
    end if;
    if p_usuario_id = v_admin then
        raise exception 'No puedes cambiar el estado de tu propia cuenta.'
            using errcode = '22023';
    end if;
    if p_estado not in ('activo', 'suspendido') then
        raise exception 'Solo se permite activar o suspender una cuenta.'
            using errcode = '22023';
    end if;

    select estado_cuenta::text, email into v_anterior, v_email
      from public.perfil
     where id = p_usuario_id;
    if not found then
        raise exception 'Usuario no encontrado.' using errcode = 'P0002';
    end if;

    -- trg_perfil_no_escalable exige contexto de sistema para cambiar estado_cuenta.
    perform public.fn_activar_escritura_sistema();
    update public.perfil
       set estado_cuenta = p_estado::public.estado_cuenta,
           actualizado_en = now()
     where id = p_usuario_id;
    perform public.fn_desactivar_escritura_sistema();

    insert into public.registro_accion
        (accion, entidad_tipo, entidad_id, actor_id, usuario_objetivo_id,
         valor_anterior, valor_nuevo, exito, creado_en)
    values
        ('actualizar', 'perfil', p_usuario_id, v_admin, p_usuario_id,
         jsonb_build_object('estado_cuenta', v_anterior),
         jsonb_build_object('estado_cuenta', p_estado),
         true, now());

    return jsonb_build_object(
        'ok', true,
        'mensaje', case when p_estado = 'activo'
            then 'Cuenta activada correctamente.'
            else 'Cuenta suspendida correctamente.' end);
end;
$$;

revoke all on function public.admin_cambiar_estado_cuenta(uuid, text) from public, anon;
grant execute on function public.admin_cambiar_estado_cuenta(uuid, text) to authenticated;

commit;
