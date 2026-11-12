# =============================================================================
# Migraciones de esquema - InkaQuest (Supabase / PostgreSQL)
# =============================================================================
#
# Convención de nombres:
#   YYYYMMDDHHMMSS_descripcion_corta.sql
#
# Reglas:
#   - Una migración por cambio logical, aplicado de forma idempotente.
#   - Las tablas se crean con RLS habilitado desde el principio:
#       ALTER TABLE <tabla> ENABLE ROW LEVEL SECURITY;
#   - Las políticas usan `auth.uid()` para vincular las filas al usuario.
#   - Nunca se edita una migración ya aplicada: se crea una nueva.
#   - No se insertan datos sensibles reales.
#
# Aplicar en el proyecto remoto:
#   supabase link --project-ref <PROJECT_REF>
#   supabase db push
#
# Ver el estado:
#   supabase migration list
#
# Generar una migración a partir de cambios locales:
#   supabase db diff -f nombre_de_la_migracion
#
# -----------------------------------------------------------------------------
# En esta fase inicial la carpeta está vacía a propósito: el esquema
# definitivo de la base de datos se diseñará en una fase posterior.
# -----------------------------------------------------------------------------
