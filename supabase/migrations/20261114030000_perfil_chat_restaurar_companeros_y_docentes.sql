-- =============================================================================
-- InkaQuest - Migración 20261114030000
-- Restaura la visibilidad mínima de perfiles que necesita el chat 1:1.
--
-- Contexto. 20261113050000_perfil_select_docente_matriculados.sql recreó pol_perfil_select
-- conservando solo estas ramas: propio, admin, docente↔quien le entregó y
-- docente↔matriculados de su curso. Se perdieron dos ramas que sí estaban en
-- 20261112000002_perfil_chat.sql y que el chat necesita:
--
--   A) Compañeros del mismo curso activo (estudiantes entre sí).
--   B) Estudiantes ven a los docentes de sus cursos (para escribirles).
--
-- Sin (A), un estudiante ve a cero compañeros → no los puede abrir en el
-- chat. Sin (B), no ve a su docente → no le puede escribir. La lista de
-- miembros del panel lateral queda siempre vacía.
--
-- Se restaura exactamente lo que había, sin ampliar nada más:
--   A) m1/m2 ambos en cursos activos/completados del propio usuario.
--   B) el docente está asignado (docente_curso.activo) a un curso donde el
--      usuario está matriculado activo/completado.
-- =============================================================================

drop policy if exists pol_perfil_select on public.perfil;

create policy pol_perfil_select on public.perfil
    for select to authenticated
    using (
        id = public.efectivo_user_id()
        or public.app_is_admin()
        -- El docente ve los perfiles de quienes le entregaron tareas.
        or exists (
            select 1
              from public.entrega e
              join public.tarea t on t.id = e.tarea_id
              join public.actividad a on a.id = t.actividad_id
             where e.estudiante_id = perfil.id
               and public.app_es_docente_del_curso(a.curso_id)
        )
        -- El docente ve a los matriculados en sus cursos.
        or exists (
            select 1
              from public.docente_curso dc
              join public.matricula m on m.curso_id = dc.curso_id
             where dc.docente_id = public.efectivo_user_id()
               and dc.activo
               and m.estudiante_id = perfil.id
        )
        -- A) Compañeros del mismo curso (activo o completado).
        or exists (
            select 1
              from public.matricula m1
              join public.matricula m2 on m2.curso_id = m1.curso_id
             where m1.estudiante_id = public.efectivo_user_id()
               and m2.estudiante_id = perfil.id
               and m1.estado in ('activa', 'completada')
               and m2.estado in ('activa', 'completada')
        )
        -- B) Estudiante ve a los docentes de sus cursos.
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
