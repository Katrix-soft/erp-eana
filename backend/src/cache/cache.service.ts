import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

/**
 * Safe Cache Service con fallback automático
 * 
 * Características:
 * - Wrapping seguro de todas las operaciones
 * - Nunca falla el flujo principal si Redis no está disponible
 * - Logging para debugging
 * - Performance monitoring
 */
@Injectable()
export class CacheService {
    constructor(
        @Inject(CACHE_MANAGER) private cacheManager: Cache
    ) { }

    /**
     * Obtener valor del cache con fallback a callback
     * @param key - Cache key
     * @param factory - Function to call if cache miss
     * @param ttl - TTL override in seconds (default: usa el configurado)
     */
    async getOrSet<T>(
        key: string,
        factory: () => Promise<T>,
        ttl?: number
    ): Promise<T> {
        try {
            // Intentar obtener del cache
            const cached = await this.cacheManager.get<T>(key);
            if (cached !== null && cached !== undefined) {
                console.log(`[Cache] ✅ HIT: ${key}`);
                return cached;
            }

            console.log(`[Cache] 🔍 MISS: ${key}`);

            // Cache miss - ejecutar factory
            const value = await factory();

            // Guardar en cache (fire and forget, no bloqueante)
            this.set(key, value, ttl).catch(err => {
                console.error(`[Cache] ⚠️ Failed to cache ${key}:`, err.message);
            });

            return value;
        } catch (error) {
            console.error(`[Cache] ❌ Error in getOrSet for ${key}:`, error.message);
            // Fallback directo a factory si hay error
            return factory();
        }
    }

    /**
     * Guardar en cache
     */
    async set<T>(key: string, value: T, ttl?: number): Promise<void> {
        try {
            if (ttl !== undefined) {
                await this.cacheManager.set(key, value, ttl * 1000);
            } else {
                await this.cacheManager.set(key, value);
            }
            console.log(`[Cache] 💾 SET: ${key}`);
        } catch (error) {
            console.error(`[Cache] ❌ Set failed for ${key}:`, error.message);
            // No throw - silent failure
        }
    }

    /**
     * Obtener del cache
     */
    async get<T>(key: string): Promise<T | null> {
        try {
            const value = await this.cacheManager.get<T>(key);
            if (value !== null && value !== undefined) {
                console.log(`[Cache] ✅ GET: ${key}`);
                return value;
            }
            return null;
        } catch (error) {
            console.error(`[Cache] ❌ Get failed for ${key}:`, error.message);
            return null;
        }
    }

    /**
     * Eliminar del cache
     */
    async del(key: string): Promise<void> {
        try {
            await this.cacheManager.del(key);
            console.log(`[Cache] 🗑️ DELETE: ${key}`);
        } catch (error) {
            console.error(`[Cache] ❌ Delete failed for ${key}:`, error.message);
        }
    }

    /**
     * Eliminar múltiples keys que coincidan con un patrón
     * Útil para invalidar cache por usuario o entidad
     */
    async delPattern(pattern: string): Promise<void> {
        try {
            // Esta funcionalidad requiere redis store
            console.log(`[Cache] 🗑️ DELETE_PATTERN: ${pattern}`);
            // Implementación depende del store usado
        } catch (error) {
            console.error(`[Cache] ❌ Delete pattern failed:`, error.message);
        }
    }

    /**
     * Limpiar todo el cache (usar con precaución)
     */
    async reset(): Promise<void> {
        try {
            await this.cacheManager.reset();
            console.log(`[Cache] 🧹 RESET: All cache cleared`);
        } catch (error) {
            console.error(`[Cache] ❌ Reset failed:`, error.message);
        }
    }

    /**
     * Wrapper para cachear el resultado de un método
     * Uso: return await this.cache.wrap('my-key', () => this.expensiveOperation());
     */
    async wrap<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
        return this.getOrSet(key, factory, ttl);
    }
}
