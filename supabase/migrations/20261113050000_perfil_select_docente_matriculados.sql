-- Perfil: el docente del curso también ve a los estudiantes matriculados en sus cursos,
-- aunque aún no hayan entregado ninguna tarea (antes solo se veían perfiles con entregas,
-- y las páginas del docente que listan estudiantes quedaban casi siempre vacías).

drop policy if exists pol_perfil_select on public.perfil;
create policy pol_perfil_select on public.perfil
    for select to authenticated
    using (
        id = public.efectivo_user_id()
        or public.app_is_admin()
        or exists (
            select 1
              from public.entrega e
              join public.tarea t on t.id = e.tarea_id
              join public.actividad a on a.id = t.actividad_id
             where e.estudiante_id = perfil.id
               and public.app_es_docente_del_curso(a.curso_id)
        )
        or exists (
            select 1
              from public.docente_curso dc
              join public.matricula m on m.curso_id = dc.curso_id
             where dc.docente_id = public.efectivo_user_id()
               and dc.activo
               and m.estudiante_id = perfil.id
        )
    );
