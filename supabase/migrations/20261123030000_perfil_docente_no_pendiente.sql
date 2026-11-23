-- =============================================================================
-- Invariante final e ineludible: ningun perfil puede ser docente y estar
-- pendiente de verificacion a la vez.
-- -----------------------------------------------------------------------------
-- El trigger de solicitud_docente cubre las aprobaciones, pero una escritura
-- directa posterior sobre perfil (SQL/PostgREST/service_role) podia dejar al
-- docente "Por verificar" otra vez. Esta CHECK lo hace imposible.
-- Tambien se corrige el trigger de sincronizacion para RESTAURAR el valor
-- previo de app.system_write en vez de apagarlo siempre (un llamador que ya
-- lo hubiera activado no debe verse con el flag desactivado a mitad de tx).
-- =============================================================================

begin;

-- Reparacion idempotente por si hay datos rezagados.
select public.fn_activar_escritura_sistema();
update public.perfil p
   set estado_cuenta = 'activo', actualizado_en = now()
  from public.solicitud_docente s
 where s.usuario_id = p.id
   and s.estado = 'aprobada'
   and p.rol = 'docente'
   and p.estado_cuenta = 'pendiente_verificacion';
select public.fn_desactivar_escritura_sistema();

alter table public.perfil
    drop constraint if exists perfil_docente_no_pendiente;
alter table public.perfil
    add constraint perfil_docente_no_pendiente
    check (not (
        rol = 'docente'::public.rol_usuario
        and estado_cuenta = 'pendiente_verificacion'::public.estado_cuenta
    ));

-- Restaurar el flag previo en el trigger de sincronizacion.
create or replace function public.fn_solicitud_docente_sync_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_flag_anterior text := coalesce(current_setting('app.system_write', true), 'off');
begin
    if new.estado::text = 'aprobada' then
        perform public.fn_activar_escritura_sistema();

        update public.perfil
           set rol = 'docente'::public.rol_usuario,
               estado_cuenta = 'activo'::public.estado_cuenta,
               actualizado_en = now()
         where id = new.usuario_id
           and (
                rol is distinct from 'docente'::public.rol_usuario
                or estado_cuenta is distinct from 'activo'::public.estado_cuenta
           );

        -- No desactivar incondicionalmente: devolver el valor con el que
        -- entramos (un llamador podria haber activado el flag antes).
        perform set_config('app.system_write', v_flag_anterior, true);
    end if;

    return new;
end;
$$;

commit;
