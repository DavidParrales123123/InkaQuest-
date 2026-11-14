-- RPC funcional para listar los miembros del curso de chat sin depender de RLS
-- del frame clientes. Una vez el frontend tenga este RPC podríamos hasta
-- endurecer RLS sin romper nada.
--
-- Seguridad: SECURITY DEFINER, pero exige credenciales densas:
--   * caller = efectivo_user_id()
--   * caller debe ser admin o estudiante matriculado (activa/completada) o
--     docente activo del curso
--   * solo devuelve: id, nombre, apellido, email, avatar_url, rol
--   * orden: docente primero; luego por apellido/nombre

create or replace function public.chat_miembros_curso(p_curso_id uuid)
returns table (
    id uuid,
    nombre text,
    apellido text,
    email text,
    avatar_url text,
    rol text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_caller uuid := public.efectivo_user_id();
begin
    if v_caller is null then
        raise exception 'Autenticación requerida.' using errcode = '42501';
    end if;

    if not (
        -- admin
        public.app_is_admin()
        -- estudiante matriculado en este curso
        or exists (
            select 1 from public.matricula m
            where m.curso_id = p_curso_id
              and m.estudiante_id = v_caller
              and m.estado in ('activa', 'completada')
        )
        -- docente activo asignado a este curso
        or exists (
            select 1 from public.docente_curso dc
            where dc.curso_id = p_curso_id
              and dc.docente_id = v_caller
              and dc.activo
        )
    ) then
        raise exception 'No tienes acceso a los miembros de este curso.' using errcode = '42501';
    end if;

    return query
    with miembros as (
        -- estudiantes matriculados (activa/completada)
        select m.estudiante_id as perfil_id, 'estudiante'::text as rol
          from public.matricula m
         where m.curso_id = p_curso_id
           and m.estado in ('activa', 'completada')
        union
        -- docentes activos asignados al curso
        select dc.docente_id, 'docente'::text
          from public.docente_curso dc
         where dc.curso_id = p_curso_id
           and dc.activo
    )
    select p.id, p.nombre, p.apellido, p.email, p.avatar_url,
           coalesce(m.rol, 'estudiante') as rol
      from miembros m
      join public.perfil p on p.id = m.perfil_id
     order by (case when m.rol = 'docente' then 0 else 1 end),
              coalesce(p.apellido, p.nombre, ''),
              coalesce(p.nombre, ''),
              p.email;
end;
$$;

revoke all on function public.chat_miembros_curso(uuid) from public, anon;
grant execute on function public.chat_miembros_curso(uuid) to authenticated;

comment on function public.chat_miembros_curso(uuid) is
    'Lista los miembros de un curso (estudiantes activos + docentes activos), respetando que el llamante sea miembro del curso. SECURITY DEFINER.';
