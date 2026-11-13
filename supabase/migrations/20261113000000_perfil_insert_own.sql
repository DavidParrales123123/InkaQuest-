-- =============================================================================
-- InkaQuest — Insercion del propio perfil por el usuario autenticado
-- =============================================================================
-- Contexto: la aplicacion crea el perfil via backend (/usuarios/asegurar),
-- pero cuando el backend no esta disponible (p. ej. mantenimiento) el usuario
-- quedaria sin fila en public.perfil y toda la UI de autenticacion se
-- comporta como visitante.
--
-- Esta politica permite que un usuario autenticado inserte SU PROPIA fila en
-- public.perfil, de forma idempotente y sin poder escalar privilegios:
--   - id debe coincidir con el usuario efectivo (RLS + efectivo_user_id())
--   - rol debe ser 'estudiante'
--   - xp/nivel/racha_dias deben ser los valores iniciales
--
-- Los perfiles ya existentes no se modifican; el backend sigue siendo la
-- fuente autorizada (misma politica de 'solo estudiante' en el INSERT).
-- =============================================================================

drop policy if exists pol_perfil_insert on public.perfil;

create policy pol_perfil_insert on public.perfil
    for insert to authenticated
    with check (
        id = public.efectivo_user_id()
        and rol = 'estudiante'
        and xp = 0
        and nivel = 1
        and racha_dias = 0
    );

-- Nota: el CHECK anterior tambien impide que alguien se autoasigne 'docente'
-- o 'administrador' o inicie con xp/nivel inflados. El fallback funciona si
-- el trigger de signup o el backend aun no han creado la fila.
