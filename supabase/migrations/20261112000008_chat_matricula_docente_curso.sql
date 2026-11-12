-- =============================================================================
-- InkaQuest - Migración 20261112000008
-- Visibilidad de matrícula y del docente del curso para estudiantes matriculados.
--
-- Sin estos permisos, un estudiante NO puede enumerar a quién tiene en su aula
-- ni quién lo dicta, e impide que el chat 1:1 funcione como debe funcionar.
-- =============================================================================

-- A student enrolled in a course can see the other rows of matricula of THAT same course.
-- (Required for the chat member list and any future course-detail screen that shows peers.)
drop policy if exists pol_matricula_select on public.matricula;
create policy pol_matricula_select on public.matricula
    for select to authenticated
    using (
        estudiante_id = public.efectivo_user_id()
        or public.app_is_admin()
        or public.app_es_docente_del_curso(curso_id)
        or exists (
            select 1
              from public.matricula m
              where m.curso_id = matricula.curso_id
                and m.estudiante_id = public.efectivo_user_id()
                and m.estado in ('activa', 'completada')
                and matricula.estado in ('activa', 'completada')
        )
    );

-- A student can see which docentes teach the courses where they are enrolled.
-- (Required so the tutor docente appears in the 1:1 chat picker.)
drop policy if exists pol_docente_curso_select on public.docente_curso;
create policy pol_docente_curso_select on public.docente_curso
    for select to authenticated
    using (
        docente_id = public.efectivo_user_id()
        or public.app_is_admin()
        or public.app_es_docente_del_curso(curso_id)
        or exists (
            select 1
              from public.matricula m
              where m.curso_id = docente_curso.curso_id
                and m.estudiante_id = public.efectivo_user_id()
                and m.estado in ('activa', 'completada')
        )
    );
