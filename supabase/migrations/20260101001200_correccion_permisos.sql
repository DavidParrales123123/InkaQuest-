-- =============================================================================
-- MIGRACION 0012 - Correccion de la migracion 0011 (permisos residuales)
-- -----------------------------------------------------------------------------
-- Corrige dos huecos que quedaron tras aplicar la migracion 0011:
--
-- 1. 'anon' conservaba permisos de escritura (INSERT/UPDATE/DELETE) en tres
--    tablas del catalogo, porque no estaban en la lista de REVOKE de la 0011:
--       - categoria
--       - curso
--       - certificado
--
-- 2. 'authenticated' conservaba INSERT y DELETE sobre 'calificacion' y
--    DELETE sobre 'retroalimentacion', heredados de los default privileges
--    de Supabase. Una calificacion solo se CORRIGE (UPDATE) desde el cliente:
--    no se inserta ni se borra.
--
-- Ambas correcciones son idempotentes y no afectan a 'service_role', que
-- conserva el acceso total para el backend.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. 'anon' sin permisos de escritura sobre las tres tablas del catalogo
-- -----------------------------------------------------------------------------
revoke all on table public.categoria from anon;
revoke all on table public.curso from anon;
revoke all on table public.certificado from anon;

-- 'anon' conserva SOLO lectura sobre el catalogo publico.
grant select on
    public.categoria,
    public.curso,
    public.certificado
to anon;

-- -----------------------------------------------------------------------------
-- 2. Calificaciones: solo UPDATE desde el cliente
-- -----------------------------------------------------------------------------
revoke insert, delete, truncate, references, trigger on public.calificacion from authenticated;
grant update on public.calificacion to authenticated;

revoke delete on public.retroalimentacion from authenticated;

-- -----------------------------------------------------------------------------
-- 3. Verificacion
-- -----------------------------------------------------------------------------
do $$
declare
    v_count integer;
    v_list  text;
begin
    -- (a) 'anon' no debe tener permisos de escritura en el esquema public.
    select count(*), string_agg(distINCT c.relname, ', ')
      into v_count, v_list
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      join pg_attribute a on a.attrelid = c.oid
                         and a.attname = 'id' and a.attnum > 0 and not a.attisdropped
      join information_schema.role_table_grants g
        on g.table_name = c.relname
       and g.grantee = 'anon'
       and g.privilege_type in ('INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER')
     where n.nspname = 'public'
       and c.relkind = 'r';

    if v_count > 0 then
        raise notice 'FALLO: anon todavia puede escribir en: %', v_list;
    else
        raise notice 'OK: anon no tiene permisos de escritura en el esquema public.';
    end if;

    -- (b) 'authenticated' no debe poder INSERTAR ni BORRAR calificaciones.
    select count(*) into v_count
      from information_schema.role_table_grants
     where grantee = 'authenticated'
       and table_name = 'calificacion'
       and privilege_type in ('INSERT', 'DELETE');

    if v_count > 0 then
        raise notice 'FALLO: authenticated todavia puede insertar/borrar calificaciones.';
    else
        raise notice 'OK: las calificaciones solo se actualizan (UPDATE).';
    end if;
end $$;

-- =============================================================================
-- FIN DE LA MIGRACION 0012
-- =============================================================================
