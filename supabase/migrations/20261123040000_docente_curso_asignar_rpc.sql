-- =============================================================================
-- Asignacion de docente a curso como RPC segura e idempotente.
-- -----------------------------------------------------------------------------
-- El panel admin hacia SELECT + INSERT directos sobre docente_curso. Cualquier
-- particularidad de RLS, un duplicado entre la busqueda y el insert, o un
-- cambio de permisos podia dejar un error generico. Esta funcion centraliza la
-- operacion con SECURITY DEFINER y upsert sobre la clave unica real.
-- =============================================================================

begin;

create or replace function public.asignar_docente_curso(
    p_curso_id        uuid,
    p_docente_id      uuid,
    p_es_responsable  boolean default false,
    p_asignado_por    uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_admin   uuid := public.efectivo_user_id();
    v_id      uuid;
    v_existe  boolean;
begin
    if v_admin is null or not public.app_is_admin() then
        raise exception 'Solo un administrador puede asignar docentes a cursos.'
            using errcode = '42501';
    end if;

    select exists(select 1 from public.curso where id = p_curso_id) into v_existe;
    if not v_existe then
        raise exception 'El curso indicado no existe.' using errcode = '22023';
    end if;

    select exists(
        select 1 from public.perfil
         where id = p_docente_id
           and rol = 'docente'::public.rol_usuario
    ) into v_existe;
    if not v_existe then
        raise exception 'El docente indicado no existe o no tiene rol de docente.' using errcode = '22023';
    end if;

    -- Solo puede haber un responsable activo por curso (indice parcial
    -- uq_docente_curso_responsable). Si se marca este docente como responsable,
    -- se le transfiere el rol al desmarcar al anterior en la misma transaccion.
    if coalesce(p_es_responsable, false) then
        update public.docente_curso
           set es_responsable = false
         where curso_id = p_curso_id
           and docente_id <> p_docente_id
           and es_responsable
           and activo;
    end if;

    insert into public.docente_curso
        (curso_id, docente_id, es_responsable, activo, asignado_por, asignado_en)
    values
        (p_curso_id, p_docente_id, coalesce(p_es_responsable, false), true,
         coalesce(p_asignado_por, v_admin), now())
    on conflict (curso_id, docente_id) do update
        set es_responsable = coalesce(p_es_responsable, false),
            activo = true,
            asignado_por = coalesce(p_asignado_por, v_admin),
            asignado_en = now()
    returning id into v_id;

    return jsonb_build_object('ok', true, 'id', v_id,
                              'mensaje', 'Docente asignado al curso correctamente.');
end;
$$;

-- Actualizar activo / responsable de una asignacion existente con la misma
-- garantia de unicidad de responsable.
create or replace function public.actualizar_asignacion_docente_curso(
    p_asignacion_id  uuid,
    p_activo         boolean,
    p_es_responsable boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_admin    uuid := public.efectivo_user_id();
    v_curso    uuid;
    v_docente  uuid;
    v_actual   public.docente_curso%rowtype;
begin
    if v_admin is null or not public.app_is_admin() then
        raise exception 'Solo un administrador puede gestionar asignaciones.'
            using errcode = '42501';
    end if;

    select * into v_actual
      from public.docente_curso
     where id = p_asignacion_id
       for update;
    if not found then
        raise exception 'Asignación no encontrada.' using errcode = 'P0002';
    end if;
    v_curso := v_actual.curso_id;
    v_docente := v_actual.docente_id;

    if p_es_responsable and p_activo then
        update public.docente_curso
           set es_responsable = false
         where curso_id = v_curso
           and docente_id <> v_docente
           and es_responsable
           and activo;
    end if;

    update public.docente_curso
       set activo = coalesce(p_activo, v_actual.activo),
           es_responsable = coalesce(p_es_responsable, false)
     where id = p_asignacion_id;

    return jsonb_build_object('ok', true, 'id', p_asignacion_id,
                              'mensaje', 'Asignación actualizada correctamente.');
end;
$$;

revoke all on function public.asignar_docente_curso(uuid, uuid, boolean, uuid) from public, anon;
grant execute on function public.asignar_docente_curso(uuid, uuid, boolean, uuid) to authenticated;
revoke all on function public.actualizar_asignacion_docente_curso(uuid, boolean, boolean) from public, anon;
grant execute on function public.actualizar_asignacion_docente_curso(uuid, boolean, boolean) to authenticated;

commit;
