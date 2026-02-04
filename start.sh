#!/bin/bash

# 🚀 Script de Inicio Rápido - ERP EANA
# Este script inicia todos los servicios del sistema

echo "🚀 Iniciando ERP EANA..."
echo ""

# Verificar que Docker esté corriendo
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker no está corriendo"
    echo "Por favor, inicia Docker Desktop y vuelve a intentar"
    exit 1
fi

echo "✅ Docker está corriendo"
echo ""

# Detener servicios anteriores si existen
echo "🧹 Limpiando servicios anteriores..."
docker-compose down 2>/dev/null

echo ""
echo "📦 Iniciando servicios..."
echo "  - PostgreSQL (Base de datos)"
echo "  - Redis (Cache y Rate Limiting)"
echo "  - Backend (NestJS API)"
echo "  - Frontend (Angular)"
echo ""

# Iniciar servicios
docker-compose up -d

# Esperar a que los servicios estén listos
echo ""
echo "⏳ Esperando a que los servicios estén listos..."
sleep 10

# Verificar estado de los servicios
echo ""
echo "📊 Estado de los servicios:"
echo ""

# PostgreSQL
if docker exec cns_postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo "  ✅ PostgreSQL: Listo"
else
    echo "  ❌ PostgreSQL: No disponible"
fi

# Redis
if docker exec cns_redis redis-cli ping > /dev/null 2>&1; then
    echo "  ✅ Redis: Listo"
else
    echo "  ❌ Redis: No disponible"
fi

# Backend
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "  ✅ Backend: Listo"
else
    echo "  ⏳ Backend: Iniciando... (puede tardar unos segundos más)"
fi

# Frontend
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "  ✅ Frontend: Listo"
else
    echo "  ⏳ Frontend: Iniciando... (puede tardar unos segundos más)"
fi

echo ""
echo "=========================================="
echo "🎉 Sistema iniciado exitosamente!"
echo "=========================================="
echo ""
echo "📍 Accesos:"
echo "  - Frontend:     http://localhost:5173"
echo "  - Backend API:  http://localhost:3000"
echo "  - API Docs:     http://localhost:3000/api/docs"
echo "  - Health Check: http://localhost:3000/health"
echo ""
echo "🔐 Credenciales por defecto:"
echo "  Usuario:   admin"
echo "  Contraseña: admin123"
echo ""
echo "📝 Comandos útiles:"
echo "  - Ver logs:        docker-compose logs -f"
echo "  - Detener:         docker-compose down"
echo "  - Reiniciar:       docker-compose restart"
echo "  - Ver estado:      docker-compose ps"
echo ""
echo "📚 Documentación:"
echo "  - README.md"
echo "  - REDIS_INTEGRATION.md"
echo "  - CHANGELOG_2026-01-29.md"
echo ""
echo "✨ ¡Listo para usar!"
echo ""
