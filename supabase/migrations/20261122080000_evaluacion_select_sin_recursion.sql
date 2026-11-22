-- Correccion: "infinite recursion detected in policy for relation evaluacion".
--
-- La migracion 20261122050000 anadio a pol_evaluacion_select una rama:
--   EXISTS (SELECT 1 FROM intento_evaluacion ie WHERE ie.evaluacion_id = evaluacion.id ...)
-- Pero pol_intento_evaluacion_select vuelve a consultar evaluacion:
--   EXISTS (SELECT 1 FROM evaluacion e JOIN actividad a ...)
-- -> ciclo: evaluacion -> intento_evaluacion -> evaluacion -> ...
--
-- Esa rama no era necesaria: la política NO filtra por fecha (la ventana se
-- controla en el trigger y en el backend), asi que los estudiantes con un
-- intento ya pueden ver la evaluacion por la rama de 'publicado'. Se elimina
-- restaurando la politica original, que no tenia recursion.

begin;

drop policy if exists pol_evaluacion_select on public.evaluacion;
create policy pol_evaluacion_select on public.evaluacion
    for select to authenticated
    using (
        exists (
            select 1 from public.actividad a
             where a.id = evaluacion.actividad_id
               and (
                    public.app_es_docente_del_curso(a.curso_id)
                    or public.app_is_admin()
                    or a.publicado = true
               )
        )
    );

commit;
