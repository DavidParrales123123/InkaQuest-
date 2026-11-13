-- El docente del curso también ve los módulos y contenidos de sus cursos en borrador o en revisión.
--
-- Contexto: `pol_unidad_select`, `pol_leccion_select` y `pol_recurso_select` ya permiten al
-- docente ver su propio material en borrador, pero `pol_modulo_select` y `pol_contenido_select`
-- restringían la lectura a cursos publicados (o admin). Eso rompía el editor del docente:
-- unidades y lecciones visibles pero sin módulos anidados (y contenidos invisibles), dejando la
-- experiencia "vacía" para el alumno cuando el curso aún no estaba publicado.

-- ---- MÓDULOS: lectura por docente del curso --------------------------------
drop policy if exists pol_modulo_select on public.modulo;
create policy pol_modulo_select on public.modulo
    for select to anon, authenticated
    using (
        exists (
            select 1 from public.unidad u
              join public.curso c on c.id = u.curso_id
             where u.id = modulo.unidad_id and c.estado = 'publicado'
        )
        or exists (
            select 1 from public.unidad u
             where u.id = modulo.unidad_id and public.app_es_docente_del_curso(u.curso_id)
        )
        or public.app_is_admin()
    );

-- ---- CONTENIDO: lectura por docente de la lección --------------------------
drop policy if exists pol_contenido_select on public.contenido;
create policy pol_contenido_select on public.contenido
    for select to anon, authenticated
    using (
        exists (
            select 1 from public.leccion l
              join public.modulo m on m.id = l.modulo_id
              join public.unidad u on u.id = m.unidad_id
              join public.curso c on c.id = u.curso_id
             where l.id = contenido.leccion_id
               and (c.estado = 'publicado' or public.app_is_admin())
        )
        or exists (
            select 1 from public.leccion l
              join public.modulo m on m.id = l.modulo_id
              join public.unidad u on u.id = m.unidad_id
             where l.id = contenido.leccion_id and public.app_es_docente_del_curso(u.curso_id)
        )
    );
