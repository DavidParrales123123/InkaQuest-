-- =============================================================================
-- InkaQuest - Migración 20261112000003
-- Habilita Realtime (INSERT) sobre public.mensaje para el chat en vivo.
-- =============================================================================

do $$
begin
    if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
        if not exists (
            select 1
            from pg_publication_tables
            where pubname = 'supabase_realtime'
              and schemaname = 'public'
              and tablename = 'mensaje'
        ) then
            alter publication supabase_realtime add table public.mensaje;
        end if;
    end if;
end $$;
