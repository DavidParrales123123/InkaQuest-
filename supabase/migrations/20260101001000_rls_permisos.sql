-- =============================================================================
-- MIGRACION 0010 - Politicas RLS para permiso y rol_permiso
-- -----------------------------------------------------------------------------
-- Corrige un hueco detectado en la verificacion posterior a aplicar la
-- migracion 0007: las tablas 'permiso' y 'rol_permiso' tenian permisos
-- otorgados a 'anon' y 'authenticated' (incluso DELETE e INSERT), pero NO
-- tenian ninguna politica RLS.
--
-- Con FORCE ROW LEVEL SECURITY quedan inaccesibles en la practica, pero:
--   1. La configuracion es fragil: depende solo del permiso, no de la politica.
--   2. Los permisos son mas amplios de lo necesario.
--   3. La verificacion exige que toda tabla con RLS tenga politica.
--
-- Esta migracion deja la configuracion coherente y explicita:
--   - 'permiso' y 'rol_permiso' son de SOLO LECTURA para 'authenticated'.
--   - Se retiran los permisos de escritura que no correspondian.
--   - El admin puede gestionarlos (son parametros del RBAC).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Permisos: solo lectura para 'authenticated', nada para 'anon'
-- -----------------------------------------------------------------------------
revoke all on public.permiso from anon;
revoke all on public.rol_permiso from anon;

revoke insert, update, delete, truncate, references, trigger on public.permiso from authenticated;
revoke insert, update, delete, truncate, references, trigger on public.rol_permiso from authenticated;

grant select on public.permiso to authenticated;
grant select on public.rol_permiso to authenticated;

-- -----------------------------------------------------------------------------
-- 2. Politicas de solo lectura
--    El catalogo de permisos es publico dentro de la plataforma: cualquier
--    usuario autenticado puede conocer que permisos existen.
--    La escritura queda reservada al administrador.
-- -----------------------------------------------------------------------------
drop policy if exists pol_permiso_select on public.permiso;
create policy pol_permiso_select on public.permiso
    for select to authenticated
    using (true);

drop policy if exists pol_permiso_write on public.permiso;
create policy pol_permiso_write on public.permiso
    for all to authenticated
    using (public.app_is_admin())
    with check (public.app_is_admin());

drop policy if exists pol_rol_permiso_select on public.rol_permiso;
create policy pol_rol_permiso_select on public.rol_permiso
    for select to authenticated
    using (true);

drop policy if exists pol_rol_permiso_write on public.rol_permiso;
create policy pol_rol_permiso_write on public.rol_permiso
    for all to authenticated
    using (public.app_is_admin())
    with check (public.app_is_admin());

-- =============================================================================
-- FIN DE LA MIGRACION 0010
-- =============================================================================
