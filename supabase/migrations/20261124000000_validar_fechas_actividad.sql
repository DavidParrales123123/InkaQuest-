-- =============================================================================
-- InkaQuest - Migración 20261124000000
-- Valida ventanas de fecha/hora de tareas y evaluaciones.
--
-- Objetivo: impedir que se creen (o se cambien) fechas de apertura/inicio o
-- de cierre/límite en el pasado, y que el cierre sea anterior al inicio.
--
-- Detalle importante: solo se validan los valores NUEVOS o MODIFICADOS. Las
-- filas que ya existen con fechas pasadas no se tocan, y seguir siendo
-- editables en otros campos. Se tolera 1 minuto de desfase de reloj.
-- =============================================================================

create or replace function public.fn_validar_fechas_actividad()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
    v_inicio       timestamptz;
    v_fin          timestamptz;
    v_ini_anterior timestamptz;
    v_fin_anterior timestamptz;
begin
    if TG_TABLE_NAME = 'tarea' then
        v_inicio := NEW.fecha_apertura;
        v_fin := NEW.fecha_entrega;
        if TG_OP = 'UPDATE' then
            v_ini_anterior := OLD.fecha_apertura;
            v_fin_anterior := OLD.fecha_entrega;
        end if;
    else
        v_inicio := NEW.fecha_inicio;
        v_fin := NEW.fecha_limite_acceso;
        if TG_OP = 'UPDATE' then
            v_ini_anterior := OLD.fecha_inicio;
            v_fin_anterior := OLD.fecha_limite_acceso;
        end if;
    end if;

    if v_inicio is not null
       and v_inicio < now() - interval '1 minute'
       and (TG_OP = 'INSERT' or v_inicio is distinct from v_ini_anterior) then
        raise exception 'La fecha de apertura/inicio no puede ser anterior a la hora actual'
            using errcode = '23514';
    end if;

    if v_fin is not null
       and v_fin < now() - interval '1 minute'
       and (TG_OP = 'INSERT' or v_fin is distinct from v_fin_anterior) then
        raise exception 'La fecha de cierre/límite no puede ser anterior a la hora actual'
            using errcode = '23514';
    end if;

    if v_inicio is not null and v_fin is not null and v_fin <= v_inicio then
        raise exception 'La fecha de cierre/límite debe ser posterior a la de apertura/inicio'
            using errcode = '23514';
    end if;

    return NEW;
end;
$$;

comment on function public.fn_validar_fechas_actividad() is
    'Rechaza fechas pasadas o ventanas invertidas en tareas y evaluaciones (solo valores nuevos/cambiados).';

drop trigger if exists trg_validar_fechas_tarea on public.tarea;
create trigger trg_validar_fechas_tarea
    before insert or update of fecha_apertura, fecha_entrega on public.tarea
    for each row execute function public.fn_validar_fechas_actividad();

drop trigger if exists trg_validar_fechas_evaluacion on public.evaluacion;
create trigger trg_validar_fechas_evaluacion
    before insert or update of fecha_inicio, fecha_limite_acceso on public.evaluacion
    for each row execute function public.fn_validar_fechas_actividad();
