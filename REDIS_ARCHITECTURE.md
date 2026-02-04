# 🚀 Arquitectura Redis - Cache & Security

## 📋 Tabla de Contenidos
1. [Arquitectura General](#arquitectura-general)
2. [Configuración](#configuración)
3. [Uso del Cache](#uso-del-cache)
4. [Rate Limiting](#rate-limiting)
5. [Buenas Prácticas](#buenas-prácticas)
6. [Troubleshooting](#troubleshooting)

---

## 🏗️ Arquitectura General

### Componentes

```
┌─────────────────────────────────────────────────────────┐
│                     Backend (NestJS)                     │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ AuthService │  │ Other Service │  │ TypeORM Query│  │
│  │  + Cache    │  │   + Cache     │  │   Cache      │  │
│  └──────┬──────┘  └───────┬──────┘  └───────┬──────┘  │
│         │                  │                  │          │
│         └──────────────────┴──────────────────┘          │
│                            │                             │
│                   ┌────────▼────────┐                   │
│                   │  CacheService   │                   │
│                   │  RateLimiter    │                   │
│                   └────────┬────────┘                   │
└────────────────────────────┼─────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │     Redis       │
                    │  (In-Memory)    │
                    │  Max: 128MB     │
                    │  No Persist     │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   PostgreSQL    │
                    │  (Fallback)     │
                    └─────────────────┘
```

### Flujo de Datos

1. **Request** → Controller → Service
2. **Service** → Intenta Cache (Redis)
3. Si **Cache HIT** → Retorna datos cacheados ✅
4. Si **Cache MISS** → Query a PostgreSQL → Cachea resultado → Retorna
5. Si **Redis FALLA** → Fallback directo a PostgreSQL (sin error)

---

## ⚙️ Configuración

### Docker Compose

```yaml
services:
  redis:
    image: redis:7-alpine
    container_name: cns_redis
    restart: always
    command: >
      redis-server
      --maxmemory 128mb
      --maxmemory-policy allkeys-lru
      --save ""
      --appendonly no
      --loglevel warning
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3
```

### Variables de Entorno (.env)

```bash
# Redis Configuration
REDIS_HOST=localhost          # redis (en Docker)
REDIS_PORT=6379
REDIS_TTL=300                 # TTL default: 5 minutos
CACHE_ENABLED=true            # Habilitar/deshabilitar cache
```

---

## 💾 Uso del Cache

### 1. Inyectar CacheService

```typescript
import { Injectable } from '@nestjs/common';
import { CacheService } from './cache/cache.service';

@Injectable()
export class MyService {
    constructor(private cacheService: CacheService) {}
}
```

### 2. Métodos Principales

#### **getOrSet** (Recomendado)
Obtiene del cache o ejecuta factory si no existe.

```typescript
async getUsuario(id: number) {
    return this.cacheService.getOrSet(
        `user:${id}`,               // Key
        async () => {                // Factory function
            return this.userRepo.findOne({ where: { id } });
        },
        300                          // TTL: 5 minutos (opcional)
    );
}
```

#### **set**
Guardar en cache explícitamente.

```typescript
await this.cacheService.set('my-key', dataObject, 600); // 10 minutos
```

#### **get**
Obtener del cache.

```typescript
const data = await this.cacheService.get<User>('user:123');
if (!data) {
    // Cache miss - consultar DB
}
```

#### **del**
Eliminar del cache (invalidación).

```typescript
await this.cacheService.del('user:123');
```

### 3. Cachear TypeORM Queries

TypeORM tiene cache nativo integrado con Redis:

```typescript
// En cualquier query
const users = await this.userRepository.find({
    where: { active: true },
    cache: true,              // Usa TTL default (60s)
});

// O con TTL personalizado
const users = await this.userRepository.find({
    where: { active: true },
    cache: 120000,            // 2 minutos (en ms)
});

// Con cache key personalizada
const users = await this.userRepository.find({
    where: { role: 'admin' },
    cache: {
        id: 'admin-users',    // Key única
        milliseconds: 300000  // 5 minutos
    }
});
```

### 4. Ejemplo Completo: Service con Cache

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CacheService } from '../cache/cache.service';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private userRepo: Repository<User>,
        private cache: CacheService
    ) {}

    // ✅ Con cache automático
    async findOne(id: number): Promise<User> {
        return this.cache.getOrSet(
            `user:${id}`,
            () => this.userRepo.findOne({ where: { id } }),
            300 // 5 minutos
        );
    }

    // ✅ Invalidar cache al actualizar
    async update(id: number, data: Partial<User>): Promise<User> {
        const user = await this.userRepo.update(id, data);
        
        // Invalidar cache
        await this.cache.del(`user:${id}`);
        
        return this.findOne(id);
    }

    // ✅ TypeORM cache nativo
    async findAllActive(): Promise<User[]> {
        return this.userRepo.find({
            where: { active: true },
            cache: 60000 // 1 minuto
        });
    }
}
```

---

## 🛡️ Rate Limiting

### 1. Inyectar RateLimiterService

```typescript
import { Injectable } from '@nestjs/common';
import { RateLimiterService } from './cache/rate-limiter.service';

@Injectable()
export class AuthService {
    constructor(private rateLimiter: RateLimiterService) {}
}
```

### 2. Verificar Rate Limit

```typescript
async login(credentials: LoginDto, ip: string) {
    // Verificar rate limit
    const check = await this.rateLimiter.check(
        ip,                          // Identificador (IP, username, etc)
        'login',                     // Acción
        {
            maxAttempts: 5,          // Máximo 5 intentos
            windowSeconds: 300,      // En 5 minutos
            blockSeconds: 300        // Bloqueo de 5 min (opcional)
        }
    );

    if (!check.allowed) {
        throw new UnauthorizedException({
            message: 'Too many login attempts',
            retryAfter: check.retryAfter
        });
    }

    // ... resto del login
    
    // Si login falla
    if (!validCredentials) {
        await this.rateLimiter.recordFailure(ip, 'login');
        throw new UnauthorizedException('Invalid credentials');
    }

    // Si login exitoso, limpiar contadores
    await this.rateLimiter.recordSuccess(ip, 'login');
    
    return { token: '...' };
}
```

### 3. Bloqueo Progresivo

El rate limiter tiene bloqueo progresivo automático:

- 1er bloqueo: 5 minutos
- 2do bloqueo: 10 minutos
- 3er bloqueo: 20 minutos
- ...
- Máximo: 2 horas

### 4. Obtener Estado

```typescript
const status = await this.rateLimiter.getStatus(ip, 'login');
console.log(status);
// {
//   attempts: 3,
//   blocked: false
// }
```

### 5. Resetear Manualmente (Admin)

```typescript
await this.rateLimiter.reset(ip, 'login');
```

---

## ✨ Buenas Prácticas

### 1. **Qué Cachear**

✅ **SÍ cachear:**
- Perfiles de usuario (sin password)
- Roles y permisos
- Configuración del sistema
- Catálogos estáticos (aeropuertos, FIRs)
- Queries repetitivas
- Resultados de búsquedas

❌ **NO cachear:**
- Passwords
- Tokens JWT/Refresh
- Datos financieros críticos
- Información en tiempo real
- Datos PII sensibles

### 2. **TTL Recomendados**

```typescript
// Datos sensibles (usuario, roles)
TTL: 300s (5 minutos)

// Catálogos estáticos
TTL: 3600s (1 hora)

// Configuración del sistema
TTL: 1800s (30 minutos)

// Queries pesadas
TTL: 60s (1 minuto)

// Rate limiting
TTL: 300s (5 minutos)
```

### 3. **Invalidación de Cache**

```typescript
// Al actualizar un recurso
async updateUser(id: number, data: UpdateUserDto) {
    await this.userRepo.update(id, data);
    
    // 🔥 Invalidar cache relacionado
    await this.cache.del(`user:${id}`);
    await this.cache.del(`user:${id}:profile`);
    await this.cache.del(`user:${id}:permissions`);
    
    return this.findOne(id);
}
```

### 4. **Patrones de Keys**

Usar nomenclatura consistente:

```typescript
`user:${id}`                    // Usuario por ID
`user:${id}:profile`            // Perfil de usuario
`user:${email}:exists`          // Verificación
`ratelimit:login:${ip}`         // Rate limiting
`config:system`                 // Configuración global
`catalog:airports`              // Catálogos
```

### 5. **Manejo de Errores**

El CacheService ya maneja errores y hace fallback automático:

```typescript
// ✅ CORRECTO - No necesitas try/catch
const user = await this.cache.getOrSet(key, factory);

// ❌ INCORRECTO - No hace falta
try {
    const user = await this.cache.getOrSet(key, factory);
} catch (e) {
    // Nunca se ejecutará
}
```

### 6. **Optimización de Recursos**

```typescript
// ✅ Cache queries pesadas
const stats = await this.statsRepo
    .createQueryBuilder('stats')
    .where('date > :date', { date: lastWeek })
    .cache('weekly-stats', 3600000) // 1 hora
    .getMany();

// ✅ Limitar tamaño de resultados cacheados
const users = await this.cache.getOrSet(
    'active-users',
    async () => {
        return this.userRepo.find({
            where: { active: true },
            select: ['id', 'email', 'role'] // Solo campos necesarios
        });
    }
);
```

### 7. **Monitoreo**

Los logs están instrumentados:

```
[Cache] ✅ HIT: user:123
[Cache] 🔍 MISS: user:456
[Cache] 💾 SET: config:system
[Cache] 🗑️ DELETE: user:123
[RateLimit] ✅ ALLOWED: 192.168.1.1 (4 attempts left)
[RateLimit] 🚫 BLOCKED: 192.168.1.2 (300s retry)
```

---

## 🔧 Troubleshooting

### Redis no conecta

**Síntoma:**
```
[Cache] ❌ Redis connection failed, using in-memory cache
```

**Solución:**
1. Verificar que Redis esté corriendo: `docker ps | grep redis`
2. Verificar variables de entorno: `REDIS_HOST`, `REDIS_PORT`
3. El sistema seguirá funcionando con fallback a memoria

### Cache no se actualiza

**Síntoma:** Datos viejos en respuestas

**Solución:**
```typescript
// Opción 1: Invalidar cache explícitamente
await this.cache.del(`user:${id}`);

// Opción 2: Reducir TTL
await this.cache.set(key, data, 60); // 1 minuto

// Opción 3: Limpiar todo (desarrollo)
await this.cache.reset();
```

### Rate limit bloqueando usuarios legítimos

**Síntoma:** Usuarios reportan "Too many attempts"

**Solución:**
```typescript
// Resetear manualmente
await this.rateLimiter.reset(ip, 'login');

// O ajustar configuración
const check = await this.rateLimiter.check(ip, 'login', {
    maxAttempts: 10,     // Aumentar límite
    windowSeconds: 600,  // Ventana más amplia
});
```

### Alto consumo de memoria

**Síntoma:** Redis usando >128MB

**Solución:**
1. Redis está configurado con `maxmemory 128mb` y `allkeys-lru`
2. Automáticamente elimina keys viejas
3. Revisar TTLs muy largos
4. Verificar tamaño de objetos cacheados

### TypeORM cache no funciona

**Síntoma:** Queries no se cachean

**Solución:**
```typescript
// Verificar que cache esté habilitado en app.module.ts
cache: {
    type: 'redis',
    options: { ... },
    ignoreErrors: true,
}

// Asegurar que la query tenga cache: true
const users = await this.userRepo.find({
    cache: true  // ← IMPORTANTE
});
```

---

## 📊 Métricas de Rendimiento Esperadas

Con esta arquitectura en producción:

- **Reducción de queries a PostgreSQL:** 60-80%
- **Tiempo de respuesta de login:** <100ms (con cache)
- **Bloqueo de ataques brute-force:** 100% efectivo
- **Disponibilidad:** 99.9% (con fallback automático)
- **Uso de RAM (Redis):** <128MB
- **Overhead de red:** Mínimo (<1ms local)

---

## 📚 Referencias

- [NestJS Cache Manager](https://docs.nestjs.com/techniques/caching)
- [TypeORM Caching](https://typeorm.io/caching)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
- [cache-manager-redis-yet](https://github.com/node-cache-manager/node-cache-manager-redis-yet)

---

**🎯 Resultado:** Sistema robusto, seguro y performante con cache inteligente y protección contra ataques, manteniendo alta disponibilidad incluso si Redis falla.
