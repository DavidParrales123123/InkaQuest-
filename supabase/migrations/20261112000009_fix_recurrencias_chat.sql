-- =============================================================================
-- InkaQuest - Migración 20261112000009
-- Corrección de recursión infinita en las policies de matricula/docente_curso.
--
-- El error: el policy de matricula hacía exists (select ... from matricula ...)
-- dentro de su propia expresión, lo que re-activa el policy indefinidamente.
-- Solución: leer los cursos matriculados del usuario con una función
-- SECURITY DEFINER (como hace app_esta_matriculado) para que el plan interno
-- no dispare de nuevo las policies de matricula.
-- =============================================================================

create or replace function public.fn_cursos_del_efectivo_user()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
    select curso_id
      from public.matricula
     where estudiante_id = public.efectivo_user_id()
       and estado in ('activa', 'completada');
$$;

comment on function public.fn_cursos_del_efectivo_user() is
    'Cursos donde el usuario efectivo está activo/completado. Bypasea RLS internamente (security definer).';

-- Reemplazar las policies dejando intactas las anteriores y añadiendo la rama de aula propia.
drop policy if exists pol_matricula_select on public.matricula;
create policy pol_matricula_select on public.matricula
    for select to authenticated
    using (
        estudiante_id = public.efectivo_user_id()
        or public.app_is_admin()
        or public.app_es_docente_del_curso(curso_id)
        or exists (
            select 1
              from public.fn_cursos_del_efectivo_user() as x
             where x = matricula.curso_id
               and matricula.estado in ('activa', 'completada')
        )
    );

drop policy if exists pol_docente_curso_select on public.docente_curso;
create policy pol_docente_curso_select on public.docente_curso
    for select to authenticated
    using (
        docente_id = public.efectivo_user_id()
        or public.app_is_admin()
        or public.app_es_docente_del_curso(curso_id)
        or exists (
            select 1
              from public.fn_cursos_del_efectivo_user() as x
             where x = docente_curso.curso_id
        )
    );
