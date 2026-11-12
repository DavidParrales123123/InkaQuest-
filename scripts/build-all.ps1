# =============================================================================
# Compila el frontend y el backend de forma secuencial.
# =============================================================================
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$frontend = Join-Path $root 'frontend\inkaquest-web'
$backend = Join-Path $root 'backend\inkaquest-api'

Write-Host "`n=== Frontend: instalacion ===" -ForegroundColor Cyan
Push-Location $frontend
try {
    npm ci
    if ($LASTEXITCODE -ne 0) { throw 'Fallo npm ci en el frontend.' }

    Write-Host "`n=== Frontend: lint ===" -ForegroundColor Cyan
    npm run lint
    if ($LASTEXITCODE -ne 0) { throw 'Fallo el lint del frontend.' }

    Write-Host "`n=== Frontend: build ===" -ForegroundColor Cyan
    npm run build
    if ($LASTEXITCODE -ne 0) { throw 'Fallo el build del frontend.' }
}
finally {
    Pop-Location
}

Write-Host "`n=== Backend: build y pruebas ===" -ForegroundColor Cyan
Push-Location $backend
try {
    mvn -B clean verify
    if ($LASTEXITCODE -ne 0) { throw 'Fallo la compilacion del backend.' }
}
finally {
    Pop-Location
}

Write-Host "`nCompilacion completa correcta." -ForegroundColor Green
Write-Host "Salida del frontend: frontend\inkaquest-web\dist\inkaquest-web\browser"
Write-Host "JAR del backend:     backend\inkaquest-api\target\inkaquest-api-0.1.0.jar"
