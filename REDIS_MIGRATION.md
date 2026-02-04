# 🔄 Guía de Migración - Agregar Cache a Servicios Existentes

## 🎯 Objetivo

Convertir tus servicios actuales para usar cache sin romper funcionalidad existente.

---

## 📋 Antes de Empezar

✅ **Checklist:**
- [ ] Redis instalado y corriendo
- [ ] Dependencias npm instaladas
- [ ] `CACHE_ENABLED=true` en `.env`
- [ ] Backend inicia sin errores

---

## 🔧 Paso 1: Identificar Servicios a Migrar

Prioriza servicios con:
- ✅ **Queries repetitivas** (mismo dato consultado muchas veces)
- ✅ **Queries pesadas** (JOINs complejos, agregaciones)
- ✅ **Datos que cambian poco** (catálogos, configuración)
- ✅ **Alto tráfico** (endpoints usados frecuentemente)

Ejemplos en tu ERP:
- `AeropuertosService` → Catálogo estático
- `FirsService` → Catálogo estático
- `PersonalService.findOne()` → Query repetitiva
- `DashboardService.getStats()` → Query pesada
- `EquiposService.findByAeropuerto()` → Query con JOINs

---

## 🚀 Paso 2: Migración Básica (Sin cambiar lógica)

### Antes (sin cache):

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Aeropuerto } from './entities/aeropuerto.entity';

@Injectable()
export class AeropuertosService {
    constructor(
        @InjectRepository(Aeropuerto)
        private aeropuertoRepo: Repository<Aeropuerto>
    ) {}

    // ❌ Sin cache - cada llamada va a DB
    async findAll() {
        return this.aeropuertoRepo.find({
            relations: ['fir'],
            order: { nombre: 'ASC' }
        });
    }

    async findOne(id: number) {
        return this.aeropuertoRepo.findOne({
            where: { id },
            relations: ['fir', 'equipos']
        });
    }
}
```

### Después (con cache):

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Aeropuerto } from './entities/aeropuerto.entity';
import { CacheService } from '../cache/cache.service'; // ← AGREGAR

@Injectable()
export class AeropuertosService {
    constructor(
        @InjectRepository(Aeropuerto)
        private aeropuertoRepo: Repository<Aeropuerto>,
        private cache: CacheService // ← INYECTAR
    ) {}

    // ✅ Con cache - primera llamada va a DB, siguientes al cache
    async findAll() {
        return this.cache.getOrSet(
            'catalog:aeropuertos:all', // Key única
            () => this.aeropuertoRepo.find({
                relations: ['fir'],
                order: { nombre: 'ASC' }
            }),
            3600 // TTL: 1 hora
        );
    }

    async findOne(id: number) {
        return this.cache.getOrSet(
            `aeropuerto:${id}`, // Key con ID
            () => this.aeropuertoRepo.findOne({
                where: { id },
                relations: ['fir', 'equipos']
            }),
            1800 // TTL: 30 minutos
        );
    }
}
```

**Cambios:**
1. Importar `CacheService`
2. Inyectar en constructor
3. Envolver query con `cache.getOrSet()`
4. Definir key única y TTL

---

## 🔄 Paso 3: Agregar Invalidación de Cache

Cuando actualizas datos, debes invalidar el cache:

```typescript
@Injectable()
export class AeropuertosService {
    // ... (métodos anteriores)

    async update(id: number, updateDto: UpdateAeropuertoDto) {
        // 1. Actualizar en DB
        await this.aeropuertoRepo.update(id, updateDto);

        // 2. 🔥 Invalidar caches relacionados
        await this.cache.del(`aeropuerto:${id}`);
        await this.cache.del('catalog:aeropuertos:all');

        // 3. Retornar dato actualizado (re-cachea automáticamente)
        return this.findOne(id);
    }

    async create(createDto: CreateAeropuertoDto) {
        const aeropuerto = await this.aeropuertoRepo.save(createDto);

        // 🔥 Invalidar catálogo completo
        await this.cache.del('catalog:aeropuertos:all');

        return aeropuerto;
    }

    async remove(id: number) {
        await this.aeropuertoRepo.delete(id);

        // 🔥 Invalidar caches
        await this.cache.del(`aeropuerto:${id}`);
        await this.cache.del('catalog:aeropuertos:all');

        return { success: true };
    }
}
```

---

## 📊 Paso 4: TypeORM Query Cache (Alternativa)

Para queries que ya usan QueryBuilder:

### Antes:

```typescript
async findEquiposByAeropuerto(aeropuertoId: number) {
    return this.equipoRepo
        .createQueryBuilder('equipo')
        .leftJoinAndSelect('equipo.tipo', 'tipo')
        .leftJoinAndSelect('equipo.aeropuerto', 'aeropuerto')
        .where('equipo.aeropuertoId = :id', { id: aeropuertoId })
        .getMany();
}
```

### Después:

```typescript
async findEquiposByAeropuerto(aeropuertoId: number) {
    return this.equipoRepo
        .createQueryBuilder('equipo')
        .leftJoinAndSelect('equipo.tipo', 'tipo')
        .leftJoinAndSelect('equipo.aeropuerto', 'aeropuerto')
        .where('equipo.aeropuertoId = :id', { id: aeropuertoId })
        .cache(`equipos:airport:${aeropuertoId}`, 120000) // ← AGREGAR
        .getMany();
}
```

**Ventaja TypeORM cache:**
- ✅ Más simple (una línea)
- ✅ Auto-invalidación por TTL
- ❌ No tienes control manual de invalidación

**Ventaja CacheService:**
- ✅ Control total de invalidación
- ✅ Logging detallado
- ✅ Fallback automático

---

## 🎯 Paso 5: Migrar Dashboard/Stats (Queries Pesadas)

### Antes:

```typescript
@Injectable()
export class DashboardService {
    async getStats() {
        const [
            totalEquipos,
            equiposActivos,
            totalPersonal,
            workOrdersPendientes
        ] = await Promise.all([
            this.equiposRepo.count(),
            this.equiposRepo.count({ where: { estado: 'ACTIVO' } }),
            this.personalRepo.count(),
            this.workOrdersRepo.count({ where: { status: 'PENDING' } })
        ]);

        return {
            totalEquipos,
            equiposActivos,
            totalPersonal,
            workOrdersPendientes
        };
    }
}
```

### Después:

```typescript
@Injectable()
export class DashboardService {
    constructor(
        // ... repositories
        private cache: CacheService // ← AGREGAR
    ) {}

    async getStats() {
        return this.cache.getOrSet(
            'dashboard:stats:overview',
            async () => {
                const [
                    totalEquipos,
                    equiposActivos,
                    totalPersonal,
                    workOrdersPendientes
                ] = await Promise.all([
                    this.equiposRepo.count(),
                    this.equiposRepo.count({ where: { estado: 'ACTIVO' } }),
                    this.personalRepo.count(),
                    this.workOrdersRepo.count({ where: { status: 'PENDING' } })
                ]);

                return {
                    totalEquipos,
                    equiposActivos,
                    totalPersonal,
                    workOrdersPendientes
                };
            },
            60 // TTL: 1 minuto (balance entre frescura y performance)
        );
    }

    // Invalidar al crear/actualizar/eliminar registros relevantes
    async invalidateStats() {
        await this.cache.del('dashboard:stats:overview');
    }
}
```

---

## 🔐 Paso 6: Migrar Verificaciones de Permisos

### Antes:

```typescript
@Injectable()
export class AuthorizationService {
    async checkPermission(userId: number, permission: string): Promise<boolean> {
        const user = await this.userRepo.findOne({
            where: { id: userId },
            relations: ['roles', 'roles.permissions']
        });

        return user.roles.some(role =>
            role.permissions.some(p => p.code === permission)
        );
    }
}
```

### Después:

```typescript
@Injectable()
export class AuthorizationService {
    constructor(
        // ...
        private cache: CacheService
    ) {}

    async checkPermission(userId: number, permission: string): Promise<boolean> {
        // Obtener permisos del usuario (cacheados)
        const permissions = await this.getUserPermissions(userId);
        return permissions.includes(permission);
    }

    private async getUserPermissions(userId: number): Promise<string[]> {
        return this.cache.getOrSet(
            `user:${userId}:permissions`,
            async () => {
                const user = await this.userRepo.findOne({
                    where: { id: userId },
                    relations: ['roles', 'roles.permissions']
                });

                return user.roles.flatMap(role =>
                    role.permissions.map(p => p.code)
                );
            },
            600 // 10 minutos
        );
    }

    // Invalidar al cambiar roles
    async updateUserRoles(userId: number, roleIds: number[]) {
        // ... actualizar roles en DB
        await this.cache.del(`user:${userId}:permissions`); // 🔥
    }
}
```

---

## 🧪 Paso 7: Testing de la Migración

### Test manual:

1. **Primera llamada** (cache miss):
```bash
# Llamar endpoint
GET /api/aeropuertos

# Ver logs
[Cache] 🔍 MISS: catalog:aeropuertos:all
[Cache] 💾 SET: catalog:aeropuertos:all
# ← Query fue a DB y se cacheó
```

2. **Segunda llamada** (cache hit):
```bash
# Llamar mismo endpoint
GET /api/aeropuertos

# Ver logs
[Cache] ✅ HIT: catalog:aeropuertos:all
# ← Dato vino del cache, no hubo query
```

3. **Actualizar dato**:
```bash
# Actualizar aeropuerto
PUT /api/aeropuertos/1

# Ver logs
[Cache] 🗑️ DELETE: aeropuerto:1
[Cache] 🗑️ DELETE: catalog:aeropuertos:all
# ← Cache invalidado
```

4. **Siguiente llamada**:
```bash
GET /api/aeropuertos

# Ver logs
[Cache] 🔍 MISS: catalog:aeropuertos:all
# ← Cache miss porque fue invalidado
```

---

## 📊 Paso 8: Monitorear Performance

Después de migrar, monitorea:

```bash
# Ver cache hits/misses en logs
docker logs cns_backend -f | grep Cache

# Conectar a Redis y ver stats
docker exec -it cns_redis redis-cli INFO stats

# Ver keys activas
docker exec -it cns_redis redis-cli KEYS "*"

# Ver hit ratio
# Hit Ratio = keyspace_hits / (keyspace_hits + keyspace_misses)
# Objetivo: >70%
```

---

## 🎯 Patrones de Migración por Tipo

### Catálogos (Aeropuertos, FIRs, Puestos)
```typescript
// TTL: 1-4 horas (cambian raramente)
await this.cache.getOrSet('catalog:*', factory, 3600);
```

### Perfiles/Datos de Usuario
```typescript
// TTL: 5-10 minutos (balance seguridad/performance)
await this.cache.getOrSet(`user:${id}:*`, factory, 300);
```

### Dashboard/Stats
```typescript
// TTL: 30-60 segundos (datos dinámicos)
await this.cache.getOrSet('dashboard:*', factory, 60);
```

### Búsquedas/Listings
```typescript
// TypeORM cache: 30-120 segundos
.cache('search:*', 60000)
```

---

## ✅ Checklist de Migración por Servicio

Para cada servicio:

- [ ] Inyectar `CacheService` en constructor
- [ ] Identificar métodos `find*` que cachear
- [ ] Envolver con `cache.getOrSet()`
- [ ] Definir keys únicas y TTLs apropiados
- [ ] Agregar invalidación en `update/create/delete`
- [ ] Probar cache hit/miss en logs
- [ ] Verificar invalidación funciona
- [ ] Medir performance (hit ratio >70%)

---

## 🚨 Errores Comunes y Soluciones

### Error: "Cannot find module '../cache/cache.service'"

**Solución:** Asegúrate que `CacheModule` esté en `app.module.ts`:

```typescript
@Module({
    imports: [
        CacheModule, // ← Debe estar aquí
        // ... otros módulos
    ]
})
```

### Error: Cache invalidation no funciona

**Solución:** Verifica que uses la misma key en `set` y `del`:

```typescript
// ❌ INCORRECTO - Keys diferentes
await this.cache.set('aeropuerto:1', data);
await this.cache.del('aeropuerto-1'); // ← Guión, no funciona

// ✅ CORRECTO - Misma key
await this.cache.set('aeropuerto:1', data);
await this.cache.del('aeropuerto:1');
```

### Error: Redis no conecta pero servicio funciona

**Esto es normal** → El sistema usa fallback automático a DB.

Para usar Redis:
1. Verificar: `docker ps | grep redis`
2. Ver logs: `docker logs cns_redis`
3. Restart: `docker-compose restart redis`

---

## 📚 Recursos

- **Ejemplos completos**: [`backend/src/cache/EXAMPLES.ts`](../backend/src/cache/EXAMPLES.ts)
- **Arquitectura**: [`REDIS_ARCHITECTURE.md`](./REDIS_ARCHITECTURE.md)
- **Buenas prácticas**: [`REDIS_PRODUCTION.md`](./REDIS_PRODUCTION.md)

---

**🎉 ¡Listo! Ahora puedes migrar tus servicios existentes a usar cache de forma segura.**
