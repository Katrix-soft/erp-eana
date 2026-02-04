#!/bin/bash

# ============================================
# EANA ERP - Production Readiness Check
# ============================================

echo "🔍 Verificando configuración de producción..."
echo ""

ERRORS=0
WARNINGS=0

# Colores
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Función para errores
error() {
    echo -e "${RED}❌ ERROR: $1${NC}"
    ((ERRORS++))
}

# Función para warnings
warning() {
    echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
    ((WARNINGS++))
}

# Función para success
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Verificando archivos de configuración"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verificar .env en root
if [ ! -f ".env" ]; then
    error "Falta archivo .env en root"
else
    success "Archivo .env existe en root"
    
    # Verificar JWT_SECRET
    if grep -q "CHANGE_THIS_TO_A_SECURE_RANDOM_STRING" .env 2>/dev/null; then
        error "JWT_SECRET no ha sido cambiado del valor por defecto"
    elif grep -q "JWT_SECRET=" .env; then
        success "JWT_SECRET configurado"
    else
        error "JWT_SECRET no encontrado en .env"
    fi
    
    # Verificar GEMINI_API_KEY
    if grep -q "YOUR_GEMINI_API_KEY_HERE" .env 2>/dev/null; then
        warning "GEMINI_API_KEY no ha sido cambiado del valor por defecto"
    elif grep -q "GEMINI_API_KEY=" .env; then
        success "GEMINI_API_KEY configurado"
    else
        warning "GEMINI_API_KEY no encontrado en .env"
    fi
fi

# Verificar backend/.env
if [ ! -f "backend/.env" ]; then
    error "Falta archivo backend/.env"
else
    success "Archivo backend/.env existe"
    
    # Verificar POSTGRES_PASSWORD
    if grep -q "POSTGRES_PASSWORD=postgrespassword" backend/.env; then
        error "POSTGRES_PASSWORD usando valor por defecto (inseguro)"
    fi
    
    # Verificar CORS_ORIGIN
    if ! grep -q "CORS_ORIGIN=" backend/.env; then
        warning "CORS_ORIGIN no configurado en backend/.env"
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. Verificando Docker"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verificar Docker
if ! command -v docker &> /dev/null; then
    error "Docker no está instalado"
else
    success "Docker instalado: $(docker --version)"
fi

# Verificar Docker Compose
if ! command -v docker compose &> /dev/null; then
    error "Docker Compose no está instalado"
else
    success "Docker Compose instalado"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. Verificando archivos Docker"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verificar Dockerfiles
if [ ! -f "backend/Dockerfile" ]; then
    error "Falta backend/Dockerfile"
else
    success "backend/Dockerfile existe"
fi

if [ ! -f "frontend/Dockerfile" ]; then
    error "Falta frontend/Dockerfile"
else
    success "frontend/Dockerfile existe"
fi

# Verificar .dockerignore
if [ ! -f "backend/.dockerignore" ]; then
    warning "Falta backend/.dockerignore"
else
    success "backend/.dockerignore existe"
fi

if [ ! -f "frontend/.dockerignore" ]; then
    warning "Falta frontend/.dockerignore"
else
    success "frontend/.dockerignore existe"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. Verificando seguridad"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verificar que .env no esté en git
if git check-ignore .env > /dev/null 2>&1; then
    success ".env está en .gitignore"
else
    error ".env NO está en .gitignore (riesgo de seguridad)"
fi

# Verificar que backend/.env no esté en git
if git check-ignore backend/.env > /dev/null 2>&1; then
    success "backend/.env está en .gitignore"
else
    error "backend/.env NO está en .gitignore (riesgo de seguridad)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. Verificando estructura de proyecto"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verificar directorios principales
for dir in "backend" "frontend" "backend/src" "frontend/src"; do
    if [ -d "$dir" ]; then
        success "Directorio $dir existe"
    else
        error "Falta directorio $dir"
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESUMEN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ Todo listo para producción!${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS advertencias encontradas${NC}"
    echo "Se recomienda revisar las advertencias antes de desplegar"
    exit 0
else
    echo -e "${RED}❌ $ERRORS errores y $WARNINGS advertencias encontrados${NC}"
    echo "Por favor corrige los errores antes de desplegar a producción"
    exit 1
fi
