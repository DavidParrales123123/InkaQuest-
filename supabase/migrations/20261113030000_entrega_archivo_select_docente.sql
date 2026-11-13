-- El docente del curso también puede LEER los registros de archivos de las entregas
-- de sus tareas (antes: solo el autor o un admin). Necesario para que el docente
-- vea y descargue los archivos del estudiante en la bandeja de calificación.
--
-- La escritura (insert/update/delete) del estudiante no cambia: sigue siendo el
-- autor o un admin.

drop policy if exists pol_entrega_archivo_all on public.entrega_archivo;

-- SELECT: autor, admin o docente del curso de la tarea.
create policy pol_entrega_archivo_select on public.entrega_archivo
    for select to authenticated
    using (
        exists (
            select 1
              from public.entrega e
              join public.tarea t on t.id = e.tarea_id
              join public.actividad a on a.id = t.actividad_id
             where e.id = entrega_archivo.entrega_id
               and (
                   e.estudiante_id = public.efectivo_user_id()
                   or public.app_is_admin()
                   or public.app_es_docente_del_curso(a.curso_id)
               )
        )
    );

-- INSERT: solo el autor del archivo o un admin.
create policy pol_entrega_archivo_insert on public.entrega_archivo
    for insert to authenticated
    with check (
        exists (
            select 1
              from public.entrega e
             where e.id = entrega_archivo.entrega_id
               and (e.estudiante_id = public.efectivo_user_id() or public.app_is_admin())
        )
    );

-- UPDATE: solo el autor del archivo o un admin.
create policy pol_entrega_archivo_update on public.entrega_archivo
    for update to authenticated
    using (
        exists (
            select 1
              from public.entrega e
             where e.id = entrega_archivo.entrega_id
               and (e.estudiante_id = public.efectivo_user_id() or public.app_is_admin())
        )
    )
    with check (
        exists (
            select 1
              from public.entrega e
             where e.id = entrega_archivo.entrega_id
               and (e.estudiante_id = public.efectivo_user_id() or public.app_is_admin())
        )
    );

-- DELETE: solo el autor del archivo o un admin.
create policy pol_entrega_archivo_delete on public.entrega_archivo
    for delete to authenticated
    using (
        exists (
            select 1
              from public.entrega e
             where e.id = entrega_archivo.entrega_id
               and (e.estudiante_id = public.efectivo_user_id() or public.app_is_admin())
        )
    );

grant select, insert, update, delete on public.entrega_archivo to authenticated;
