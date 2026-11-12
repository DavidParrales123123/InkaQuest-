-- =============================================================================
-- InkaQuest - Migración 20261112000010
-- Visibilidad de perfiles corregida: el docente debe ver a los estudiantes de
-- su curso aunque aún no tengan entregas.
--
-- El bug: la policy/original exigía una entrega antes de que el docente pudiera
-- ver el perfil de un alumno (vía join entrega→tarea→actividad). Si ningún
-- alumno ha enviado nada, el docente no ve a nadie — y en el chat el docente
-- ve la lista vacía hasta que se hagan las entregas.
-- =============================================================================

drop policy if exists pol_perfil_select on public.perfil;
create policy pol_perfil_select on public.perfil
    for select to authenticated
    using (
        id = public.efectivo_user_id()
        or public.app_is_admin()
        -- Docente del curso ve a sus estudiantes matriculados (con o sin entregas).
        or exists (
            select 1
              from public.matricula m
             where m.estudiante_id = perfil.id
               and m.estado in ('activa', 'completada')
               and public.app_es_docente_del_curso(m.curso_id)
        )
        -- Compañeros del mismo curso (chat alumno–alumno).
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
