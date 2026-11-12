-- =============================================================================
-- InkaQuest - Migración 20261112000007
-- Bloqueo del lado del servidor para entregas fuera de plazo.
--
-- Política universitaria: la tarea rechaza cualquier entrega pasada la
-- fecha_entrega de la tarea (sin tolerancia a entregas tardías). El
-- frontend ya impide la acción; esta barrera la garantiza a nivel de BD
-- aunque el cliente envíe la petición directamente.
-- =============================================================================

create or replace function public.fn_entrega_bloquear_tardio()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_limite timestamptz;
begin
    select t.fecha_entrega into v_limite
      from public.tarea t
     where t.id = new.tarea_id;

    -- ¿El cambio es de "entrega del estudiante"?
    --   INSERT en estado enviado  -> intentando entregar.
    --   UPDATE a/hacia enviado    -> enviando o editando una entrega.
    -- Las escrituras de revisión (estado 'revisada') las hace el docente: se
    -- permiten aunque la fecha límite ya haya pasado.
    if v_limite is not null and now() > v_limite then
        if tg_op = 'INSERT' and new.estado = 'enviado'::public.estado_entrega then
            raise exception 'El plazo de entrega ha vencido. Esta tarea no acepta entregas tardías.';
        end if;
        if tg_op = 'UPDATE' and new.estado = 'enviado'::public.estado_entrega
           and (old.estado is distinct from new.estado or old.contenido is distinct from new.contenido) then
            raise exception 'El plazo de entrega ha vencido. Esta tarea ya no acepta cambios.';
        end if;
    end if;

    return new;
end;
$$;

drop trigger if exists trg_entrega_bloquear_tardio on public.entrega;
create trigger trg_entrega_bloquear_tardio
    before insert or update on public.entrega
    for each row execute function public.fn_entrega_bloquear_tardio();

comment on function public.fn_entrega_bloquear_tardio() is
    'Bloquea INSERT/UPDATE del estudiante en entrega cuando la tarea ya cerró su fecha límite. La calificación (estado revisada) queda permitida para el docente.';
