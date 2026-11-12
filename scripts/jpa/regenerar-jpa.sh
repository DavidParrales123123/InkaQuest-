#!/usr/bin/env bash
# =============================================================================
# Regenera el mapeo JPA desde el esquema real de PostgreSQL.
#
# Uso:
#   bash scripts/jpa/regenerar-jpa.sh
#
# Requisitos:
#   - SUPABASE_DB_PASSWORD definida (o el prompt de psql).
#   - Node.js disponible.
# =============================================================================
set -e

T="$(cd "$(dirname "$0")/../.." && pwd)"
JPA="$T/scripts/jpa"
TMP="$T/scripts/jpa/.tmp"

mkdir -p "$TMP"

echo "=== 1. Extrayendo el esquema de PostgreSQL ==="
DB_PASSWORD="${SUPABASE_DB_PASSWORD:-}"
if [ -z "$DB_PASSWORD" ]; then
  echo "ERROR: define SUPABASE_DB_PASSWORD con la contrasena de la base."
  exit 1
fi

SUPABASE_DB_PASSWORD="$DB_PASSWORD" \
  node "$JPA/extraer-esquema.mjs" "$TMP/schema.json"

echo ""
echo "=== 2. Generando entidades y enums ==="
node "$JPA/generar-entidades.mjs" "$TMP/schema.json" "$T/backend/inkaquest-api"

echo ""
echo "=== 3. Generando repositorios ==="
node "$JPA/generar-repositorios.mjs" "$T/backend/inkaquest-api" "$TMP/schema.json"
rm -f "$T/backend/inkaquest-api/.repos-plan.json"

echo ""
echo "=== 4. Restaurando entidades con clave primaria compuesta ==="
BASE="$T/backend/inkaquest-api/src/main/java/com/inkaquest"
cp "$JPA/RolPermiso.java" "$BASE/modules/identidad/entity/" 2>/dev/null || true
cp "$JPA/RolPermisoId.java" "$BASE/modules/identidad/entity/" 2>/dev/null || true
cp "$JPA/RolPermisoRepository.java" "$BASE/modules/identidad/repository/" 2>/dev/null || true

echo ""
echo "=== 5. Verificando la compilacion ==="
cd "$T/backend/inkaquest-api"
mvn -B -q clean compile

rm -rf "$TMP"
echo ""
echo "Mapeo JPA regenerado correctamente."
