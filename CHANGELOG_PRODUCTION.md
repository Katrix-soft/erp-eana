# 📝 Changelog - Mejoras de Producción

## [1.1.0] - 2026-01-30

### 🔒 Seguridad

#### Crítico
- **Removidos secretos hardcodeados** de archivos `.env`
  - JWT_SECRET ahora requiere configuración manual
  - GEMINI_API_KEY ahora requiere configuración manual
  - Agregadas instrucciones para generar secretos seguros
  
- **CORS mejorado** para producción
  - Cambiado de `origin: true` (permite todo) a configuración basada en variables de entorno
  - Soporte para múltiples dominios separados por coma
  - Bloqueo por defecto en producción si no está configurado
  - Headers adicionales: `allowedHeaders`, `exposedHeaders`, `maxAge`

- **Dockerfiles optimizados** con mejores prácticas de seguridad
  - Usuario no-root en backend (nestjs:1001)
  - Usuario no-root en frontend (nginx)
  - Multi-stage builds mejorados
  - Healthchecks integrados en Dockerfiles

#### Importante
- **`.gitignore` mejorado**
  - Protección de todos los archivos `.env`
  - Exclusión de logs, backups, y archivos sensibles
  - Protección de uploads y datos

- **`.dockerignore` agregado** al frontend
  - Reduce tamaño de imagen
  - Excluye archivos innecesarios del build

### ⚙️ Configuración

- **Archivos de configuración agregados:**
  - `.env.example` en root
  - `.env.production.example` para producción
  - `backend/.env.example` mejorado con todas las variables

- **Docker Compose mejorado:**
  - `CORS_ORIGIN` agregado a variables de entorno
  - Healthcheck agregado al frontend
  - Mejor configuración de recursos

- **Docker Compose para Producción:**
  - Nuevo archivo `docker-compose.prod.yml`
  - Optimizado para ambientes de producción
  - Persistencia de Redis opcional
  - Mejores límites de recursos
  - No expone puertos innecesarios

### 📊 Logging

- **Sistema de logs para producción:**
  - Nuevo `ProductionLogger` service
  - Logs guardados en archivos por fecha
  - Separación de logs de error
  - Rotación automática por día
  - Logs de consola mejorados con emojis y contexto

### 🚀 Optimización

- **Angular build budgets** aumentados
  - Initial: 500kB → 2MB warning, 1MB → 5MB error
  - Component styles: 12kB → 20kB warning, 20kB → 50kB error
  - Permite aplicaciones más realistas

- **Backend Dockerfile optimizado:**
  - 3 stages: dependencies, build, runtime
  - Mejor uso de caché de Docker
  - Instalación de dependencias nativas
  - Limpieza de caché npm
  - Healthcheck integrado

- **Frontend Dockerfile optimizado:**
  - Build con `--configuration production`
  - Flags `--prefer-offline --no-audit` para builds más rápidos
  - Healthcheck integrado
  - Permisos optimizados

### 📚 Documentación

- **DEPLOYMENT.md** - Guía completa de deployment
  - Instrucciones paso a paso
  - Configuración de servidor
  - Setup de Nginx reverse proxy
  - Comandos de monitoreo
  - Procedimientos de backup
  - Troubleshooting

- **SECURITY.md** - Guía de seguridad
  - Generación de secretos
  - Configuración CORS
  - Rate limiting
  - Headers de seguridad
  - Auditoría y logs
  - Checklist de seguridad
  - Respuesta a incidentes

### 🛠️ Herramientas

- **Scripts de verificación:**
  - `check-production.sh` (Linux/Mac)
  - `check-production.ps1` (Windows)
  - Verifican configuración antes de deployment
  - Detectan secretos por defecto
  - Validan estructura del proyecto

### 🐛 Fixes

- Removido debug log de variables de entorno en `main.ts`
- Mejorados mensajes de inicio del servidor
- Agregado contexto de ambiente en logs

## Migración desde versión anterior

### Pasos necesarios:

1. **Generar nuevos secretos:**
```bash
# JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# PostgreSQL Password
openssl rand -base64 32
```

2. **Actualizar archivos .env:**
```bash
# Root
cp .env.example .env
# Editar .env con tus valores

# Backend
cd backend
cp .env.example .env
# Editar backend/.env con tus valores
```

3. **Configurar CORS:**
```env
# En backend/.env
CORS_ORIGIN=http://localhost:4200,http://localhost:8080
```

4. **Verificar configuración:**
```bash
./check-production.sh  # o .ps1 en Windows
```

5. **Rebuild de imágenes Docker:**
```bash
docker compose build --no-cache
docker compose up -d
```

## Breaking Changes

⚠️ **IMPORTANTE:** Esta versión requiere configuración manual de secretos.

- `.env` ya no contiene valores por defecto
- `CORS_ORIGIN` debe ser configurado explícitamente
- Backend no iniciará sin `JWT_SECRET` válido

## Notas de Seguridad

- ✅ Todos los secretos removidos del repositorio
- ✅ CORS restrictivo por defecto en producción
- ✅ Dockerfiles con usuarios no-root
- ✅ Healthchecks en todos los servicios
- ✅ Logs de producción implementados

---

**Versión:** 1.1.0  
**Fecha:** 2026-01-30  
**Autor:** Katrix Software
