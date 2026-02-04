# ⚡ Buenas Prácticas para Producción - Redis Cache

## 🎯 Configuración Optimizada para Recursos Limitados

Tu servidor tiene **1 vCPU + 2GB RAM**, aquí está la configuración óptima:

### Redis Configuration (ya implementado)

```yaml
services:
  redis:
    command: >
      redis-server
      --maxmemory 128mb              # ✅ Máximo 128MB (6% del total)
      --maxmemory-policy allkeys-lru # ✅ Elimina keys menos usadas
      --save ""                      # ✅ Sin persistencia (más rápido)
      --appendonly no                # ✅ Sin AOF (más liviano)
      --loglevel warning             # ✅ Logs mínimos
    deploy:
      resources:
        limits:
          cpus: '0.3'                # ✅ Máximo 30% CPU
          memory: 150M               # ✅ Hard limit
        reservations:
          cpus: '0.1'                # ✅ Mínimo garantizado
          memory: 100M
```

**Resultado:** Redis usa ~100-128MB RAM y <10% CPU en producción normal.

---

## 🔐 Seguridad & Rate Limiting

### 1. Configuración de Rate Limits Recomendada

```typescript
// Login endpoints
{
    maxAttempts: 5,      // 5 intentos
    windowSeconds: 300,  // en 5 minutos
    blockSeconds: 300    // bloqueo de 5 minutos
}

// APIs públicas (búsqueda, consultas)
{
    maxAttempts: 20,     // 20 requests
    windowSeconds: 60,   // por minuto
    blockSeconds: 60     // bloqueo de 1 minuto
}

// Operaciones pesadas (export, reports)
{
    maxAttempts: 5,      // 5 operaciones
    windowSeconds: 3600, // por hora
    blockSeconds: 3600   // bloqueo de 1 hora
}

// Admin operations
{
    maxAttempts: 100,    // Más permisivo
    windowSeconds: 60,
    blockSeconds: 300
}
```

### 2. Monitoreo de Ataques

Agrega un endpoint para admins:

```typescript
@Controller('admin/security')
export class SecurityController {
    constructor(private rateLimiter: RateLimiterService) {}

    @Get('blocked-ips')
    @UseGuards(AdminGuard)
    async getBlockedIPs() {
        // Implementar: consultar Redis por keys "ratelimit:block:*"
        // Retornar lista de IPs bloqueadas con tiempo restante
    }

    @Post('unblock/:ip')
    @UseGuards(AdminGuard)
    async unblock(@Param('ip') ip: string) {
        await this.rateLimiter.reset(ip, 'login');
        return { success: true };
    }
}
```

---

## 💾 Estrategias de Cache por Tipo de Dato

### Catálogos Estáticos (Aeropuertos, FIRs, Puestos)

```typescript
// ✅ TTL LARGO: 1-4 horas
// Justificación: Cambian raramente, usados frecuentemente

async findAllAirports() {
    return this.cache.getOrSet(
        'catalog:airports',
        () => this.repo.find({ relations: ['fir'] }),
        3600 // 1 hora
    );
}

// Invalidación: Solo al importar/editar catálogos
async updateAirport(id, data) {
    await this.repo.update(id, data);
    await this.cache.del('catalog:airports'); // 🔥
}
```

### Perfiles de Usuario

```typescript
// ✅ TTL MEDIO: 5-10 minutos
// Justificación: Datos sensibles pero consultados frecuentemente

async getProfile(userId: number) {
    return this.cache.getOrSet(
        `user:${userId}:profile`,
        async () => {
            const user = await this.repo.findOne({ where: { id: userId } });
            const { password, resetToken, ...safe } = user;
            return safe; // ⚠️ NUNCA cachear passwords
        },
        300 // 5 minutos
    );
}
```

### Roles y Permisos

```typescript
// ✅ TTL MEDIO: 10-30 minutos
// Justificación: Verificación en cada request, puede tener lag

async getUserPermissions(userId: number) {
    return this.cache.getOrSet(
        `user:${userId}:permissions`,
        async () => {
            const user = await this.repo.findOne({
                where: { id: userId },
                relations: ['roles', 'roles.permissions']
            });
            return user.roles.flatMap(r => r.permissions.map(p => p.code));
        },
        600 // 10 minutos
    );
}

// Invalidación: Al cambiar roles del usuario
async updateUserRoles(userId, roleIds) {
    await this.userRolesRepo.delete({ userId });
    // ... asignar nuevos roles
    await this.cache.del(`user:${userId}:permissions`); // 🔥
}
```

### Dashboard & Stats

```typescript
// ✅ TTL CORTO: 30-60 segundos
// Justificación: Datos dinámicos, balance entre frescura y performance

async getDashboardStats() {
    return this.cache.getOrSet(
        'dashboard:stats',
        async () => {
            const [total, active, pending] = await Promise.all([
                this.repo.count(),
                this.repo.count({ where: { status: 'active' } }),
                this.repo.count({ where: { status: 'pending' } }),
            ]);
            return { total, active, pending };
        },
        60 // 1 minuto
    );
}
```

### Búsquedas/Queries Complejas

```typescript
// ✅ TypeORM Cache: 30-120 segundos
// Justificación: Queries pesadas que se repiten

async searchEquipos(filters: SearchDto) {
    const queryBuilder = this.repo.createQueryBuilder('equipo')
        .leftJoinAndSelect('equipo.aeropuerto', 'aeropuerto')
        .where('equipo.tipo = :tipo', { tipo: filters.tipo });

    if (filters.aeropuerto) {
        queryBuilder.andWhere('aeropuerto.id = :id', { id: filters.aeropuerto });
    }

    return queryBuilder
        .cache(`search:equipos:${JSON.stringify(filters)}`, 60000) // 1 min
        .getMany();
}
```

---

## 📊 Monitoreo en Producción

### 1. Logs a Vigilar

```bash
# Cache hits/misses
[Cache] ✅ HIT: user:123        # ← BUENO: Cache funcionando
[Cache] 🔍 MISS: user:456       # ← NORMAL: Primera consulta
[Cache] ❌ Error: ...            # ← ALERTA: Problemas con Redis

# Rate limiting
[RateLimit] ✅ ALLOWED: ...     # ← NORMAL
[RateLimit] 🚫 BLOCKED: ...     # ← ALERTA: Posible ataque

# Redis connection
[Cache] 🔗 Connecting...        # ← INICIO
[Cache] ✅ Redis connected      # ← OK
[Cache] ❌ Redis failed...      # ← ALERTA: Fallback a memoria
```

### 2. Métricas clave

```bash
# Conectar a Redis
docker exec -it cns_redis redis-cli

# Ver número de keys activas
127.0.0.1:6379> DBSIZE
(integer) 142  # ← Bueno: ~100-500 keys

# Ver memoria usada
127.0.0.1:6379> INFO memory | grep used_memory_human
used_memory_human:87.42M  # ← Bueno: <128MB

# Ver cache hits/misses
127.0.0.1:6379> INFO stats | grep keyspace
keyspace_hits:12450       # ← Bueno: Más hits que misses
keyspace_misses:3201

# Hit ratio = hits / (hits + misses)
# Objetivo: >70%
```

### 3. Alertas Recomendadas

```yaml
# Si usas Prometheus/Grafana o similar

Alert: RedisDown
Condition: Redis no responde por >30 segundos
Action: Notificar admin, sistema sigue con fallback

Alert: HighMemoryUsage
Condition: Redis usando >120MB por >5 minutos
Action: Revisar TTLs, posible memory leak

Alert: LowCacheHitRatio
Condition: Hit ratio <50% por >10 minutos
Action: Revisar TTLs, ajustar estrategia

Alert: BruteForceAttack
Condition: >10 IPs bloqueadas en 5 minutos
Action: Alerta de seguridad, revisar logs
```

---

## 🚀 Optimizaciones Avanzadas

### 1. Cache Warming (Pre-cargar cache crítico)

```typescript
@Injectable()
export class CacheWarmingService implements OnApplicationBootstrap {
    constructor(
        private cache: CacheService,
        private catalogService: CatalogService
    ) {}

    async onApplicationBootstrap() {
        console.log('[CacheWarming] 🔥 Warming up critical caches...');
        
        // Pre-cargar catálogos
        await this.catalogService.findAllAirports();
        await this.catalogService.findAllFIRs();
        
        // Pre-cargar configuración
        await this.configService.getSystemConfig();
        
        console.log('[CacheWarming] ✅ Cache warmed up');
    }
}
```

### 2. Invalidación en Batch

```typescript
// Al actualizar múltiples registros relacionados
async updateAirportEquipment(airportId: number, updates: any[]) {
    // Actualizar DB
    await this.repo.update(updates);

    // Invalidar múltiples caches relacionados
    await Promise.all([
        this.cache.del(`airport:${airportId}`),
        this.cache.del(`airport:${airportId}:equipos`),
        this.cache.del('catalog:airports'),
        this.cache.del('dashboard:stats'),
    ]);

    return { success: true };
}
```

### 3. Compression para Objetos Grandes

```typescript
import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

async cacheHugeObject(key: string, data: any) {
    const json = JSON.stringify(data);
    
    // Si es >10KB, comprimir
    if (json.length > 10000) {
        const compressed = await gzipAsync(json);
        await this.cache.set(`${key}:gz`, compressed.toString('base64'));
    } else {
        await this.cache.set(key, data);
    }
}
```

---

## 🔧 Comandos de Mantenimiento

### Limpieza Manual (si es necesario)

```bash
# Conectar a Redis
docker exec -it cns_redis redis-cli

# Ver todas las keys
KEYS *

# Eliminar todas las keys de un patrón
# (Usar con PRECAUCIÓN en producción)
EVAL "return redis.call('del', unpack(redis.call('keys', ARGV[1])))" 0 "user:*"

# Limpiar todo (SOLO EN DESARROLLO)
FLUSHALL

# Ver TTL de una key específica
TTL user:123:profile
# -1: No tiene TTL (permanente)
# -2: Key no existe
# N: Segundos restantes

# Extender TTL manualmente
EXPIRE user:123:profile 600  # 10 minutos más
```

### Backup (opcional, si decides habilitar persistencia)

```bash
# Crear snapshot manual
docker exec cns_redis redis-cli SAVE

# O en background (no bloquea)
docker exec cns_redis redis-cli BGSAVE

# Copiar snapshot
docker cp cns_redis:/data/dump.rdb ./backup/redis-$(date +%Y%m%d).rdb
```

---

## 📈 Escalabilidad Futura

### Opción 1: Redis Sentinel (Alta Disponibilidad)

Si el sistema crece y necesitas failover automático:

```yaml
services:
  redis-master:
    image: redis:7-alpine
    # ... config

  redis-replica:
    image: redis:7-alpine
    command: redis-server --replicaof redis-master 6379

  redis-sentinel:
    image: redis:7-alpine
    command: redis-sentinel /etc/redis/sentinel.conf
```

### Opción 2: Redis Cluster (Horizontal Scaling)

Para >10k usuarios concurrentes:

```yaml
services:
  redis-node-1:
    image: redis:7-alpine
    command: redis-server --cluster-enabled yes

  redis-node-2:
    # ... similar
```

**Nota:** Para tu caso actual (recursos limitados), **NO es necesario**. Stick con single instance.

---

## ⚠️ Qué NO hacer

❌ **NO** cachear:
- Passwords (NUNCA)
- Tokens JWT/Refresh
- Datos de tarjetas de crédito
- Información médica sensible
- Datos financieros críticos

❌ **NO** usar TTL muy largos (>1 hora) en:
- Perfiles de usuario
- Permisos/roles
- Datos que cambian frecuentemente

❌ **NO** sobrecargar Redis con:
- Objetos muy grandes (>1MB)
- Demasiadas keys (>100k en recursos limitados)
- Queries que no se repiten

❌ **NO** depender 100% del cache:
- Siempre tener fallback a DB
- No asumir que Redis siempre está disponible

---

## 🎯 Checklist de Producción

Antes de deploy a producción:

- [ ] Redis configurado con `maxmemory` y `maxmemory-policy`
- [ ] Resource limits configurados en Docker
- [ ] Variables de entorno en `.env` productivo
- [ ] SSL/TLS si Redis está en servidor separado (no tu caso)
- [ ] Monitoreo de logs configurado
- [ ] Rate limiting testeado (5+ intentos fallidos)
- [ ] Cache invalidation testeado (update → cache cleared)
- [ ] Fallback a DB testeado (detener Redis → sistema sigue)
- [ ] Backup/recovery plan definido (opcional)
- [ ] Documentación actualizada

---

## 📞 Soporte

Si algo falla:

1. **Ver logs**: `docker logs cns_backend -f | grep -E "Cache|RateLimit"`
2. **Verificar Redis**: `docker exec cns_redis redis-cli ping`
3. **Ver memoria**: `docker stats cns_redis`
4. **Limpiar cache**: `docker exec cns_redis redis-cli FLUSHALL`
5. **Restart**: `docker-compose restart redis`

---

**🎉 Con estas prácticas, tu sistema estará optimizado, seguro y listo para producción.**
