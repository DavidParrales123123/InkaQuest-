-- El bucket 'recursos' no aceptaba video ni imágenes modernas
-- (mp4/gif/webp) por lo que los docentes no podían subir video-lecciones
-- ni GIFs de ejemplo aunque la UI lo permitía.

update storage.buckets
   set allowed_mime_types = array[
       'application/pdf','application/zip','text/plain','image/png','image/jpeg','image/webp','image/gif','image/svg+xml','application/json',
       'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
       'application/vnd.ms-excel','text/csv','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
       'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation',
       'application/octet-stream',
       'video/mp4','video/webm','video/quicktime'
   ]
 where id = 'recursos';
