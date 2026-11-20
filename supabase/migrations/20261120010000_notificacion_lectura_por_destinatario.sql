-- =============================================================================
-- Notificaciones masivas visibles en la bandeja del estudiante
-- -----------------------------------------------------------------------------
-- El RPC crear_notificacion_admin inserta UNA notificación por envío con
-- destinatario_id = NULL (broadcast) y una fila por usuario en
-- notificacion_destinatario. La política anterior de SELECT sobre notificacion
-- solo permitía ver filas donde destinatario_id = el usuario (o admin), así
-- que los avisos masivos quedaban invisibles: el destinatario existía pero el
-- contenido se filtraba por RLS y el centro de notificaciones lo descartaba.
--
-- Ahora también se puede leer una notificación cuando EXISTS una fila de
-- entrega para el usuario autenticado. No debilita la seguridad: sigue
-- requiriendo sesión y pertenencia real al destinatario.
-- =============================================================================

begin;

drop policy if exists pol_notificacion_select on public.notificacion;
create policy pol_notificacion_select on public.notificacion
    for select to authenticated
    using (
        destinatario_id = public.efectivo_user_id()
        or public.app_is_admin()
        or exists (
            select 1
              from public.notificacion_destinatario nd
             where nd.notificacion_id = notificacion.id
               and nd.usuario_id = public.efectivo_user_id()
        )
    );

comment on policy pol_notificacion_select on public.notificacion is
    'Lectura: destinatario directo, admin, o usuario con fila de entrega en notificacion_destinatario.';

commit;
