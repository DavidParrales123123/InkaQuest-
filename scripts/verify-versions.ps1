# =============================================================================
# Verifica que el entorno de desarrollo tiene las herramientas requeridas.
# =============================================================================
$ErrorActionPreference = 'Continue'

function Test-Tool {
    param(
        [string]$Name,
        [string]$Command,
        [string[]]$Minimum,
        [string]$InstallHint
    )

    Write-Host "`n=== $Name ===" -ForegroundColor Cyan

    if (-not (Get-Command $Command -ErrorAction SilentlyContinue)) {
        Write-Host "[X] $Name no esta instalado." -ForegroundColor Red
        Write-Host "    Instalacion: $InstallHint" -ForegroundColor Yellow
        return $false
    }

    $output = & $Command --version 2>&1 | Select-Object -First 1
    Write-Host "[OK] $output"

    if ($Minimum -and $output -notmatch $Minimum) {
        Write-Host "[!] Se espera una version que contenga: $Minimum" -ForegroundColor Yellow
    }

    return $true
}

$results = @()

$results += Test-Tool -Name 'Node.js' -Command 'node' -Minimum 'v(2[2-9]|[3-9]\d)\.' `
    -InstallHint 'https://nodejs.org/ (LTS >= 22.12)'
$results += Test-Tool -Name 'npm' -Command 'npm' -Minimum '\d+\.' `
    -InstallHint 'Se instala junto con Node.js'
$results += Test-Tool -Name 'Java (JDK)' -Command 'java' -Minimum '2[5-9]|3\d' `
    -InstallHint 'https://adoptium.net/ (Temurin JDK 25)'
$results += Test-Tool -Name 'Maven' -Command 'mvn' -Minimum '3\.(9|10|11)' `
    -InstallHint 'https://maven.apache.org/download.cgi (3.9+)'
$results += Test-Tool -Name 'Docker' -Command 'docker' -Minimum '\d+' `
    -InstallHint 'https://docs.docker.com/desktop/ (opcional)'

Write-Host "`n=== Resumen ===" -ForegroundColor Cyan
if ($results -contains $false) {
    Write-Host "Faltan herramientas. Revisa los mensajes anteriores." -ForegroundColor Yellow
    exit 1
}

Write-Host "Todas las herramientas requeridas estan disponibles." -ForegroundColor Green
exit 0
