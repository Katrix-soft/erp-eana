# ============================================
# EANA ERP - Deployment Guide
# ============================================

## 📋 Pre-requisitos

- Servidor con Docker y Docker Compose instalados
- Dominio configurado (opcional para producción)
- Certificados SSL (para HTTPS en producción)
- Acceso SSH al servidor

## 🚀 Deployment en Producción

### 1. Preparar el Servidor

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo apt install docker-compose-plugin -y

# Verificar instalación
docker --version
docker compose version
```

### 2. Clonar el Repositorio

```bash
# Clonar proyecto
git clone https://github.com/Katrix-soft/erp-eana.git
cd erp-eana
```

### 3. Configurar Variables de Entorno

```bash
# Copiar template
cp .env.example .env

# Editar con valores de producción
nano .env
```

**Configuración recomendada para .env:**

```env
# Generar JWT_SECRET seguro
JWT_SECRET=$(openssl rand -hex 32)

# Configurar API Key de Gemini
GEMINI_API_KEY=tu_api_key_real

# Ambiente
NODE_ENV=production
```

### 4. Configurar Backend

```bash
cd backend
cp .env.example .env
nano .env
```

**Configuración backend/.env:**

```env
PORT=3000
NODE_ENV=production

# Database
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=CAMBIAR_PASSWORD_SEGURO
POSTGRES_DB=cns_db

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_TTL=300
CACHE_ENABLED=true

# JWT (usar el mismo del root .env)
JWT_SECRET=tu_jwt_secret_aqui

# CORS (configurar con tu dominio)
CORS_ORIGIN=https://tu-dominio.com,https://www.tu-dominio.com

# Mail
MAIL_HOST=smtp.office365.com
MAIL_PORT=587
MAIL_USER=notificaciones-erp@eana.com.ar
MAIL_PASS=password_seguro
MAIL_DESTINATION=cns-nacional@eana.com.ar

# Frontend URL (para reset links)
FRONTEND_URL=https://tu-dominio.com

# Gemini
GEMINI_API_KEY=tu_api_key_real
```

### 5. Ajustar docker-compose.yml para Producción

Editar `docker-compose.yml` y actualizar:

```yaml
# Cambiar CORS_ORIGIN
CORS_ORIGIN: "https://tu-dominio.com"

# Cambiar passwords de PostgreSQL
POSTGRES_PASSWORD: password_seguro_aqui
```

### 6. Construir y Ejecutar

```bash
# Volver al directorio raíz
cd ..

# Construir imágenes
docker compose build --no-cache

# Iniciar servicios
docker compose up -d

# Ver logs
docker compose logs -f
```

### 7. Verificar Deployment

```bash
# Verificar que todos los servicios estén corriendo
docker compose ps

# Verificar health checks
curl http://localhost:3000/health
curl http://localhost:4200

# Ver logs de cada servicio
docker compose logs backend
docker compose logs frontend
docker compose logs postgres
docker compose logs redis
```

## 🔒 Configuración de Nginx Reverse Proxy (Opcional)

Si usas Nginx como reverse proxy en el host:

```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    
    # Redirigir a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tu-dominio.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Frontend
    location / {
        proxy_pass http://localhost:4200;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## 📊 Monitoreo

### Health Checks

```bash
# Backend health
curl http://localhost:3000/health

# Redis
docker exec cns_redis redis-cli ping

# PostgreSQL
docker exec cns_postgres pg_isready -U postgres
```

### Logs

```bash
# Ver todos los logs
docker compose logs -f

# Ver logs específicos
docker compose logs -f backend
docker compose logs -f frontend

# Ver últimas 100 líneas
docker compose logs --tail=100 backend
```

## 🔄 Actualización

```bash
# Detener servicios
docker compose down

# Actualizar código
git pull origin main

# Reconstruir
docker compose build --no-cache

# Iniciar
docker compose up -d
```

## 💾 Backup

### Base de Datos

```bash
# Backup
docker exec cns_postgres pg_dump -U postgres cns_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
docker exec -i cns_postgres psql -U postgres cns_db < backup.sql
```

### Archivos Subidos

```bash
# Backup de uploads
docker cp cns_backend:/app/uploads ./uploads_backup_$(date +%Y%m%d_%H%M%S)
```

## 🛡️ Seguridad

### Checklist de Seguridad

- [ ] JWT_SECRET generado con `openssl rand -hex 32`
- [ ] Passwords de PostgreSQL cambiados
- [ ] CORS_ORIGIN configurado con dominio específico
- [ ] HTTPS configurado con certificados válidos
- [ ] Firewall configurado (solo puertos 80, 443, 22)
- [ ] Backups automáticos configurados
- [ ] Logs monitoreados
- [ ] Rate limiting activo
- [ ] Variables de entorno no commiteadas

### Firewall

```bash
# Configurar UFW
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 🔧 Troubleshooting

### Servicios no inician

```bash
# Ver logs detallados
docker compose logs backend
docker compose logs frontend

# Verificar variables de entorno
docker compose config

# Reiniciar servicios
docker compose restart
```

### Base de datos no conecta

```bash
# Verificar que PostgreSQL esté corriendo
docker compose ps postgres

# Ver logs de PostgreSQL
docker compose logs postgres

# Conectar manualmente
docker exec -it cns_postgres psql -U postgres -d cns_db
```

### Redis no conecta

```bash
# Verificar Redis
docker compose ps redis

# Conectar a Redis CLI
docker exec -it cns_redis redis-cli ping
```

## 📞 Soporte

Para problemas o consultas:
- Email: soporte@katrix.com
- Documentación API: http://tu-servidor:3000/api/docs

---

**Última actualización:** 2026-01-30
