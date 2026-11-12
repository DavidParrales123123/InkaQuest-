-- =============================================================================
-- MIGRACION 0008 - Supabase Storage: buckets y politicas de acceso
-- -----------------------------------------------------------------------------
-- Depende de: 0001..0007
--
-- Se configuran los buckets de Storage con sus politicas propias. Los objetos
-- cuelgan de una ruta logica que incluye el UUID del propietario, de modo que
-- las politicas pueden filtrar por la primera carpeta de la ruta.
--
-- Buckets:
--   avatares        -> avatar de usuario            (publico)
--   portadas-curso  -> imagen de portada de curso  (publico)
--   recursos        -> material educativo           (requiere matricula)
--   entregas        -> entregas de tareas           (privado: autor o docente)
--   certificados    -> PDFs de certificado          (privado: titular o admin)
--   archivos        -> material autorizado general (privado)
--
-- Los archivos binarios NO se guardan en PostgreSQL: solo su ruta y metadatos.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Creacion de los buckets (idempotente)
-- -----------------------------------------------------------------------------
do $$
declare
    b record;
begin
    for b in
        select * from (values
            ('avatares',       'avatares',        true,  5242880::bigint,  array['image/png','image/jpeg','image/webp','image/gif']),
            ('portadas-curso', 'portadas-curso',  true,  5242880::bigint,  array['image/png','image/jpeg','image/webp','image/avif']),
            ('recursos',       'recursos',        false, 52428800::bigint, array['application/pdf','application/zip','text/plain','application/msword',
                                                                            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                                                                            'application/vnd.ms-excel','text/csv','application/json',
                                                                            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']),
            ('entregas',       'entregas',        false, 26214400::bigint, array['application/pdf','image/png','image/jpeg','text/plain','application/zip']),
            ('certificados',   'certificados',    false, 10485760::bigint, array['application/pdf']),
            ('archivos',       'archivos',        false, 52428800::bigint, array['application/pdf','application/zip','text/plain','image/png','image/jpeg'])
        ) as t(nombre, id, publico, tamano, mimes)
    loop
        insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        values (b.id, b.nombre, b.publico, b.tamano, b.mimes)
        on conflict (id) do update
            set file_size_limit = excluded.file_size_limit,
                allowed_mime_types = excluded.allowed_mime_types;
    end loop;
end $$;


-- -----------------------------------------------------------------------------
-- 2. Politicas de Storage
--    Se eliminan las anteriores para que la migracion sea reejecutable.
-- -----------------------------------------------------------------------------

-- ---- AVATARES (publico en lectura) -----------------------------------------
drop policy if exists "Avatar: lectura publica" on storage.objects;
create policy "Avatar: lectura publica" on storage.objects
    for select to anon, authenticated
    using (bucket_id = 'avatares');

drop policy if exists "Avatar: el usuario sube y borra el suyo" on storage.objects;
create policy "Avatar: el usuario sube y borra el suyo" on storage.objects
    for insert to authenticated
    with check (
        bucket_id = 'avatares'
        and (storage.foldername(name))[1] = public.efectivo_user_id()::text
    );

drop policy if exists "Avatar: el usuario actualiza y borra el suyo" on storage.objects;
create policy "Avatar: el usuario actualiza y borra el suyo" on storage.objects
    for update to authenticated
    using (
        bucket_id = 'avatares'
        and (storage.foldername(name))[1] = public.efectivo_user_id()::text
    );

drop policy if exists "Avatar: el usuario borra el suyo" on storage.objects;
create policy "Avatar: el usuario borra el suyo" on storage.objects
    for delete to authenticated
    using (
        bucket_id = 'avatares'
        and (storage.foldername(name))[1] = public.efectivo_user_id()::text
    );

-- ---- PORTADAS DE CURSO (publicas en lectura) -------------------------------
drop policy if exists "Portada: lectura publica" on storage.objects;
create policy "Portada: lectura publica" on storage.objects
    for select to anon, authenticated
    using (bucket_id = 'portadas-curso');

drop policy if exists "Portada: escritura por docente o admin" on storage.objects;
create policy "Portada: escritura por docente o admin" on storage.objects
    for insert to authenticated
    with check (bucket_id = 'portadas-curso' and (public.app_is_docente() or public.app_is_admin()));

drop policy if exists "Portada: actualizacion por docente o admin" on storage.objects;
create policy "Portada: actualizacion por docente o admin" on storage.objects
    for update to authenticated
    using (bucket_id = 'portadas-curso' and (public.app_is_docente() or public.app_is_admin()));

drop policy if exists "Portada: borrado por admin" on storage.objects;
create policy "Portada: borrado por admin" on storage.objects
    for delete to authenticated
    using (bucket_id = 'portadas-curso' and public.app_is_admin());

-- ---- RECURSOS EDUCATIVOS (requiere matricula) ------------------------------
-- Ruta esperada: recursos/<curso_id>/<nombre>
drop policy if exists "Recursos: lectura con matricula" on storage.objects;
create policy "Recursos: lectura con matricula" on storage.objects
    for select to authenticated
    using (
        bucket_id = 'recursos'
        and (
            public.app_is_admin()
            or public.app_esta_matriculado(((storage.foldername(name))[1])::uuid)
            or public.app_es_docente_del_curso(((storage.foldername(name))[1])::uuid)
        )
    );

drop policy if exists "Recursos: escritura por docente del curso" on storage.objects;
create policy "Recursos: escritura por docente del curso" on storage.objects
    for insert to authenticated
    with check (
        bucket_id = 'recursos'
        and (public.app_is_admin()
             or public.app_es_docente_del_curso(((storage.foldername(name))[1])::uuid))
    );

drop policy if exists "Recursos: actualizacion por docente del curso" on storage.objects;
create policy "Recursos: actualizacion por docente del curso" on storage.objects
    for update to authenticated
    using (
        bucket_id = 'recursos'
        and (public.app_is_admin()
             or public.app_es_docente_del_curso(((storage.foldername(name))[1])::uuid))
    );

drop policy if exists "Recursos: borrado por docente del curso" on storage.objects;
create policy "Recursos: borrado por docente del curso" on storage.objects
    for delete to authenticated
    using (
        bucket_id = 'recursos'
        and (public.app_is_admin()
             or public.app_es_docente_del_curso(((storage.foldername(name))[1])::uuid))
    );

-- ---- ENTREGAS (autor o docente del curso) ----------------------------------
-- Ruta esperada: entregas/<estudiante_id>/<entrega_id>/<archivo>
drop policy if exists "Entregas: el autor o su docente" on storage.objects;
create policy "Entregas: el autor o su docente" on storage.objects
    for select to authenticated
    using (
        bucket_id = 'entregas'
        and (
            public.app_is_admin()
            or (storage.foldername(name))[1] = public.efectivo_user_id()::text
            or exists (
                select 1
                  from public.entrega e
                  join public.tarea t on t.id = e.tarea_id
                  join public.actividad a on a.id = t.actividad_id
                 where e.estudiante_id::text = (storage.foldername(name))[1]
                   and public.app_es_docente_del_curso(a.curso_id)
            )
        )
    );

drop policy if exists "Entregas: el autor sube y borra" on storage.objects;
create policy "Entregas: el autor sube y borra" on storage.objects
    for insert to authenticated
    with check (
        bucket_id = 'entregas'
        and (storage.foldername(name))[1] = public.efectivo_user_id()::text
    );

drop policy if exists "Entregas: el autor actualiza" on storage.objects;
create policy "Entregas: el autor actualiza" on storage.objects
    for update to authenticated
    using (
        bucket_id = 'entregas'
        and (storage.foldername(name))[1] = public.efectivo_user_id()::text
    );

drop policy if exists "Entregas: el autor borra" on storage.objects;
create policy "Entregas: el autor borra" on storage.objects
    for delete to authenticated
    using (
        bucket_id = 'entregas'
        and (storage.foldername(name))[1] = public.efectivo_user_id()::text
    );

-- ---- CERTIFICADOS (titular o admin) ----------------------------------------
-- Ruta esperada: certificados/<usuario_id>/<codigo>.pdf
drop policy if exists "Certificados: titular o admin" on storage.objects;
create policy "Certificados: titular o admin" on storage.objects
    for select to authenticated
    using (
        bucket_id = 'certificados'
        and (
            public.app_is_admin()
            or (storage.foldername(name))[1] = public.efectivo_user_id()::text
        )
    );

drop policy if exists "Certificados: escritura por admin" on storage.objects;
create policy "Certificados: escritura por admin" on storage.objects
    for insert to authenticated
    with check (bucket_id = 'certificados' and public.app_is_admin());

drop policy if exists "Certificados: borrado por admin" on storage.objects;
create policy "Certificados: borrado por admin" on storage.objects
    for delete to authenticated
    using (bucket_id = 'certificados' and public.app_is_admin());

-- ---- ARCHIVOS AUTORIZADOS (privado) ----------------------------------------
-- Ruta esperada: archivos/<usuario_id>/<nombre>
drop policy if exists "Archivos: solo el propietario" on storage.objects;
create policy "Archivos: solo el propietario" on storage.objects
    for select to authenticated
    using (
        bucket_id = 'archivos'
        and (
            public.app_is_admin()
            or (storage.foldername(name))[1] = public.efectivo_user_id()::text
        )
    );

drop policy if exists "Archivos: el propietario escribe" on storage.objects;
create policy "Archivos: el propietario escribe" on storage.objects
    for insert to authenticated
    with check (
        bucket_id = 'archivos'
        and (storage.foldername(name))[1] = public.efectivo_user_id()::text
    );

drop policy if exists "Archivos: el propietario borra" on storage.objects;
create policy "Archivos: el propietario borra" on storage.objects
    for delete to authenticated
    using (
        bucket_id = 'archivos'
        and (storage.foldername(name))[1] = public.efectivo_user_id()::text
    );


-- =============================================================================
-- FIN DE LA MIGRACION 0008
-- =============================================================================
