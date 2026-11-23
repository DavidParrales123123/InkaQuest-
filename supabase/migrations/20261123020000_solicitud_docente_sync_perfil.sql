-- =============================================================================
-- Invariante: toda solicitud de docente APROBADA debe tener un perfil con
-- rol = 'docente' Y estado_cuenta = 'activo'.
-- -----------------------------------------------------------------------------
-- Antes, cada via de aprobacion tenia que acordarse de hacer los dos UPDATEs.
-- Si alguna no lo hacia (o se aprobaba por SQL directo), el docente aparecia
-- como "por verificar" en el panel admin. Este trigger AFTER es la unica
-- fuente de verdad: se dispare la via que se dispare, el perfil queda coherente.
-- =============================================================================

begin;

create or replace function public.fn_solicitud_docente_sync_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    if new.estado::text = 'aprobada' then
        -- trg_perfil_no_escalable exige contexto de sistema para tocar rol/
        -- estado_cuenta; se activa dentro de la misma transaccion.
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

        perform public.fn_desactivar_escritura_sistema();
    end if;

    return new;
end;
$$;

drop trigger if exists trg_solicitud_docente_sync_perfil on public.solicitud_docente;
create trigger trg_solicitud_docente_sync_perfil
    after insert or update of estado on public.solicitud_docente
    for each row execute function public.fn_solicitud_docente_sync_perfil();

commit;
