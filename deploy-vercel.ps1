# ===================================
# Script de Deployment en Vercel
# ===================================

Write-Host "🚀 Deploying InkaQuest Frontend a Vercel..." -ForegroundColor Cyan
Write-Host ""

# Verificar que Vercel CLI esté instalado
if (-not (Get-Command "vercel" -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️  Vercel CLI no encontrado. Instalando..." -ForegroundColor Yellow
    npm install -g vercel
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "❌ Error instalando Vercel CLI" -ForegroundColor Red
        exit 1
    }
}

# Ir a la carpeta del frontend
Set-Location frontend/inkaquest-web

Write-Host "📋 Verificando configuración..." -ForegroundColor Cyan

# Verificar que exista vercel.json
if (-Not (Test-Path "vercel.json")) {
    Write-Host "⚠️  vercel.json no encontrado!" -ForegroundColor Yellow
    Write-Host "   El archivo de configuración es necesario." -ForegroundColor Yellow
    exit 1
}

# Verificar que existan las dependencias
if (-Not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependencias..." -ForegroundColor Cyan
    npm install
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "❌ Error instalando dependencias" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "✅ Configuración verificada" -ForegroundColor Green
Write-Host ""

# Opciones de deployment
Write-Host "Selecciona el tipo de deployment:" -ForegroundColor Cyan
Write-Host "  1. Preview (staging)" -ForegroundColor White
Write-Host "  2. Production" -ForegroundColor White
Write-Host ""
$opcion = Read-Host "Opción (1-2)"

Write-Host ""

if ($opcion -eq "2") {
    Write-Host "🚀 Deploying a PRODUCTION..." -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANTE: Asegúrate de haber configurado las variables de entorno en Vercel:" -ForegroundColor Yellow
    Write-Host "   - VITE_API_URL" -ForegroundColor White
    Write-Host "   - VITE_SUPABASE_URL" -ForegroundColor White
    Write-Host "   - VITE_SUPABASE_ANON_KEY" -ForegroundColor White
    Write-Host ""
    
    $confirmar = Read-Host "¿Continuar con deployment a producción? (s/n)"
    
    if ($confirmar -ne "s") {
        Write-Host ""
        Write-Host "❌ Deployment cancelado" -ForegroundColor Yellow
        exit 0
    }
    
    Write-Host ""
    vercel --prod
} else {
    Write-Host "🚀 Deploying a PREVIEW (staging)..." -ForegroundColor Yellow
    Write-Host ""
    vercel
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment exitoso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Próximos pasos:" -ForegroundColor Cyan
    Write-Host "   1. Verifica que el sitio funcione correctamente" -ForegroundColor White
    Write-Host "   2. Revisa los logs en el dashboard de Vercel" -ForegroundColor White
    Write-Host "   3. Configura el dominio personalizado (opcional)" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Error en el deployment" -ForegroundColor Red
    Write-Host "   Revisa los logs arriba para más detalles" -ForegroundColor White
    Write-Host ""
    exit 1
}
