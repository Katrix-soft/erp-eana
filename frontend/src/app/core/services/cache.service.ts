import { Injectable } from '@angular/core';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

@Injectable({
    providedIn: 'root'
})
export class CacheService {
    private cache = new Map<string, CacheEntry<any>>();
    private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos

    /**
     * Obtener dato del cache
     * @param key Clave del cache
     * @param ttl Time to live en milisegundos (opcional)
     * @returns Dato cacheado o null si no existe/expiró
     */
    get<T>(key: string, ttl: number = this.DEFAULT_TTL): T | null {
        const cached = this.cache.get(key);

        if (!cached) {
            console.log(`❌ Cache MISS: ${key}`);
            return null;
        }

        const isExpired = Date.now() - cached.timestamp > ttl;

        if (isExpired) {
            console.log(`⏰ Cache EXPIRED: ${key}`);
            this.cache.delete(key);
            return null;
        }

        console.log(`✅ Cache HIT: ${key}`);
        return cached.data as T;
    }

    /**
     * Guardar dato en cache
     * @param key Clave del cache
     * @param data Dato a cachear
     */
    set<T>(key: string, data: T): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
        console.log(`💾 Cache SET: ${key}`);
    }

    /**
     * Invalidar cache por clave exacta o patrón
     * @param pattern Clave exacta o patrón a buscar
     */
    invalidate(pattern?: string): void {
        if (!pattern) {
            const size = this.cache.size;
            this.cache.clear();
            console.log(`🗑️ Cache CLEARED: ${size} entries`);
            return;
        }

        let deleted = 0;
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
                deleted++;
            }
        }
        console.log(`🗑️ Cache INVALIDATED: ${deleted} entries matching "${pattern}"`);
    }

    /**
     * Verificar si existe en cache y no ha expirado
     * @param key Clave del cache
     * @param ttl Time to live en milisegundos (opcional)
     */
    has(key: string, ttl: number = this.DEFAULT_TTL): boolean {
        const cached = this.cache.get(key);
        if (!cached) return false;

        const isExpired = Date.now() - cached.timestamp > ttl;
        return !isExpired;
    }

    /**
     * Obtener estadísticas del cache
     */
    getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
            entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
                key,
                age: Date.now() - entry.timestamp,
                size: JSON.stringify(entry.data).length
            }))
        };
    }
}
