-- =============================================================================
-- Fix: guardianes_mejores_tiempos — cast smallint -> integer para nivel_numero
-- -----------------------------------------------------------------------------
-- BUG: la consulta devuelve gn.numero (smallint) mientras la firma declara
-- nivel_numero integer. En funciones RETURNS TABLE PostgreSQL exige
-- asignabilidad de tipos, así que la RPC lanzaba 42804
-- "structure of query does not match function result type"
-- y la tabla de mejores tiempos no cargaba (ni el ranking mostrándola).
-- FIX: cast explícito gn.numero::integer (el resto de la función intacta).
-- =============================================================================

begin;

create or replace function public.guardianes_mejores_tiempos()
returns table (
    nivel_numero integer,
    nombre text,
    apellido text,
    tiempo_segundos bigint,
    es_yo boolean
)
language plpgsql stable
security definer
set search_path = ''
as $$
declare
    v_caller uuid := public.efectivo_user_id();
    v_curso  uuid := 'ab8e59ef-ab9f-40eb-8f31-790ac7edba4a';
begin
    if v_caller is null then raise exception 'Autenticación requerida.' using errcode = '42501'; end if;
    if not exists (select 1 from public.matricula m
                    where m.estudiante_id = v_caller and m.curso_id = v_curso
                      and m.estado in ('activa','completada'))
       and not exists (select 1 from public.docente_curso dc
                        where dc.docente_id = v_caller and dc.curso_id = v_curso and dc.activo = true)
       and not public.app_is_admin() then
        raise exception 'No estás autorizado para ver los mejores tiempos.' using errcode = '42501';
    end if;

    return query
      select distinct on (gn.numero) gn.numero::integer, p.nombre, p.apellido, i.tiempo_segundos, (p.id = v_caller) as es_yo
        from public.guardianes_intento i
        join public.perfil p on p.id = i.estudiante_id
        join public.guardianes_nivel gn on gn.id = i.nivel_id
       where i.estado = 'completado'
       order by gn.numero, i.tiempo_segundos asc;
end;
$$;

comment on function public.guardianes_mejores_tiempos() is
    'Mejor tiempo (mínimo) registrado con victoria por nivel, visible solo para el curso.';

revoke all on function public.guardianes_mejores_tiempos() from public, anon;
grant execute on function public.guardianes_mejores_tiempos() to authenticated;

commit;
