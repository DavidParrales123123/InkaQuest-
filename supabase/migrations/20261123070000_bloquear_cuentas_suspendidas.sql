-- =============================================================================
-- Una cuenta suspendida NO debe tener acceso a la plataforma.
-- -----------------------------------------------------------------------------
-- Antes, estado_cuenta solo era decorativo: ninguna politica RLS ni filtro del
-- backend lo comprobaba, asi que un usuario suspendido con JWT vigente seguia
-- leyendo y escribiendo datos.
--
-- Capas:
--  1) app_cuenta_habilitada(): consulta SECURITY DEFINER que omite RLS.
--  2) efectivo_user_id() devuelve NULL si la cuenta no esta activa. Todas las
--     politicas RLS que lo usan (y app_is_admin, que depende de el) dejan de
--     autorizar a ese usuario de forma inmediata.
--  3) mi_estado_cuenta(): RPC que el frontend puede llamar aunque este
--     suspendido para saber por que se le cierra la sesion.
--  4) al suspender/activar se banea/desbanea al usuario en Supabase Auth para
--     que no pueda emitir nuevos tokens (defensa en profundidad).
-- =============================================================================

begin;

create or replace function public.app_cuenta_habilitada(p_usuario_id uuid)
returns boolean
language sql
security definer
set search_path = ''
set row_security = off
stable
as $$
    select exists (
        select 1 from public.perfil
         where id = p_usuario_id
           and estado_cuenta = 'activo'::public.estado_cuenta
    );
$$;

-- Solo el backend/systema debe poder ejecutarla directamente; efectivo_user_id
-- la usa internamente con SECURITY DEFINER.
revoke all on function public.app_cuenta_habilitada(uuid) from public, anon, authenticated;

create or replace function public.efectivo_user_id()
returns uuid
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
    v_uid uuid;
begin
    v_uid := coalesce(
        public.app_user_id(),
        nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid
    );
    if v_uid is null then
        return null;
    end if;
    if not public.app_cuenta_habilitada(v_uid) then
        return null;
    end if;
    return v_uid;
end;
$$;

-- RPC de lectura del propio estado: usa el JWT directamente (no efectivo_user_id)
-- para que un suspendido pueda enterarse de su situacion antes de cerrar sesion.
create or replace function public.mi_estado_cuenta()
returns text
language sql
security definer
set search_path = ''
set row_security = off
stable
as $$
    select coalesce((
        select estado_cuenta::text from public.perfil
         where id = nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid
    ), 'sin_perfil');
$$;

revoke all on function public.mi_estado_cuenta() from public, anon;
grant execute on function public.mi_estado_cuenta() to authenticated;

-- Suspender/banear en Auth al cambiar el estado.
create or replace function public.admin_cambiar_estado_cuenta(
    p_usuario_id uuid,
    p_estado     text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_admin    uuid := public.efectivo_user_id();
    v_anterior text;
begin
    if v_admin is null or not public.app_is_admin() then
        raise exception 'Solo un administrador puede cambiar el estado de una cuenta.'
            using errcode = '42501';
    end if;
    if p_usuario_id = v_admin then
        raise exception 'No puedes cambiar el estado de tu propia cuenta.'
            using errcode = '22023';
    end if;
    if p_estado not in ('activo', 'suspendido') then
        raise exception 'Solo se permite activar o suspender una cuenta.'
            using errcode = '22023';
    end if;

    select estado_cuenta::text into v_anterior
      from public.perfil where id = p_usuario_id;
    if not found then
        raise exception 'Usuario no encontrado.' using errcode = 'P0002';
    end if;

    perform public.fn_activar_escritura_sistema();
    update public.perfil
       set estado_cuenta = p_estado::public.estado_cuenta,
           actualizado_en = now()
     where id = p_usuario_id;
    perform public.fn_desactivar_escritura_sistema();

    -- Bloqueo en Supabase Auth: impide emitir nuevos tokens. El JWT ya
    -- emitido se neutraliza arriba via efectivo_user_id().
    begin
        if p_estado = 'suspendido' then
            update auth.users
               set banned_until = now() + interval '100 years'
             where id = p_usuario_id;
        else
            update auth.users
               set banned_until = null
             where id = p_usuario_id;
        end if;
    exception when others then
        raise notice 'No se pudo sincronizar el ban en auth.users: %', sqlerrm;
    end;

    insert into public.registro_accion
        (accion, entidad_tipo, entidad_id, actor_id, usuario_objetivo_id,
         valor_anterior, valor_nuevo, exito, creado_en)
    values
        ('actualizar', 'perfil', p_usuario_id, v_admin, p_usuario_id,
         jsonb_build_object('estado_cuenta', v_anterior),
         jsonb_build_object('estado_cuenta', p_estado),
         true, now());

    return jsonb_build_object(
        'ok', true,
        'mensaje', case when p_estado = 'activo'
            then 'Cuenta activada correctamente.'
            else 'Cuenta suspendida correctamente.' end);
end;
$$;

revoke all on function public.admin_cambiar_estado_cuenta(uuid, text) from public, anon;
grant execute on function public.admin_cambiar_estado_cuenta(uuid, text) to authenticated;

commit;
