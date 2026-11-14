-- Bucket privado para adjuntos de chat (imágenes y archivos).
-- Diseño: ruta = <sender_id>/<uuid>-<nombre>; caratula privada, 25 MB, mime mixto.
-- Acceso de lectura via signed URL generadas por cada vista (1 h de vigencia).

begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
    ('chat', 'chat', false, 26214400::bigint,
     array['image/png','image/jpeg','image/webp','image/gif',
           'application/pdf','text/plain','application/zip',
           'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
           'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
           'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation',
           'video/mp4','audio/mpeg','audio/mp4']::text[])
on conflict (id) do nothing;

-- Solo el propietario de la carpeta puede subir (usuario efectivo).
drop policy if exists pol_chat_insert on storage.objects;
create policy pol_chat_insert on storage.objects
    for insert to authenticated
    with check (bucket_id = 'chat' and (storage.foldername(name))[1] = public.efectivo_user_id()::text);

-- Cualquier autenticado puede leer: las rutas son aleatorias (uuid) y solo las
-- conocen los participantes del chat; quien las posee puede listarlas si las ve.
drop policy if exists pol_chat_select on storage.objects;
create policy pol_chat_select on storage.objects
    for select to authenticated
    using (bucket_id = 'chat');

-- Solo el propietario puede borrar sus propios adjuntos (no borrar el del otro).
drop policy if exists pol_chat_delete on storage.objects;
create policy pol_chat_delete on storage.objects
    for delete to authenticated
    using (bucket_id = 'chat' and (storage.foldername(name))[1] = public.efectivo_user_id()::text);

commit;
