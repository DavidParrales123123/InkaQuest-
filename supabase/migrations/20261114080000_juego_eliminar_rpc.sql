-- RPC para que un docente elimine un minijuego que creó (o admin).
--
-- Contexto. La RLS actual de public.juego exige app_is_admin() para DELETE
-- (pol_juego_write), así que un docente que borraba desde la UI no obtenía
-- ningún error: simplemente PostgREST devolvía 0 filas afectadas y la lista
-- seguía mostrando el juego. El diseño correcto aquí es una RPC SECURITY
-- DEFINER que:
--   1) solo permite eliminar si el usuario es quien creó el juego, o es admin;
--   2) confía en las ON DELETE CASCADE del esquema (actividad_juego,
--      configuracion_juego, puntuacion_juego, intento_juego, etc.);
--   3) registra la acción en registro_accion (auditoría inmutable).

create or replace function public.juego_eliminar(p_juego_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_caller uuid := public.efectivo_user_id();
    v_juego  public.juego%rowtype;
    v_nombre text;
begin
    if v_caller is null then
        raise exception 'Autenticación requerida.' using errcode = '42501';
    end if;

    select * into v_juego
      from public.juego
     where id = p_juego_id
     for update;
    if not found then
        raise exception 'El juego no existe.' using errcode = '22023';
    end if;

    -- Solo el creador o un admin pueden eliminar.
    if v_juego.creado_por is distinct from v_caller and not public.app_is_admin() then
        raise exception 'Solo el docente que creó este juego (o un administrador) puede eliminarlo.'
            using errcode = '42501';
    end if;

    v_nombre := v_juego.nombre;

    delete from public.juego where id = p_juego_id;

    insert into public.registro_accion
        (codigo_evento, actor_id, entidad_tipo, entidad_id, accion,
         valor_nuevo, exito, correlation_id)
    values
        ('juego_eliminado_docente', v_caller, 'juego', p_juego_id, 'eliminar',
         jsonb_build_object('nombre', v_nombre),
         true, gen_random_uuid());

    return jsonb_build_object('ok', true, 'juego_id', p_juego_id, 'nombre', v_nombre);
end;
$$;

revoke all on function public.juego_eliminar(uuid) from public, anon;
grant execute on function public.juego_eliminar(uuid) to authenticated;

comment on function public.juego_eliminar(uuid) is
    'Elimina un juego creado por el llamante docente (o un admin). Confía en ON DELETE CASCADE del esquema. Auditoría en registro_accion.';
