# Script automatico para GitHub usando GitHub CLI
Write-Host "=== InkaQuest - Setup GitHub Automatico ===" -ForegroundColor Cyan
Write-Host ""

# Verificar que gh esta instalado
if (-not (Get-Command "gh" -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: GitHub CLI no esta instalado" -ForegroundColor Red
    Write-Host ""
    Write-Host "Instalar GitHub CLI:" -ForegroundColor Yellow
    Write-Host "  winget install --id GitHub.cli" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Verificar autenticacion
Write-Host "Verificando autenticacion con GitHub..." -ForegroundColor Cyan
$authStatus = gh auth status 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "No estas autenticado en GitHub" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Autenticando..." -ForegroundColor Cyan
    gh auth login
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Autenticacion fallida" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Autenticado correctamente" -ForegroundColor Green
Write-Host ""

# Obtener usuario actual
$currentUser = gh api user --jq .login
Write-Host "Usuario: $currentUser" -ForegroundColor Green
Write-Host ""

# Eliminar repositorio antiguo si existe
Write-Host "Verificando repositorio 'inkaqueste'..." -ForegroundColor Cyan
$repoExists = gh repo view "$currentUser/inkaqueste" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "Repositorio 'inkaqueste' encontrado" -ForegroundColor Yellow
    Write-Host ""
    $eliminar = Read-Host "Deseas eliminarlo? (s/n)"
    
    if ($eliminar -eq "s") {
        Write-Host "Eliminando repositorio 'inkaqueste'..." -ForegroundColor Yellow
        gh repo delete "$currentUser/inkaqueste" --yes
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Repositorio eliminado exitosamente" -ForegroundColor Green
        } else {
            Write-Host "ERROR: No se pudo eliminar el repositorio" -ForegroundColor Red
            Write-Host "Eliminalo manualmente en: https://github.com/$currentUser/inkaqueste/settings" -ForegroundColor Yellow
            exit 1
        }
    }
} else {
    Write-Host "Repositorio 'inkaqueste' no existe (OK)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Creando nuevo repositorio 'InkaQuest'..." -ForegroundColor Cyan

# Crear nuevo repositorio
gh repo create InkaQuest --public --description "Plataforma LMS gamificada con Spring Boot + Angular" --source=. --remote=origin --push=false

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: No se pudo crear el repositorio" -ForegroundColor Red
    Write-Host ""
    Write-Host "Posibles causas:" -ForegroundColor Yellow
    Write-Host "  1. Ya existe un repositorio con ese nombre" -ForegroundColor White
    Write-Host "  2. Problemas de permisos" -ForegroundColor White
    Write-Host ""
    Write-Host "Intenta crearlo manualmente en: https://github.com/new" -ForegroundColor Cyan
    exit 1
}

Write-Host "Repositorio creado exitosamente" -ForegroundColor Green
Write-Host ""

# Inicializar git si no existe
if (-not (Test-Path ".git")) {
    Write-Host "Inicializando Git..." -ForegroundColor Cyan
    git init
    git branch -M main
}

Write-Host "Agregando archivos..." -ForegroundColor Cyan
git add .

Write-Host "Creando commit..." -ForegroundColor Cyan
git commit -m "Initial commit: InkaQuest - Plataforma LMS completa" -m "- Backend: Spring Boot 3.4 + PostgreSQL (Supabase)" -m "- Frontend: Angular 22 + TypeScript" -m "- 14 modulos implementados" -m "- 80+ endpoints REST" -m "- Seguridad: JWT ES256 + RLS" -m "- 100% funcional y listo para produccion"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Commit omitido (no hay cambios nuevos)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Subiendo codigo a GitHub..." -ForegroundColor Cyan
Write-Host "Esto puede tomar 1-2 minutos..." -ForegroundColor Gray
Write-Host ""

git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=== EXITO ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "Tu repositorio esta disponible en:" -ForegroundColor Cyan
    Write-Host "  https://github.com/$currentUser/InkaQuest" -ForegroundColor White
    Write-Host ""
    Write-Host "Proximos pasos:" -ForegroundColor Cyan
    Write-Host "  1. Verifica el codigo: https://github.com/$currentUser/InkaQuest" -ForegroundColor White
    Write-Host "  2. Deploy en Vercel: https://vercel.com/new" -ForegroundColor White
    Write-Host "  3. Deploy en Railway: https://railway.app/new" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "ERROR al subir el codigo" -ForegroundColor Red
    Write-Host ""
    Write-Host "Intenta manualmente:" -ForegroundColor Yellow
    Write-Host "  git push -u origin main" -ForegroundColor White
    Write-Host ""
    exit 1
}
