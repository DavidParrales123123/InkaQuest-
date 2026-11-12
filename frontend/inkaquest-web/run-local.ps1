# ===================================
# InkaQuest Web - Script de Inicio Local
# ===================================

Write-Host "🚀 Iniciando InkaQuest Web (Local)..." -ForegroundColor Cyan
Write-Host ""

# Verificar que existe .env
if (-Not (Test-Path ".env")) {
    Write-Host "⚠️  Archivo .env no encontrado!" -ForegroundColor Yellow
    Write-Host "   Copiando .env.example a .env..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "   ✅ Archivo .env creado." -ForegroundColor Green
    Write-Host ""
}

# Verificar que existen node_modules
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
Write-Host "🔧 Configuración:" -ForegroundColor Cyan
Write-Host "   Puerto: 4200" -ForegroundColor White
Write-Host "   API Backend: http://localhost:8080/api/v1" -ForegroundColor White
Write-Host "   Supabase Auth: Configurado" -ForegroundColor White
Write-Host ""

Write-Host "🚀 Iniciando servidor de desarrollo Angular..." -ForegroundColor Cyan
Write-Host "   Aplicación disponible en: http://localhost:4200" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Presiona Ctrl+C para detener el servidor" -ForegroundColor Yellow
Write-Host ""

# Ejecutar Angular
npm run start
