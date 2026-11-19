-- =============================================================================
-- Fix RLS: el docente DEL CURSO puede escribir la entrega (nota/estado) como exige "Calificar"
-- -----------------------------------------------------------------------------
-- BUG reportado: al calificar, Postgres devolvía
--   "new row violates row-level security policy for table entrega"
-- porque la WITH_CHECK de pol_entrega_write sólo admitía
--   estudiante_id = auth.uid() OR admin,
-- sin contener el EXISTS de docente-del-curso que sí existe en USING.
--
-- Solución senior: alineamos la WITH CHECK con USING:
--   · estudiante registra la suya (INSERT/UPDATE);
--   · docente ASIGNADO Y ACTIVO al curso del which proviene la tarea;
--   · admin siempre.
-- Sin ampliaciones de alcance: la misma regla que ya permitía SELECT/UPDATE ahora
-- permite el WITH CHECK de INSERT/UPDATE. La entrega jamás cambia de dueño.
-- =============================================================================

begin;

-- 1. Quitar la política bloqueante
drop policy if exists pol_entrega_write on public.entrega;

-- 2. Volver a crearla con check igualado al using (sin ampliar alcance)
create policy pol_entrega_write on public.entrega
    for all to authenticated
    using (
        estudiante_id = public.efectivo_user_id()
        or exists (
            select 1 from public.tarea t
            join public.actividad a on a.id = t.actividad_id
            where t.id = entrega.tarea_id
              and public.app_es_docente_del_curso(a.curso_id)
        )
        or public.app_is_admin()
    )
    with check (
        estudiante_id = public.efectivo_user_id()
        or exists (
            select 1 from public.tarea t
            join public.actividad a on a.id = t.actividad_id
            where t.id = entrega.tarea_id
              and public.app_es_docente_del_curso(a.curso_id)
        )
        or public.app_is_admin()
    );

-- 3. Guardia explícita: nadie puede reasignar el dueño de una entrega
--    (estudiante_id es inmutable una vez creada; la nota sí puede cambiar)
create or replace function public.fn_entrega_inmutable_estudiante()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    if tg_op = 'UPDATE' and old.estudiante_id is distinct from new.estudiante_id then
        raise exception 'No se puede cambiar el estudiante dueño de la entrega.';
    end if;
    return new;
end;
$$;

drop trigger if exists trg_entrega_inmutable_estudiante on public.entrega;
create trigger trg_entrega_inmutable_estudiante
    before update on public.entrega
    for each row execute function public.fn_entrega_inmutable_estudiante();

commit;
