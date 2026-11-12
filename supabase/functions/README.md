# =============================================================================
# Edge Functions - InkaQuest (Supabase / Deno)
# =============================================================================
#
# Convenciones:
#   - Una función por archivo/carpeta, en kebab-case: `nombre-funcion/`.
#   - Cada función expone un handler `index.ts` que recibe `Request`.
#   - La verificación del JWT se activa con `verify_jwt = true` en
#     `supabase/config.toml` (ya configurado para las funciones existentes).
#   - El código compartido se ubica en `_shared/`.
#   - Se usan variables de entorno (`supabase secrets set --env-file .env`),
#     nunca valores hardcodeados.
#
# Despliegue:
#   supabase functions deploy <nombre-funcion>
#
# Listar funciones desplegadas:
#   supabase functions list
#
# -----------------------------------------------------------------------------
# En esta fase inicial la carpeta está vacía a propósito: las Edge Functions
# se implementarán cuando se definan los flujos de negocio.
# -----------------------------------------------------------------------------
