# ===================================
# InkaQuest API - Script de Inicio Local
# ===================================

Write-Host "🚀 Iniciando InkaQuest API (Local)..." -ForegroundColor Cyan
Write-Host ""

# Verificar que existe .env
if (-Not (Test-Path ".env")) {
    Write-Host "⚠️  Archivo .env no encontrado!" -ForegroundColor Yellow
    Write-Host "   Copiando .env.example a .env..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "   ✅ Archivo .env creado. Configura las variables antes de continuar." -ForegroundColor Green
    Write-Host ""
    exit 1
}

# Cargar variables de entorno desde .env
Write-Host "📋 Cargando variables de entorno desde .env..." -ForegroundColor Cyan
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($name, $value, "Process")
        Write-Host "   ✓ $name" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "🔧 Configuración:" -ForegroundColor Cyan
Write-Host "   Perfil: $env:SPRING_PROFILES_ACTIVE" -ForegroundColor White
Write-Host "   Puerto: 8080" -ForegroundColor White
Write-Host "   Base de datos: Supabase PostgreSQL" -ForegroundColor White
Write-Host ""

# Compilar y ejecutar
Write-Host "🔨 Compilando aplicación..." -ForegroundColor Cyan
mvn clean compile -DskipTests

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Error en la compilación" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Compilación exitosa" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Iniciando servidor Spring Boot..." -ForegroundColor Cyan
Write-Host "   API disponible en: http://localhost:8080/api/v1" -ForegroundColor Green
Write-Host "   Documentación: http://localhost:8080/swagger-ui.html" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Presiona Ctrl+C para detener el servidor" -ForegroundColor Yellow
Write-Host ""

# Ejecutar Spring Boot
mvn spring-boot:run
