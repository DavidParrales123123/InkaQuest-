# Configurar repositorio GitHub para InkaQuest
Write-Host "Configurando repositorio GitHub..." -ForegroundColor Cyan
Write-Host ""

# Verificar ubicacion
if (-Not (Test-Path "frontend") -or -Not (Test-Path "backend")) {
    Write-Host "ERROR: Ejecuta este script desde la raiz del proyecto InkaQuest" -ForegroundColor Red
    exit 1
}

# Solicitar usuario de GitHub
Write-Host "Ingresa tu nombre de usuario de GitHub:" -ForegroundColor Yellow
$githubUser = Read-Host "Usuario"

if ([string]::IsNullOrWhiteSpace($githubUser)) {
    Write-Host "ERROR: El nombre de usuario no puede estar vacio" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Usuario: $githubUser" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANTE: Antes de continuar, asegurate de:" -ForegroundColor Yellow
Write-Host "  1. Haber eliminado el repositorio antiguo 'inkaqueste'" -ForegroundColor White
Write-Host "  2. Haber creado el nuevo repositorio 'InkaQuest' en GitHub" -ForegroundColor White
Write-Host ""
$continuar = Read-Host "Ya completaste estos pasos? (s/n)"

if ($continuar -ne "s") {
    Write-Host ""
    Write-Host "Script pausado. Completa los pasos y ejecuta de nuevo." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Pasos:" -ForegroundColor Cyan
    Write-Host "  1. Ve a: https://github.com/$githubUser/inkaqueste/settings" -ForegroundColor White
    Write-Host "  2. Scroll al final -> Delete this repository" -ForegroundColor White
    Write-Host "  3. Ve a: https://github.com/new" -ForegroundColor White
    Write-Host "  4. Repository name: InkaQuest" -ForegroundColor White
    Write-Host "  5. Create repository (NO agregues README ni .gitignore)" -ForegroundColor White
    Write-Host ""
    exit 0
}

Write-Host ""
Write-Host "Inicializando Git..." -ForegroundColor Cyan

# Verificar si ya existe .git
if (Test-Path ".git") {
    Write-Host "  Repositorio Git ya existe" -ForegroundColor Gray
    
    $remoteUrl = git remote get-url origin 2>$null
    
    if ($remoteUrl) {
        Write-Host "  Remote actual: $remoteUrl" -ForegroundColor Gray
        git remote remove origin
        git remote add origin "https://github.com/$githubUser/InkaQuest.git"
        Write-Host "  Remote actualizado" -ForegroundColor Green
    } else {
        git remote add origin "https://github.com/$githubUser/InkaQuest.git"
        Write-Host "  Remote agregado" -ForegroundColor Green
    }
} else {
    git init
    git branch -M main
    git remote add origin "https://github.com/$githubUser/InkaQuest.git"
    Write-Host "  Repositorio inicializado" -ForegroundColor Green
}

Write-Host ""
Write-Host "Agregando archivos al commit..." -ForegroundColor Cyan
git add .

Write-Host ""
Write-Host "Creando commit..." -ForegroundColor Cyan
git commit -m "Initial commit: InkaQuest - Plataforma LMS completa" -m "- Backend: Spring Boot 3.4 + PostgreSQL (Supabase)" -m "- Frontend: Angular 22 + TypeScript" -m "- 14 modulos implementados" -m "- 80+ endpoints REST" -m "- Seguridad: JWT ES256 + RLS" -m "- 100% funcional y listo para produccion"

if ($LASTEXITCODE -eq 0) {
    Write-Host "  Commit creado exitosamente" -ForegroundColor Green
} else {
    Write-Host "  Commit omitido (puede que no haya cambios)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Subiendo a GitHub..." -ForegroundColor Cyan
Write-Host ""
Write-Host "  Esto puede tomar 1-2 minutos..." -ForegroundColor Gray
Write-Host ""

git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Codigo subido exitosamente a GitHub!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Tu repositorio esta disponible en:" -ForegroundColor Cyan
    Write-Host "  https://github.com/$githubUser/InkaQuest" -ForegroundColor White
    Write-Host ""
    Write-Host "Proximos pasos:" -ForegroundColor Cyan
    Write-Host "  1. Verifica el codigo en GitHub" -ForegroundColor White
    Write-Host "  2. Deploy en Vercel: https://vercel.com/new" -ForegroundColor White
    Write-Host "  3. Deploy en Railway: https://railway.app/new" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "Error al subir el codigo" -ForegroundColor Red
    Write-Host ""
    Write-Host "Posibles causas:" -ForegroundColor Yellow
    Write-Host "  1. El repositorio InkaQuest no existe en GitHub" -ForegroundColor White
    Write-Host "  2. No tienes permisos de escritura" -ForegroundColor White
    Write-Host "  3. Necesitas autenticarte con 'gh auth login'" -ForegroundColor White
    Write-Host ""
    Write-Host "Solucion rapida:" -ForegroundColor Cyan
    Write-Host "  gh auth login" -ForegroundColor White
    Write-Host ""
    exit 1
}
