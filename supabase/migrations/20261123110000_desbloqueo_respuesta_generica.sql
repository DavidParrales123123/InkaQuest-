-- No revelar si un correo está registrado: si no se encuentra la cuenta,
-- se devuelve el mismo mensaje de éxito sin insertar ticket.

begin;

create or replace function public.solicitar_desbloqueo(
    p_motivo text,
    p_email  text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_uid    uuid;
    v_email  text;
    v_ticket uuid;
    v_reciente integer := 0;
    v_generico jsonb := jsonb_build_object('ok', true,
        'mensaje', 'Si la cuenta existe, el administrador revisará tu solicitud y te contactará.');
begin
    v_uid := nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid;

    if v_uid is not null then
        select email into v_email from public.perfil where id = v_uid;
    end if;
    if v_email is null and p_email is not null then
        v_email := lower(btrim(p_email));
        select id into v_uid from public.perfil where lower(email) = v_email;
    end if;

    if p_motivo is null or length(btrim(p_motivo)) < 10 then
        raise exception 'Explica el motivo con al menos 10 caracteres.'
            using errcode = '22023';
    end if;
    if length(btrim(p_motivo)) > 4000 then
        raise exception 'El motivo no puede superar 4000 caracteres.'
            using errcode = '22023';
    end if;

    if v_uid is null or v_email is null then
        return v_generico;
    end if;

    select count(*) into v_reciente
      from public.ticket
     where usuario_id = v_uid
       and categoria = 'desbloqueo'
       and estado in ('abierto', 'en_progreso', 'esperando_usuario')
       and creado_en > now() - interval '24 hours';
    if v_reciente > 0 then
        return jsonb_build_object('ok', true,
            'mensaje', 'Ya registramos tu solicitud. El administrador la revisará pronto.');
    end if;

    insert into public.ticket
        (usuario_id, asunto, descripcion, categoria, prioridad, estado, creado_en, actualizado_en)
    values
        (v_uid,
         'Solicitud de desbloqueo de cuenta · ' || v_email,
         btrim(p_motivo),
         'desbloqueo', 'alta'::public.prioridad_ticket, 'abierto'::public.estado_ticket,
         now(), now())
    returning id into v_ticket;

    return jsonb_build_object('ok', true, 'ticket_id', v_ticket,
        'mensaje', 'Solicitud enviada. El administrador la revisará y te contactará.');
end;
$$;

revoke all on function public.solicitar_desbloqueo(text, text) from public;
grant execute on function public.solicitar_desbloqueo(text, text) to anon, authenticated;

commit;
