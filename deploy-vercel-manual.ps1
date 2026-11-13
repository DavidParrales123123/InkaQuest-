# Script para desplegar InkaQuest Frontend en Vercel
# Ejecutar desde la raíz del proyecto

Write-Host "=== Despliegue de InkaQuest Frontend en Vercel ===" -ForegroundColor Cyan
Write-Host ""

# Cambiar al directorio del frontend
Set-Location "frontend/inkaquest-web"

Write-Host "Paso 1: Login en Vercel (se abrirá tu navegador)" -ForegroundColor Yellow
vercel login

Write-Host ""
Write-Host "Paso 2: Despliegue inicial (configuración)" -ForegroundColor Yellow
Write-Host "Cuando Vercel pregunte:" -ForegroundColor Green
Write-Host "  - Set up and deploy? → YES" -ForegroundColor White
Write-Host "  - Which scope? → Selecciona tu cuenta" -ForegroundColor White
Write-Host "  - Link to existing project? → NO" -ForegroundColor White
Write-Host "  - What's your project's name? → inkaquest-web" -ForegroundColor White
Write-Host "  - In which directory is your code located? → ./" -ForegroundColor White
Write-Host "  - Want to modify the settings? → NO" -ForegroundColor White
Write-Host ""
Write-Host "Presiona ENTER para continuar..." -ForegroundColor Yellow
Read-Host

# Deployment inicial (preview)
vercel

Write-Host ""
Write-Host "Paso 3: Despliegue a PRODUCCIÓN" -ForegroundColor Yellow
Write-Host "Presiona ENTER para desplegar a producción..." -ForegroundColor Yellow
Read-Host

# Deployment a producción
vercel --prod

Write-Host ""
Write-Host "=== ¡Despliegue completado! ===" -ForegroundColor Green
Write-Host "Tu aplicación está disponible en la URL que Vercel te proporcionó" -ForegroundColor Green
Write-Host ""
Write-Host "Nota: Copia la URL de producción y actualiza CORS_ALLOWED_ORIGINS en Railway" -ForegroundColor Yellow
