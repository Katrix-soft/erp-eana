# 🚀 ERP EANA - Sistema de Gestión CNS

Sistema integral de gestión para la Empresa Argentina de Navegación Aérea (EANA), especializado en la administración de equipamiento CNS (Comunicaciones, Navegación y Vigilancia).

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Arquitectura](#-arquitectura)
- [Tecnologías](#-tecnologías)
- [Requisitos](#-requisitos)
- [Instalación](#-instalación)
- [Ejecución](#-ejecución)
- [Documentación](#-documentación)
- [Seguridad](#-seguridad)

## ✨ Características

### Gestión de Equipamiento
- **VHF**: Administración completa de equipos VHF
- **Navegación**: Gestión de equipos de navegación (VOR, DME, ILS)
- **Vigilancia**: Control de sistemas de vigilancia
- **Energía**: Monitoreo de sistemas de energía

### Sistema de Usuarios
- Autenticación JWT con rate limiting
- Roles y permisos (Admin, Técnico, Supervisor)
- Gestión de perfiles por FIR y aeropuerto
- Recuperación de contraseña

### Checklists y Mantenimiento
- Creación de checklists personalizados
- Asignación por técnico y equipo
- Seguimiento de estado
- Historial de mantenimiento

### Comunicación
- Sistema de notificaciones en tiempo real (WebSocket)
- Chat interno entre técnicos
- Foro técnico por temas

### Reportes y Auditoría
- Dashboard con métricas en tiempo real
- Auditoría de todas las operaciones
- Exportación de reportes (PDF, Excel)
- Gráficos y estadísticas

## 🏗️ Arquitectura

```
┌─────────────────┐
│    Frontend     │  Angular 17 + PrimeNG
│   (Port 5173)   │  
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│      Nginx      │  Reverse Proxy
│   (Port 80)     │  
└────────┬────────┘
         │
         ↓
┌─────────────────┐      ┌─────────────┐
│     Backend     │◄────►│    Redis    │  Cache & Rate Limiting
│   (Port 3000)   │      │ (Port 6379) │  
│   NestJS API    │      └─────────────┘
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   PostgreSQL    │  Base de Datos
│   (Port 5434)   │  
└─────────────────┘
```

## 🛠️ Tecnologías

### Backend
- **Framework**: NestJS (Node.js)
- **Base de Datos**: PostgreSQL 15
- **ORM**: TypeORM
- **Cache**: Redis 7
- **Autenticación**: JWT + Passport
- **WebSockets**: Socket.io
- **Documentación**: Swagger/OpenAPI
- **Seguridad**: Helmet, Rate Limiting, CORS

### Frontend
- **Framework**: Angular 17
- **UI Library**: PrimeNG
- **State Management**: RxJS
- **HTTP Client**: Angular HttpClient
- **WebSockets**: Socket.io-client
- **Gráficos**: Chart.js

### DevOps
- **Containerización**: Docker + Docker Compose
- **Proxy**: Nginx
- **CI/CD**: GitHub Actions (opcional)

## 📦 Requisitos

- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Node.js**: 18+ (solo para desarrollo local)
- **Git**: 2.30+

### Recursos Mínimos
- **CPU**: 1 vCPU
- **RAM**: 2 GB
- **Disco**: 10 GB

## 🚀 Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/Katrix-soft/erp-eana.git
cd erp-eana
```

### 2. Configurar variables de entorno

⚠️ **IMPORTANTE:** Nunca usar los valores por defecto en producción.

#### Generar Secretos Seguros

```bash
# Generar JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# O con OpenSSL
openssl rand -hex 32
```

#### Root (.env)
```bash
cp .env.example .env
```

Editar `.env` con tus valores:
```env
JWT_SECRET=<tu_secret_generado_aqui>
GEMINI_API_KEY=<tu_api_key_de_gemini>
NODE_ENV=production
```

#### Backend (.env)
```bash
cd backend
cp .env.example .env
```

Editar `backend/.env`:
```env
# Database
POSTGRES_PASSWORD=<password_seguro_generado>

# CORS - Especificar dominios exactos en producción
CORS_ORIGIN=https://tu-dominio.com,https://www.tu-dominio.com

# JWT (mismo que root/.env)
JWT_SECRET=<tu_secret_generado_aqui>

# Gemini
GEMINI_API_KEY=<tu_api_key_de_gemini>

# Mail
MAIL_PASS=<password_seguro>
```

### 3. Verificar Configuración

```bash
# Linux/Mac
./check-production.sh

# Windows
./check-production.ps1
```

## 🎯 Ejecución

### Desarrollo con Docker (Recomendado)

```bash
# Iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down
```

### Producción con Docker

```bash
# Usar docker-compose optimizado para producción
docker compose -f docker-compose.prod.yml up -d

# Ver logs
docker compose -f docker-compose.prod.yml logs -f

# Detener
docker compose -f docker-compose.prod.yml down
```

📚 **Ver [DEPLOYMENT.md](./DEPLOYMENT.md) para guía completa de deployment en producción**

### Acceso a los Servicios

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Docs**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/health

### Credenciales por Defecto

```
Usuario: admin
Contraseña: admin123
```

### Desarrollo Local (Sin Docker)

#### Backend
```bash
cd backend
npm install
npm run start:dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📚 Documentación

### API Documentation
La documentación completa de la API está disponible en Swagger UI:
- **URL**: http://localhost:3000/api/docs
- **Formato**: OpenAPI 3.0

### Guías Adicionales
- [🚀 Deployment en Producción](./DEPLOYMENT.md) - Guía completa de deployment
- [🔒 Seguridad](./SECURITY.md) - Mejores prácticas de seguridad
- [📝 Changelog de Producción](./CHANGELOG_PRODUCTION.md) - Últimas mejoras
- [💾 Integración de Redis](./REDIS_INTEGRATION.md) - Configuración de caché
- [🏗️ Arquitectura Redis](./REDIS_ARCHITECTURE.md) - Arquitectura detallada

## 🔒 Seguridad

### Características Implementadas

#### Autenticación y Autorización
- ✅ JWT con expiración configurable
- ✅ Refresh tokens
- ✅ Roles y permisos granulares
- ✅ Recuperación de contraseña segura

#### Rate Limiting
- ✅ Protección contra brute-force
- ✅ Límite de 5 intentos de login en 5 minutos
- ✅ Bloqueo progresivo (5min → 15min → 30min → 1h → 2h)
- ✅ Rate limiting por IP y usuario

#### Cache Seguro
- ✅ Redis para cache distribuido
- ✅ TTL corto para datos sensibles (5 minutos)
- ✅ No se cachean passwords ni tokens
- ✅ Fallback automático a memoria

#### Headers de Seguridad
- ✅ Helmet.js configurado
- ✅ CORS restrictivo
- ✅ CSP (Content Security Policy)
- ✅ HSTS (HTTP Strict Transport Security)

#### Auditoría
- ✅ Logging de todas las operaciones
- ✅ Registro de intentos de login
- ✅ Trazabilidad de cambios
- ✅ Monitoreo de accesos

### Mejores Prácticas
- Contraseñas hasheadas con bcrypt (10 rounds)
- Validación de entrada en todos los endpoints
- Sanitización de datos
- Protección contra SQL injection (TypeORM)
- Protección contra XSS
- Secrets en variables de entorno

## 🧪 Testing

### Backend
```bash
cd backend
npm run test          # Unit tests
npm run test:e2e      # E2E tests
npm run test:cov      # Coverage
```

### Verificar Redis
```bash
cd backend
npm run test:redis    # Script personalizado
```

## 🔧 Comandos Útiles

### Docker
```bash
# Rebuild completo
docker-compose up --build

# Ver logs de un servicio específico
docker-compose logs -f backend

# Acceder a un contenedor
docker exec -it cns_backend sh

# Limpiar todo
docker-compose down -v
```

### Base de Datos
```bash
# Backup
docker exec cns_postgres pg_dump -U postgres cns_db > backup.sql

# Restore
docker exec -i cns_postgres psql -U postgres cns_db < backup.sql
```

### Redis
```bash
# Conectar a Redis CLI
docker exec -it cns_redis redis-cli

# Ver todas las keys
docker exec -it cns_redis redis-cli KEYS '*'

# Flush cache
docker exec -it cns_redis redis-cli FLUSHALL
```

## 📊 Monitoreo

### Health Checks
- **Backend**: http://localhost:3000/health
- **Redis**: `docker exec cns_redis redis-cli ping`
- **PostgreSQL**: `docker exec cns_postgres pg_isready`

### Métricas
- Memoria del sistema
- Uptime
- Conexiones a DB
- Cache hit/miss ratio
- Rate limit stats

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📝 Licencia

Este proyecto es propiedad de EANA (Empresa Argentina de Navegación Aérea).

## 👥 Equipo

- **Desarrollo**: Katrix Software
- **Cliente**: EANA

## 📞 Soporte

Para soporte técnico, contactar a:
- Email: soporte@katrix.com
- Documentación: http://localhost:3000/api/docs

---

**Versión**: 1.0.0  
**Última actualización**: 2026-01-29

