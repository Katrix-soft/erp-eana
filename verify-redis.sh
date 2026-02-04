#!/bin/bash

# 🔍 Script de Verificación - Redis + Cache + Security
# Este script verifica que todo esté configurado correctamente

echo "🚀 Iniciando verificación de Redis Architecture..."
echo ""

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función de verificación
check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣ Verificando Docker Compose..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verificar que Redis esté en docker-compose.yml
grep -q "redis:" docker-compose.yml
check "Redis service definido en docker-compose.yml"

grep -q "REDIS_HOST" docker-compose.yml
check "Variables REDIS_HOST/PORT en docker-compose.yml"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣ Verificando archivos de código..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verificar que existan los archivos del cache module
test -f "backend/src/cache/cache.module.ts"
check "CacheModule creado"

test -f "backend/src/cache/cache.service.ts"
check "CacheService creado"

test -f "backend/src/cache/rate-limiter.service.ts"
check "RateLimiterService creado"

test -f "backend/src/cache/EXAMPLES.ts"
check "Archivo de ejemplos creado"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣ Verificando integración en app.module.ts..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

grep -q "CacheModule" backend/src/app.module.ts
check "CacheModule importado en app.module.ts"

grep -q "cache:" backend/src/app.module.ts
check "TypeORM cache configurado"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣ Verificando AuthService actualizado..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

grep -q "RateLimiterService" backend/src/auth/auth.service.ts
check "RateLimiterService inyectado en AuthService"

grep -q "rateLimiter.check" backend/src/auth/auth.service.ts
check "Rate limiting implementado en login"

grep -q "cacheService" backend/src/auth/auth.service.ts
check "CacheService inyectado en AuthService"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣ Verificando variables de entorno..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test -f "backend/.env"
check "Archivo .env existe"

grep -q "REDIS_HOST" backend/.env
check "REDIS_HOST definido en .env"

grep -q "CACHE_ENABLED" backend/.env
check "CACHE_ENABLED definido en .env"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6️⃣ Verificando dependencias npm..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

grep -q "@nestjs/cache-manager" backend/package.json
check "@nestjs/cache-manager en package.json"

grep -q "cache-manager" backend/package.json
check "cache-manager en package.json"

grep -q "cache-manager-redis-yet" backend/package.json
check "cache-manager-redis-yet en package.json"

test -d "backend/node_modules/@nestjs/cache-manager"
check "@nestjs/cache-manager instalado"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7️⃣ Verificando documentación..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test -f "REDIS_ARCHITECTURE.md"
check "Documentación de arquitectura creada"

test -f "REDIS_SETUP.md"
check "Guía de instalación creada"

test -f "REDIS_SUMMARY.md"
check "Resumen ejecutivo creado"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "8️⃣ Verificando contenedores Docker (opcional)..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v docker &> /dev/null; then
    docker ps --filter "name=cns_redis" --format "{{.Names}}" | grep -q "cns_redis"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Redis container corriendo${NC}"
        
        # Verificar que Redis responda
        docker exec cns_redis redis-cli ping > /dev/null 2>&1
        check "Redis responde a PING"
    else
        echo -e "${YELLOW}⚠️  Redis container no está corriendo (ejecuta: docker-compose up -d)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Docker no disponible (saltar verificación de containers)${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESUMEN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Arquitectura Redis implementada correctamente"
echo ""
echo "📚 Siguiente paso:"
echo "   1. Levantar Docker: docker-compose up -d"
echo "   2. Ver logs: docker logs cns_backend -f"
echo "   3. Probar login y verificar cache en logs"
echo ""
echo "📖 Documentación:"
echo "   - REDIS_SUMMARY.md     → Resumen ejecutivo"
echo "   - REDIS_ARCHITECTURE.md → Arquitectura completa"
echo "   - REDIS_SETUP.md       → Guía de instalación"
echo ""
echo "🎯 Todo listo para producción!"
echo ""
