# 🚀 Guía de Instalación - Redis Cache & Security

## 📦 1. Instalar Dependencias

```bash
cd backend
npm install
```

Esto instalará automáticamente:
- `@nestjs/cache-manager@^2.1.1`
- `cache-manager@^5.2.4`
- `cache-manager-redis-yet@^4.1.2`

## 🐳 2. Levantar Docker Compose

Desde la raíz del proyecto:

```bash
# Detener contenedores actuales
docker-compose down

# Reconstruir con Redis incluido
docker-compose up -d --build

# Verificar que Redis esté corriendo
docker ps | grep redis
```

Deberías ver algo como:
```
cns_redis    redis:7-alpine   "redis-server --max…"   Up   6379/tcp
```

## 🔍 3. Verificar Conexión a Redis

```bash
# Conectar a Redis CLI
docker exec -it cns_redis redis-cli

# Dentro de Redis CLI:
127.0.0.1:6379> ping
PONG

127.0.0.1:6379> info memory
# Debería mostrar stats de memoria

127.0.0.1:6379> exit
```

## 🔧 4. Configuración Local (Desarrollo)

Tu archivo `.env` ya debería contener:

```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_TTL=300
CACHE_ENABLED=true
```

## ✅ 5. Verificar que Funciona

### Opción A: Ver logs al iniciar

```bash
npm run start:dev
```

Deberías ver en los logs:
```
[Cache] 🔗 Connecting to Redis at localhost:6379
[Cache] ✅ Redis connected successfully
```

### Opción B: Hacer login y verificar

1. Inicia el backend:
```bash
npm run start:dev
```

2. Haz login desde el frontend o Postman:
```bash
POST http://localhost:3000/auth/login
{
  "email": "admin@eana.com",
  "password": "tu_password"
}
```

3. En los logs deberías ver:
```
[Auth] 🔐 Login attempt for: admin@eana.com from ::1
[RateLimit] ✅ ALLOWED: ::1 for login (4 attempts left)
[Auth] ✅ User validated: admin@eana.com, ID: 1, Role: admin
[Cache] 💾 SET: user:1:profile
[Auth] 🔑 Generating JWT...
[Auth] ✅ Login successful for admin@eana.com
```

4. Si haces login de nuevo, deberías ver cache hit:
```
[Auth] 📦 Profile from cache for user 1
```

## 🧪 6. Probar Rate Limiting

Intenta hacer login con credenciales incorrectas 5 veces seguidas:

```bash
# 1er intento
POST /auth/login { email: "test", password: "wrong" }
# Response: 401 Unauthorized

# 2do intento
POST /auth/login { email: "test", password: "wrong" }
# Response: 401 Unauthorized

# ... (3ro, 4to, 5to intento)

# 6to intento
POST /auth/login { email: "test", password: "wrong" }
# Response: 429 Too Many Requests
# {
#   "message": "Demasiados intentos de inicio de sesión",
#   "retryAfter": 300,
#   "blocked": true
# }
```

En los logs verás:
```
[RateLimit] 🚫 BLOCKED: ::1 for login (300s remaining)
```

## 📊 7. Monitorear Redis

### Ver keys activas:
```bash
docker exec -it cns_redis redis-cli

# Ver todas las keys
127.0.0.1:6379> KEYS *

# Ejemplo de salida:
# 1) "user:1:profile"
# 2) "ratelimit:login:192.168.1.10"
# 3) "catalog:airports:all"
```

### Ver estadísticas:
```bash
127.0.0.1:6379> INFO stats
# Muestra hits, misses, comandos ejecutados, etc.

127.0.0.1:6379> INFO memory
# Muestra uso de memoria actual
```

### Limpiar cache (desarrollo):
```bash
127.0.0.1:6379> FLUSHALL
OK
```

## 🚨 8. Troubleshooting

### Problema: "Cannot connect to Redis"

**Solución 1:** Verificar que Redis esté corriendo
```bash
docker ps | grep redis
# Si no aparece:
docker-compose up -d redis
```

**Solución 2:** Verificar puerto
```bash
docker port cns_redis
# Debería mostrar: 6379/tcp -> 0.0.0.0:6379
```

**Solución 3:** Verificar variables de entorno
```bash
echo $REDIS_HOST   # O ver en .env
echo $REDIS_PORT
```

### Problema: "Redis connected" pero cache no funciona

**Solución:** Verificar que `CACHE_ENABLED=true` en `.env`

```bash
# En backend/.env
CACHE_ENABLED=true
```

### Problema: Lint errors "Cannot find module"

**Solución:** Reinstalar dependencias
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Problema: Rate limiting no funciona

**Solución:** Verificar que estés pasando la IP en el controller

```typescript
// ✅ Correcto
async login(@Body() dto: LoginDto, @Ip() ip: string) {
    return this.authService.login(dto, ip);
}

// ❌ Incorrecto
async login(@Body() dto: LoginDto) {
    return this.authService.login(dto); // IP será undefined
}
```

## 🎯 9. Próximos Pasos

### Customizar TTLs según tus necesidades:

```typescript
// En cache.service.ts o donde uses cache

// Datos que casi nunca cambian
TTL: 3600 (1 hora)

// Perfiles de usuario
TTL: 300 (5 minutos)

// Búsquedas/queries
TTL: 60 (1 minuto)

// Rate limiting
TTL: 300 (5 minutos)
```

### Agregar cache a otros servicios:

Ver ejemplos en: `backend/src/cache/EXAMPLES.ts`

### Monitorear en producción:

```bash
# Ver logs de cache
docker logs cns_backend | grep Cache

# Ver logs de rate limiting
docker logs cns_backend | grep RateLimit
```

## 📚 10. Recursos Adicionales

- **Arquitectura completa:** `REDIS_ARCHITECTURE.md` (raíz del proyecto)
- **Ejemplos de uso:** `backend/src/cache/EXAMPLES.ts`
- **TypeORM Cache:** https://typeorm.io/caching
- **NestJS Cache:** https://docs.nestjs.com/techniques/caching

---

## ✅ Checklist de Instalación

- [ ] Dependencias instaladas (`npm install`)
- [ ] Docker Compose actualizado (incluye Redis)
- [ ] Redis corriendo (`docker ps | grep redis`)
- [ ] Variables `.env` configuradas
- [ ] Backend inicia sin errores
- [ ] Login funciona con cache (ver logs)
- [ ] Rate limiting funciona (probar 5+ intentos fallidos)
- [ ] Cache se invalida correctamente (update de datos)

**🎉 Si todo está ✅ arriba, la arquitectura Redis está funcionando correctamente!**
