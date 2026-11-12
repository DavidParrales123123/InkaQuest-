# =============================================================================
# SUPABASE - Semillas de datos (seed)
# -----------------------------------------------------------------------------
# Los scripts de esta carpeta se ejecutan automáticamente tras `supabase db reset`
# (stack local) y de forma manual con `psql` en entornos externos.
#
# IMPORTANTE:
#   - No se crean tablas aquí: el esquema lo definen las migraciones en
#     `supabase/migrations/`.
#   - No insertar datos sensibles reales (correos personales, tokens, claves).
#   - Usar identificadores estables y datos de prueba claramente marcados.
# =============================================================================

-- Semilla base de InkaQuest.
-- Se deja intencionalmente vacía: el esquema definitivo y sus datos de
-- referencia se definirán en la fase de diseño de datos.

SELECT 1;
