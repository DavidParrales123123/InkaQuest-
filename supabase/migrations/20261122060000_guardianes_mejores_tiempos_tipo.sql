-- Correccion de guardianes_mejores_tiempos().
-- La funcion declara nivel_numero integer, pero guardianes_nivel.numero es
-- smallint. PostgreSQL exige coincidencia EXACTA de tipos en RETURNS TABLE,
-- por lo que la tabla del panel docente fallaba con:
--   "structure of query does not match function result type"
--   "Returned type smallint does not match expected type integer in column 1"
-- Se anade el cast explicito; el resto de la funcion se conserva igual.

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
    if v_caller is null then
        raise exception 'Autenticación requerida.' using errcode = '42501';
    end if;
    if not exists (select 1 from public.matricula m
                    where m.estudiante_id = v_caller and m.curso_id = v_curso
                      and m.estado in ('activa','completada'))
       and not exists (select 1 from public.docente_curso dc
                        where dc.docente_id = v_caller and dc.curso_id = v_curso and dc.activo = true)
       and not public.app_is_admin() then
        raise exception 'No estás autorizado para ver los mejores tiempos.' using errcode = '42501';
    end if;

    return query
      select distinct on (gn.numero)
             gn.numero::integer,
             p.nombre,
             p.apellido,
             i.tiempo_segundos,
             (p.id = v_caller)
        from public.guardianes_intento i
        join public.perfil p on p.id = i.estudiante_id
        join public.guardianes_nivel gn on gn.id = i.nivel_id
        join public.guardianes_campana gc on gc.id = gn.campana_id
        join public.guardianes_config gf on gf.id = gc.config_id
       where i.estado = 'completado'
         and v_curso = any (coalesce(gf.cursos_permitidos, '{}'::uuid[]))
       order by gn.numero, i.tiempo_segundos asc;
end;
$$;

revoke all on function public.guardianes_mejores_tiempos() from public, anon;
grant execute on function public.guardianes_mejores_tiempos() to authenticated;

commit;
