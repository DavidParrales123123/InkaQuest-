# =============================================================================
# Elimina los artefactos de build del frontend y del backend.
# =============================================================================
$root = Split-Path -Parent $PSScriptRoot

$targets = @(
    (Join-Path $root 'frontend\inkaquest-web\dist'),
    (Join-Path $root 'frontend\inkaquest-web\out-tsc'),
    (Join-Path $root 'frontend\inkaquest-web\.angular'),
    (Join-Path $root 'backend\inkaquest-api\target')
)

foreach ($target in $targets) {
    if (Test-Path $target) {
        Write-Host "Eliminando $target" -ForegroundColor Yellow
        Remove-Item -Recurse -Force $target
    }
}

Write-Host "Limpieza completada." -ForegroundColor Green
