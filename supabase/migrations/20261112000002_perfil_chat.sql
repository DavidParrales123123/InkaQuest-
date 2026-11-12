-- =============================================================================
-- InkaQuest - Migración 20261112000002
-- Visibilidad de perfiles para el chat 1:1.
--
-- Reglas:
--   * Un estudiante puede ver el perfil de sus compañeros de los mismos cursos.
--   * Un estudiante puede ver el perfil de los docentes de sus cursos (para poder
--     escribirles con nombre).
--   * Nadie fuera de esto ve perfiles ajenos (el docente nunca necesita ver
--     datos de estudiantes fuera de sus cursos).
-- =============================================================================

drop policy if exists pol_perfil_select on public.perfil;
create policy pol_perfil_select on public.perfil
    for select to authenticated
    using (
        id = public.efectivo_user_id()
        or public.app_is_admin()
        -- El docente ve los perfiles de los estudiantes de sus cursos.
        or exists (
            select 1
            from public.entrega e
            join public.tarea t on t.id = e.tarea_id
            join public.actividad a on a.id = t.actividad_id
            where e.estudiante_id = perfil.id
              and public.app_es_docente_del_curso(a.curso_id)
        )
        -- Compañeros del mismo curso: necesarios para el chat entre alumnos.
        or exists (
            select 1
            from public.matricula m1
            join public.matricula m2 on m2.curso_id = m1.curso_id
            where m1.estudiante_id = public.efectivo_user_id()
              and m2.estudiante_id = perfil.id
              and m1.estado in ('activa', 'completada')
              and m2.estado in ('activa', 'completada')
        )
        -- Estudiantes ven a los docentes de sus cursos (para escribirles).
        or exists (
            select 1
            from public.matricula m
            join public.docente_curso dc on dc.curso_id = m.curso_id
            where m.estudiante_id = public.efectivo_user_id()
              and dc.docente_id = perfil.id
              and dc.activo
              and m.estado in ('activa', 'completada')
        )
    );
