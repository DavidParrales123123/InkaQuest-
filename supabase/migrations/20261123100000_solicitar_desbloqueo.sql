-- Solicitud de desbloqueo de cuenta para usuarios suspendidos.
-- Se registra como ticket de categoria 'desbloqueo' para que el admin lo vea
-- en su panel de soporte existente. SECURITY DEFINER: funciona aunque la RLS
-- bloquee al usuario suspendido. Acepta JWT (auth.uid) o correo como fallback.

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
    if length(btrim(p_motivo)) > 2000 then
        raise exception 'El motivo no puede superar 2000 caracteres.'
            using errcode = '22023';
    end if;
    if v_email is null then
        raise exception 'No se pudo identificar la cuenta. Indica el correo asociado.'
            using errcode = '22023';
    end if;
    if v_uid is null then
        raise exception 'No encontramos una cuenta con ese correo.'
            using errcode = '22023';
    end if;

    -- Anti-spam: una solicitud pendiente por usuario cada 24 horas.
    select count(*) into v_reciente
      from public.ticket
     where usuario_id = v_uid
       and categoria = 'desbloqueo'
       and estado in ('abierto', 'en_progreso', 'esperando_usuario')
       and creado_en > now() - interval '24 hours';
    if v_reciente > 0 then
        raise exception 'Ya tienes una solicitud de desbloqueo pendiente. El equipo la revisará pronto.'
            using errcode = '22023';
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
