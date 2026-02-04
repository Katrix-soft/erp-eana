# 🔒 Guía de Seguridad - ERP EANA

## 📋 Tabla de Contenidos

- [Configuración Inicial](#configuración-inicial)
- [Secretos y Variables de Entorno](#secretos-y-variables-de-entorno)
- [CORS y Políticas de Origen](#cors-y-políticas-de-origen)
- [Autenticación y Autorización](#autenticación-y-autorización)
- [Rate Limiting](#rate-limiting)
- [Headers de Seguridad](#headers-de-seguridad)
- [Base de Datos](#base-de-datos)
- [Logs y Auditoría](#logs-y-auditoría)
- [Checklist de Seguridad](#checklist-de-seguridad)

## 🔐 Configuración Inicial

### Generar Secretos Seguros

**JWT Secret:**
```bash
# Opción 1: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Opción 2: OpenSSL
openssl rand -hex 32

# Opción 3: PowerShell (Windows)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**Password de PostgreSQL:**
```bash
# Generar password seguro
openssl rand -base64 32
```

### Configurar Variables de Entorno

1. **Root `.env`:**
```env
JWT_SECRET=<tu_secret_generado>
GEMINI_API_KEY=<tu_api_key>
NODE_ENV=production
```

2. **Backend `.env`:**
```env
# Database
POSTGRES_PASSWORD=<password_seguro_generado>

# CORS - Especificar dominios exactos
CORS_ORIGIN=https://tu-dominio.com,https://www.tu-dominio.com

# JWT (mismo que root)
JWT_SECRET=<tu_secret_generado>

# Mail
MAIL_PASS=<password_seguro>
```

## 🌐 CORS y Políticas de Origen

### Configuración por Ambiente

**Desarrollo:**
```env
CORS_ORIGIN=http://localhost:4200,http://localhost:8080
```

**Producción:**
```env
# ✅ CORRECTO - Dominios específicos
CORS_ORIGIN=https://cns.eana.com.ar,https://www.cns.eana.com.ar

# ❌ INCORRECTO - Muy permisivo
CORS_ORIGIN=*
```

### Verificar Configuración CORS

```bash
# Test desde consola
curl -H "Origin: https://tu-dominio.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://localhost:3000/api/v1/auth/login
```

## 🔑 Autenticación y Autorización

### JWT Configuration

- **Expiración:** 24 horas (configurable)
- **Refresh Tokens:** Implementado
- **Algoritmo:** HS256
- **Secret:** Mínimo 32 bytes

### Roles y Permisos

```typescript
enum UserRole {
  ADMIN = 'admin',           // Acceso total
  SUPERVISOR = 'supervisor', // Gestión de equipos
  TECNICO = 'tecnico'       // Solo lectura y asignaciones
}
```

### Protección de Rutas

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
async sensitiveOperation() {
  // Solo admins pueden ejecutar
}
```

## 🚦 Rate Limiting

### Configuración Actual

**Login:**
- 5 intentos por 5 minutos
- Bloqueo progresivo: 5min → 15min → 30min → 1h → 2h

**API General:**
- 100 requests por minuto por IP
- 1000 requests por hora por usuario

### Personalizar Rate Limits

```typescript
// En el controlador
@Throttle({ default: { limit: 10, ttl: 60000 } })
async endpoint() {
  // Máximo 10 requests por minuto
}
```

## 🛡️ Headers de Seguridad

### Helmet.js

Configurado automáticamente con:

- **X-Frame-Options:** DENY
- **X-Content-Type-Options:** nosniff
- **X-XSS-Protection:** 1; mode=block
- **Referrer-Policy:** strict-origin-when-cross-origin
- **Content-Security-Policy:** Configurado

### CSP (Content Security Policy)

```nginx
# En nginx.conf
add_header Content-Security-Policy "
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: blob: https://images.unsplash.com;
  connect-src 'self' ws: wss:;
";
```

## 🗄️ Base de Datos

### Seguridad PostgreSQL

**Configuración Recomendada:**

```yaml
# docker-compose.yml
postgres:
  environment:
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD} # Nunca hardcodear
    POSTGRES_INITDB_ARGS: "-E UTF8 --locale=es_AR.UTF-8"
  # No exponer puerto en producción
  # ports:
  #   - "5432:5432"
```

### Prevención de SQL Injection

- ✅ Usar TypeORM con parámetros
- ✅ Validar entrada con class-validator
- ❌ Nunca concatenar strings en queries

```typescript
// ✅ CORRECTO
await repository.findOne({ where: { id: userId } });

// ❌ INCORRECTO
await repository.query(`SELECT * FROM users WHERE id = ${userId}`);
```

### Backups Automáticos

```bash
# Script de backup diario
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec cns_postgres pg_dump -U postgres cns_db > backup_$DATE.sql
```

## 📊 Logs y Auditoría

### Logs de Producción

Los logs se guardan en `./logs/`:

- `app-YYYY-MM-DD.log` - Logs generales
- `error-YYYY-MM-DD.log` - Solo errores

### Auditoría de Operaciones

Todas las operaciones críticas se registran:

```typescript
@AuditLog('USER_CREATED')
async createUser(data: CreateUserDto) {
  // Automáticamente registrado
}
```

### Qué se Audita

- ✅ Login/Logout
- ✅ Cambios en usuarios
- ✅ Modificaciones de equipos
- ✅ Cambios de configuración
- ✅ Intentos de acceso no autorizado

## ✅ Checklist de Seguridad

### Antes de Desplegar

- [ ] JWT_SECRET generado aleatoriamente (mínimo 32 bytes)
- [ ] POSTGRES_PASSWORD cambiado del valor por defecto
- [ ] GEMINI_API_KEY configurado
- [ ] CORS_ORIGIN configurado con dominios específicos
- [ ] MAIL_PASS configurado
- [ ] Archivos `.env` en `.gitignore`
- [ ] HTTPS configurado (certificados SSL)
- [ ] Firewall configurado (solo puertos 80, 443, 22)
- [ ] Backups automáticos configurados
- [ ] Logs monitoreados

### Verificación de Seguridad

```bash
# Ejecutar script de verificación
./check-production.sh   # Linux/Mac
./check-production.ps1  # Windows
```

### Auditoría Regular

**Mensual:**
- [ ] Revisar logs de errores
- [ ] Verificar intentos de login fallidos
- [ ] Actualizar dependencias (`npm audit`)
- [ ] Revisar usuarios activos

**Trimestral:**
- [ ] Rotar JWT_SECRET
- [ ] Cambiar passwords de servicios
- [ ] Revisar permisos de usuarios
- [ ] Actualizar certificados SSL

## 🚨 Respuesta a Incidentes

### Detección de Ataque

**Señales de alerta:**
- Múltiples intentos de login fallidos
- Requests desde IPs sospechosas
- Patrones inusuales en logs
- Errores 401/403 en masa

### Acciones Inmediatas

1. **Bloquear IP:**
```bash
# Temporalmente en firewall
sudo ufw deny from <IP_SOSPECHOSA>
```

2. **Revisar Logs:**
```bash
# Ver últimos errores
docker compose logs backend | grep ERROR

# Ver intentos de login
docker compose logs backend | grep "login"
```

3. **Rotar Secretos:**
```bash
# Generar nuevo JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Actualizar .env y reiniciar
docker compose restart backend
```

## 📚 Recursos Adicionales

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NestJS Security](https://docs.nestjs.com/security/authentication)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)

## 📞 Contacto de Seguridad

Para reportar vulnerabilidades:
- Email: security@katrix.com
- Respuesta esperada: 24-48 horas

---

**Última actualización:** 2026-01-30  
**Versión:** 1.0.0
