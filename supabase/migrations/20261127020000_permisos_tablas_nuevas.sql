-- =============================================================================
-- InkaQuest - Migración 20261127020000
-- Completar privilegios del rol de aplicación sobre las tablas creadas
-- recientemente. No cambia políticas ni el modo de funcionamiento actual.
-- =============================================================================

begin;

grant usage on schema public to inkaquest_api;

grant select, insert, update, delete on public.foro,
    public.foro_tema, public.foro_respuesta, public.tarjeta_guardada
to inkaquest_api;

commit;
