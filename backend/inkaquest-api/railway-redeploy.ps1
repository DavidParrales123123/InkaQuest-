# Script para forzar redeploy en Railway
# Railway detecta cambios en el repositorio Git y redespliega automaticamente

Write-Host "Verificando estado del backend en Railway..." -ForegroundColor Cyan

# Verificar si el backend esta corriendo
try {
    $response = Invoke-WebRequest -Uri "https://inkaquest-production.up.railway.app/actuator/health" -Method Get -TimeoutSec 10
    Write-Host "Backend esta corriendo: $($response.StatusCode)" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "Backend no responde o esta caido" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Pasos para redesplegar en Railway:" -ForegroundColor Cyan
    Write-Host "1. Ve a: https://railway.app/dashboard" -ForegroundColor White
    Write-Host "2. Selecciona el proyecto inkaquest-production" -ForegroundColor White
    Write-Host "3. Click en el servicio del backend" -ForegroundColor White
    Write-Host "4. Click en Deployments" -ForegroundColor White
    Write-Host "5. Click en Deploy para forzar un nuevo deployment" -ForegroundColor White
    Write-Host ""
    Write-Host "O espera 5-10 minutos para que Railway detecte los cambios automaticamente." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Ultimos commits pusheados:" -ForegroundColor Cyan
git log --oneline -5
