-- Envío de mensaje grupal de docente/administrador a TODOS sus estudiantes.
--
-- Contexto. El modelo actual de 'mensaje' es 1 a 1 (emisor_id ↔ destinatario_id).
-- Para que el docente pueda enviar UN mensaje que reciban TODOS sus alumnos, se
-- implementa fan-out desde una función SECURITY DEFINER que:
--   1) exige que el llamante sea docente activo asignado al curso o admin;
--   2) valida longitud del cuerpo (1–2000 caracteres, como el input del frontend);
--   3) inserta un mensaje por cada estudiante con matrícula activa/completada
--      en el curso (excluyendo al propio docente);
--   4) registra la acción en registro_accion (auditoría inmutable);
--   5) devuelve el número de destinatarios efectivos.
--
-- Ningún usuario añade mensajes en nombre de otro; solo desde aquí. El estudiante
-- recibe el mensaje como un chat normal desde el docente (en su lista aparece
-- como hilo aparte con su docente), por tanto no hay nada nuevo en la UI
-- que pueda permitirte clics equivocados.

create or replace function public.chat_enviar_grupo(
    p_curso_id uuid,
    p_cuerpo   text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_caller uuid := public.efectivo_user_id();
    v_count  integer := 0;
begin
    if v_caller is null then
        raise exception 'Autenticación requerida.' using errcode = '42501';
    end if;

    if not (
        public.app_is_admin()
        or exists (
            select 1 from public.docente_curso dc
            where dc.curso_id = p_curso_id
              and dc.docente_id = v_caller
              and dc.activo
        )
    ) then
        raise exception 'Solo el docente asignado a este curso o un administrador puede enviar mensajes al grupo.'
            using errcode = '42501';
    end if;

    if length(btrim(p_cuerpo)) < 1 then
        raise exception 'El mensaje no puede estar vacío.' using errcode = '22023';
    end if;
    if length(btrim(p_cuerpo)) > 2000 then
        raise exception 'El mensaje no puede superar 2000 caracteres.' using errcode = '22023';
    end if;

    with destinatarios as (
        select distinct m.estudiante_id
          from public.matricula m
         where m.curso_id = p_curso_id
           and m.estado in ('activa', 'completada')
           and m.estudiante_id <> v_caller
    ),
    ins as (
        insert into public.mensaje
            (emisor_id, destinatario_id, hilo_id, cuerpo, adjuntos, creado_en)
        select v_caller, d.estudiante_id, gen_random_uuid(), btrim(p_cuerpo), '[]'::jsonb, now()
          from destinatarios d
        returning 1
    )
    select count(*) into v_count from ins;

    insert into public.registro_accion
        (codigo_evento, actor_id, entidad_tipo, entidad_id, accion,
         valor_nuevo, exito, correlation_id, creado_en)
    values
        ('chat_grupo_docente', v_caller, 'curso', p_curso_id, 'crear',
         jsonb_build_object('destinatarios', v_count, 'cuerpo_len', length(btrim(p_cuerpo))),
         true, gen_random_uuid(), now());

    return v_count;
end;
$$;

revoke all on function public.chat_enviar_grupo(uuid, text) from public, anon;
grant execute on function public.chat_enviar_grupo(uuid, text) to authenticated;

comment on function public.chat_enviar_grupo(uuid, text) is
    'El docente asignado a un curso (o un administrador) envía un único mensaje al chat de TODOS los estudiantes matriculados activos. Fan-out por estudiante. Auditoría en registro_accion.';
