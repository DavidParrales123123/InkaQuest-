-- El backend Spring inserta en public.registro_accion al cambiar el estado de
-- una cuenta (AdminUsuariosService.cambiarEstadoCuenta). La tabla tiene RLS
-- FORCE y solo tenia politica SELECT, asi que ese INSERT fallaba con:
--   ERROR: new row violates row-level security policy for table "registro_accion"
-- y, al estar en la misma transaccion, se revertia el UPDATE de perfil.
-- Resultado: "Activar"/"Suspender" no cambiaban nada.

begin;

drop policy if exists pol_registro_accion_insert on public.registro_accion;
create policy pol_registro_accion_insert on public.registro_accion
    for insert to public
    with check (
        public.app_is_admin()
        or current_user in ('inkaquest_api', 'service_role', 'postgres')
    );

commit;
