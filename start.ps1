# 🚀 Script de Inicio Rápido - ERP EANA (Windows)
# Este script inicia todos los servicios del sistema

Write-Host "🚀 Iniciando ERP EANA..." -ForegroundColor Cyan
Write-Host ""

# Verificar que Docker esté corriendo
try {
    docker info | Out-Null
    Write-Host "✅ Docker está corriendo" -ForegroundColor Green
}
catch {
    Write-Host "❌ Error: Docker no está corriendo" -ForegroundColor Red
    Write-Host "Por favor, inicia Docker Desktop y vuelve a intentar" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Detener servicios anteriores si existen
Write-Host "🧹 Limpiando servicios anteriores..." -ForegroundColor Yellow
docker-compose down 2>$null

Write-Host ""
Write-Host "📦 Iniciando servicios..." -ForegroundColor Cyan
Write-Host "  - PostgreSQL (Base de datos)"
Write-Host "  - Redis (Cache y Rate Limiting)"
Write-Host "  - Backend (NestJS API)"
Write-Host "  - Frontend (Angular)"
Write-Host ""

# Iniciar servicios
docker-compose up -d

# Esperar a que los servicios estén listos
Write-Host ""
Write-Host "⏳ Esperando a que los servicios estén listos..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Verificar estado de los servicios
Write-Host ""
Write-Host "📊 Estado de los servicios:" -ForegroundColor Cyan
Write-Host ""

# PostgreSQL
try {
    docker exec cns_postgres pg_isready -U postgres 2>$null | Out-Null
    Write-Host "  ✅ PostgreSQL: Listo" -ForegroundColor Green
}
catch {
    Write-Host "  ❌ PostgreSQL: No disponible" -ForegroundColor Red
}

# Redis
try {
    docker exec cns_redis redis-cli ping 2>$null | Out-Null
    Write-Host "  ✅ Redis: Listo" -ForegroundColor Green
}
catch {
    Write-Host "  ❌ Redis: No disponible" -ForegroundColor Red
}

# Backend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
    Write-Host "  ✅ Backend: Listo" -ForegroundColor Green
}
catch {
    Write-Host "  ⏳ Backend: Iniciando... (puede tardar unos segundos más)" -ForegroundColor Yellow
}

# Frontend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4200" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
    Write-Host "  ✅ Frontend: Listo" -ForegroundColor Green
}
catch {
    Write-Host "  ⏳ Frontend: Iniciando... (puede tardar unos segundos más)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🎉 Sistema iniciado exitosamente!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📍 Accesos:" -ForegroundColor Cyan
Write-Host "  - Frontend:     http://localhost:4200"
Write-Host "  - Backend API:  http://localhost:3000"
Write-Host "  - API Docs:     http://localhost:3000/api/docs"
Write-Host "  - Health Check: http://localhost:3000/health"
Write-Host ""
Write-Host "🔐 Credenciales por defecto:" -ForegroundColor Cyan
Write-Host "  Usuario:   admin"
Write-Host "  Contraseña: admin123"
Write-Host ""
Write-Host "📝 Comandos útiles:" -ForegroundColor Cyan
Write-Host "  - Ver logs:        docker-compose logs -f"
Write-Host "  - Detener:         docker-compose down"
Write-Host "  - Reiniciar:       docker-compose restart"
Write-Host "  - Ver estado:      docker-compose ps"
Write-Host ""
Write-Host "📚 Documentación:" -ForegroundColor Cyan
Write-Host "  - README.md"
Write-Host "  - REDIS_INTEGRATION.md"
Write-Host "  - CHANGELOG_2026-01-29.md"
Write-Host ""
Write-Host "✨ ¡Listo para usar!" -ForegroundColor Green
Write-Host ""

# Abrir el navegador automáticamente (opcional)
# $openBrowser = Read-Host "¿Deseas abrir el frontend en el navegador? (S/N)"
# if ($openBrowser -eq "S" -or $openBrowser -eq "s") {
#     Start-Process "http://localhost:4200"
# }
