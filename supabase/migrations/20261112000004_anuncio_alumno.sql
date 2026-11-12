-- =============================================================================
-- InkaQuest - Migración 20261112000004
-- Avisos para estudiantes:
--   1) Los estudiantes matriculados en un curso pueden leer los anuncios
--      estrictamente en estado PUBLICADO de ese curso.
--   2) Al publicarse un anuncio (INSERT con estado publicado, o UPDATE de
--      borrador → publicado) un trigger security-definer inserta una
--      notificación por cada estudiante matriculado del curso, para que la
--      campana del panel del alumno refleje el aviso.
-- =============================================================================

-- Lectura para estudiantes del curso (solo lo publicado).
drop policy if exists pol_anuncio_select on public.anuncio;
create policy pol_anuncio_select on public.anuncio
    for select to authenticated
    using (
        public.app_es_docente_del_curso(curso_id)
        or public.app_is_admin()
        or exists (
            select 1
            from public.matricula m
            where m.estudiante_id = public.efectivo_user_id()
              and m.curso_id = anuncio.curso_id
              and m.estado in ('activa', 'completada')
        )
    );

-- Función: envía una notificación por cada estudiante matriculado del curso.
create or replace function public.fn_anuncio_notificar_estudiantes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    -- Solo cuando el anuncio queda (o ya era) PUBLICADO.
    if new.estado <> 'publicado' then
        return new;
    end if;
    -- En un UPDATE (de borrador a publicado), no repetir si ya se notificó.
    if tg_op = 'UPDATE' and old.estado = 'publicado' then
        return new;
    end if;

    -- Una notificación por alumno, con clave de idempotencia para no
    -- duplicar aunque el trigger se dispare más de una vez.
    insert into public.notificacion (
        titulo, mensaje, canal, destinatario_id,
        entidad_tipo, entidad_id, creado_por, clave_idempotencia
    )
    select
        new.titulo,
        new.contenido,
        'in_app',
        m.estudiante_id,
        'anuncio',
        new.id,
        new.docente_id,
        'anuncio:' || new.id::text || ':' || m.estudiante_id::text
    from public.matricula m
    where m.curso_id = new.curso_id
      and m.estado in ('activa', 'completada')
    on conflict (clave_idempotencia) do nothing;

    -- Filas por destinatario (para el contador de no leídas y la campana).
    insert into public.notificacion_destinatario (notificacion_id, usuario_id, canal, estado, enviada_en)
    select n.id, n.destinatario_id, 'in_app', 'enviada', now()
    from public.notificacion n
    where n.entidad_tipo = 'anuncio'
      and n.entidad_id = new.id
    on conflict (notificacion_id, usuario_id, canal) do nothing;

    return new;
end;
$$;

comment on function public.fn_anuncio_notificar_estudiantes() is
    'Notifica a cada estudiante matriculado del curso al publicarse un anuncio.';

drop trigger if exists trg_anuncio_notificar_estudiantes on public.anuncio;
create trigger trg_anuncio_notificar_estudiantes
    after insert or update of estado on public.anuncio
    for each row execute function public.fn_anuncio_notificar_estudiantes();
