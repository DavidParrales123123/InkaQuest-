-- pendiente_verificacion es un estado legitimo en tramite (el propio RPC de
-- notificaciones masivas ya lo trata como destinatario). Solo suspendido y
-- eliminado deben perder el acceso.

begin;

create or replace function public.app_cuenta_habilitada(p_usuario_id uuid)
returns boolean
language sql
security definer
set search_path = ''
set row_security = off
stable
as $$
    select exists (
        select 1 from public.perfil
         where id = p_usuario_id
           and estado_cuenta in (
               'activo'::public.estado_cuenta,
               'pendiente_verificacion'::public.estado_cuenta
           )
    );
$$;

revoke all on function public.app_cuenta_habilitada(uuid) from public, anon, authenticated;

commit;
