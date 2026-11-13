-- =============================================================================
-- InkaQuest — Romper recursión infinita en políticas RLS de certificados
-- =============================================================================
-- El esquema base creaba una evaluación cruzada:
--   pol_certificado_select           -> EXISTS(certificado_titular ...)
--   pol_certificado_titular_select   -> EXISTS(certificado ... certificado.id = ...)
-- Postgres detectaba recursión y devolvía HTTP 500 con
-- "infinite recursion detected in policy for relation certificado".
--
-- Esta migración rompe el ciclo sin perder la verificación pública de
-- certificados emitidos:
--   - certificado queda legible si está emitido, admin, o eres dueño del
--     certificado_titular correspondiente (SIN volver a consultar certificado_titular).
--   - certificado_titular queda legible por su dueño o admin (sin consultar certificado).
--   - La verificación de certificado por código/pública sigue funcionando
--     porque "estado = 'emitido'" es evaluable sin tocar certificado_titular.
-- =============================================================================

drop policy if exists pol_certificado_select on public.certificado;
create policy pol_certificado_select on public.certificado
    for select to anon, authenticated
    using (
        estado = 'emitido'
        or public.app_is_admin()
        or exists (
            select 1
            from public.certificado_titular ct
            where ct.certificado_id = certificado.id
              and ct.usuario_id = public.efectivo_user_id()
        )
    );

-- certificado_titular: solo dueño/admin, sin referencia a certificado (rompe ciclo).
drop policy if exists pol_certificado_titular_select on public.certificado_titular;
create policy pol_certificado_titular_select on public.certificado_titular
    for select to anon, authenticated
    using (
        usuario_id = public.efectivo_user_id()
        or public.app_is_admin()
    );

-- certificado_curso: sigue legible para todos (sin referencia a certificado).
drop policy if exists pol_certificado_curso_select on public.certificado_curso;
create policy pol_certificado_curso_select on public.certificado_curso
    for select to anon, authenticated
    using (true);
