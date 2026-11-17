-- =============================================================================
-- Calendario del estudiante: lectura de tareas de sus cursos
-- -----------------------------------------------------------------------------
-- BUG: 'tareas' solo es visible para docente/admin (pol_tarea_all). Los
-- estudiantes no reciben ninguna fila => el calendario del alumno carga sin
-- eventos, aunque el docente haya publicado fechas.
-- FIX: política SELECT adicional para estudiantes con matrícula activa/completada.
-- Solo lectura: no pueden crear, editar ni borrar tareas.
-- =============================================================================

begin;

drop policy if exists pol_tarea_select_estudiante on public.tarea;
create policy pol_tarea_select_estudiante on public.tarea
    for select to authenticated
    using (
        exists (
            select 1
              from public.actividad a
              join public.matricula m on m.curso_id = a.curso_id
             where a.id = tarea.actividad_id
               and m.estudiante_id = public.efectivo_user_id()
               and m.estado in ('activa', 'completada')
        )
    );

commit;
