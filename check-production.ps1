# ============================================
# EANA ERP - Production Readiness Check (PowerShell)
# ============================================

Write-Host "🔍 Verificando configuración de producción..." -ForegroundColor Cyan
Write-Host ""

$ERRORS = 0
$WARNINGS = 0

function Write-Error-Custom {
    param($Message)
    Write-Host "❌ ERROR: $Message" -ForegroundColor Red
    $script:ERRORS++
}

function Write-Warning-Custom {
    param($Message)
    Write-Host "⚠️  WARNING: $Message" -ForegroundColor Yellow
    $script:WARNINGS++
}

function Write-Success {
    param($Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "1. Verificando archivos de configuración" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

# Verificar .env en root
if (-not (Test-Path ".env")) {
    Write-Error-Custom "Falta archivo .env en root"
}
else {
    Write-Success "Archivo .env existe en root"
    
    $envContent = Get-Content ".env" -Raw
    
    # Verificar JWT_SECRET
    if ($envContent -match "CHANGE_THIS_TO_A_SECURE_RANDOM_STRING") {
        Write-Error-Custom "JWT_SECRET no ha sido cambiado del valor por defecto"
    }
    elseif ($envContent -match "JWT_SECRET=") {
        Write-Success "JWT_SECRET configurado"
    }
    else {
        Write-Error-Custom "JWT_SECRET no encontrado en .env"
    }
    
    # Verificar GEMINI_API_KEY
    if ($envContent -match "YOUR_GEMINI_API_KEY_HERE") {
        Write-Warning-Custom "GEMINI_API_KEY no ha sido cambiado del valor por defecto"
    }
    elseif ($envContent -match "GEMINI_API_KEY=") {
        Write-Success "GEMINI_API_KEY configurado"
    }
    else {
        Write-Warning-Custom "GEMINI_API_KEY no encontrado en .env"
    }
}

# Verificar backend/.env
if (-not (Test-Path "backend\.env")) {
    Write-Error-Custom "Falta archivo backend\.env"
}
else {
    Write-Success "Archivo backend\.env existe"
    
    $backendEnvContent = Get-Content "backend\.env" -Raw
    
    # Verificar POSTGRES_PASSWORD
    if ($backendEnvContent -match "POSTGRES_PASSWORD=postgrespassword") {
        Write-Error-Custom "POSTGRES_PASSWORD usando valor por defecto (inseguro)"
    }
    
    # Verificar CORS_ORIGIN
    if (-not ($backendEnvContent -match "CORS_ORIGIN=")) {
        Write-Warning-Custom "CORS_ORIGIN no configurado en backend\.env"
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "2. Verificando Docker" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

# Verificar Docker
try {
    $dockerVersion = docker --version
    Write-Success "Docker instalado: $dockerVersion"
}
catch {
    Write-Error-Custom "Docker no está instalado"
}

# Verificar Docker Compose
try {
    docker compose version | Out-Null
    Write-Success "Docker Compose instalado"
}
catch {
    Write-Error-Custom "Docker Compose no está instalado"
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "3. Verificando archivos Docker" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

# Verificar Dockerfiles
if (-not (Test-Path "backend\Dockerfile")) {
    Write-Error-Custom "Falta backend\Dockerfile"
}
else {
    Write-Success "backend\Dockerfile existe"
}

if (-not (Test-Path "frontend\Dockerfile")) {
    Write-Error-Custom "Falta frontend\Dockerfile"
}
else {
    Write-Success "frontend\Dockerfile existe"
}

# Verificar .dockerignore
if (-not (Test-Path "backend\.dockerignore")) {
    Write-Warning-Custom "Falta backend\.dockerignore"
}
else {
    Write-Success "backend\.dockerignore existe"
}

if (-not (Test-Path "frontend\.dockerignore")) {
    Write-Warning-Custom "Falta frontend\.dockerignore"
}
else {
    Write-Success "frontend\.dockerignore existe"
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "4. Verificando estructura de proyecto" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

# Verificar directorios principales
$directories = @("backend", "frontend", "backend\src", "frontend\src")
foreach ($dir in $directories) {
    if (Test-Path $dir) {
        Write-Success "Directorio $dir existe"
    }
    else {
        Write-Error-Custom "Falta directorio $dir"
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 RESUMEN" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

if ($ERRORS -eq 0 -and $WARNINGS -eq 0) {
    Write-Host "✅ Todo listo para producción!" -ForegroundColor Green
    exit 0
}
elseif ($ERRORS -eq 0) {
    Write-Host "⚠️  $WARNINGS advertencias encontradas" -ForegroundColor Yellow
    Write-Host "Se recomienda revisar las advertencias antes de desplegar"
    exit 0
}
else {
    Write-Host "❌ $ERRORS errores y $WARNINGS advertencias encontrados" -ForegroundColor Red
    Write-Host "Por favor corrige los errores antes de desplegar a producción"
    exit 1
}
