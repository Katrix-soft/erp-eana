import { Injectable } from '@nestjs/common';
import { CacheService } from './cache.service';

/**
 * Rate Limiter Service para protección contra brute-force
 * 
 * Características:
 * - Bloqueo progresivo por IP/Usuario
 * - Rate limiting flexible
 * - No afecta el flujo si Redis falla
 * - Lightweight para producción
 */
export interface RateLimitConfig {
    /** Número de intentos permitidos */
    maxAttempts: number;
    /** Ventana de tiempo en segundos */
    windowSeconds: number;
    /** Tiempo de bloqueo en segundos (opcional, progressivo si no se especifica) */
    blockSeconds?: number;
}

export interface RateLimitResult {
    /** Si está permitido */
    allowed: boolean;
    /** Intentos restantes */
    remaining: number;
    /** Tiempo de espera en segundos si está bloqueado */
    retryAfter?: number;
    /** Si está bloqueado */
    blocked: boolean;
}

@Injectable()
export class RateLimiterService {
    constructor(private cacheService: CacheService) { }

    /**
     * Verificar y registrar intento
     * @param identifier - IP o username
     * @param action - Tipo de acción (login, api-call, etc)
     * @param config - Configuración de rate limit
     */
    async check(
        identifier: string,
        action: string = 'login',
        config: RateLimitConfig = { maxAttempts: 5, windowSeconds: 300, blockSeconds: 300 }
    ): Promise<RateLimitResult> {
        try {
            const key = `ratelimit:${action}:${identifier}`;
            const blockKey = `ratelimit:block:${action}:${identifier}`;

            // Verificar si está bloqueado
            const blockData = await this.cacheService.get<{ until: number; count: number }>(blockKey);
            if (blockData && blockData.until > Date.now()) {
                const retryAfter = Math.ceil((blockData.until - Date.now()) / 1000);
                console.log(`[RateLimit] 🚫 BLOCKED: ${identifier} for ${action} (${retryAfter}s remaining)`);
                return {
                    allowed: false,
                    remaining: 0,
                    retryAfter,
                    blocked: true,
                };
            }

            // Obtener contador actual
            const attempts = await this.cacheService.get<number>(key) || 0;
            const remaining = Math.max(0, config.maxAttempts - attempts - 1);

            // Si excede el límite, bloquear
            if (attempts >= config.maxAttempts) {
                const blockCount = (blockData?.count || 0) + 1;
                // Bloqueo progresivo: 5min, 15min, 30min, 1h, 2h...
                const blockDuration = config.blockSeconds || Math.min(
                    7200, // máximo 2 horas
                    config.windowSeconds * Math.pow(2, blockCount - 1)
                );

                const blockUntil = Date.now() + (blockDuration * 1000);
                await this.cacheService.set(blockKey, { until: blockUntil, count: blockCount }, blockDuration);

                console.log(`[RateLimit] 🚫 BLOCKING: ${identifier} for ${action} (${blockDuration}s, attempt ${blockCount})`);
                return {
                    allowed: false,
                    remaining: 0,
                    retryAfter: blockDuration,
                    blocked: true,
                };
            }

            console.log(`[RateLimit] ✅ ALLOWED: ${identifier} for ${action} (${remaining} attempts left)`);
            return {
                allowed: true,
                remaining,
                retryAfter: 0,
                blocked: false,
            };
        } catch (error) {
            console.error(`[RateLimit] ⚠️ Error checking rate limit:`, error.message);
            // En caso de error, permitir (fail-open para no afectar UX)
            return {
                allowed: true,
                remaining: 999,
                blocked: false,
            };
        }
    }

    /**
     * Registrar intento fallido
     */
    async recordFailure(
        identifier: string,
        action: string = 'login',
        windowSeconds: number = 300
    ): Promise<void> {
        try {
            const key = `ratelimit:${action}:${identifier}`;
            const attempts = await this.cacheService.get<number>(key) || 0;
            const newAttempts = attempts + 1;

            await this.cacheService.set(key, newAttempts, windowSeconds);
            console.log(`[RateLimit] 📝 Recorded failure for ${identifier}: ${newAttempts} attempts`);
        } catch (error) {
            console.error(`[RateLimit] ⚠️ Error recording failure:`, error.message);
        }
    }

    /**
     * Registrar intento exitoso (limpia contadores)
     */
    async recordSuccess(identifier: string, action: string = 'login'): Promise<void> {
        try {
            const key = `ratelimit:${action}:${identifier}`;
            const blockKey = `ratelimit:block:${action}:${identifier}`;

            await this.cacheService.del(key);
            await this.cacheService.del(blockKey);
            console.log(`[RateLimit] ✅ Cleared counters for ${identifier}`);
        } catch (error) {
            console.error(`[RateLimit] ⚠️ Error recording success:`, error.message);
        }
    }

    /**
     * Resetear bloqueo manualmente (para admins)
     */
    async reset(identifier: string, action: string = 'login'): Promise<void> {
        await this.recordSuccess(identifier, action);
    }

    /**
     * Obtener estado actual
     */
    async getStatus(identifier: string, action: string = 'login'): Promise<{
        attempts: number;
        blocked: boolean;
        retryAfter?: number;
    }> {
        try {
            const key = `ratelimit:${action}:${identifier}`;
            const blockKey = `ratelimit:block:${action}:${identifier}`;

            const attempts = await this.cacheService.get<number>(key) || 0;
            const blockData = await this.cacheService.get<{ until: number }>(blockKey);

            if (blockData && blockData.until > Date.now()) {
                return {
                    attempts,
                    blocked: true,
                    retryAfter: Math.ceil((blockData.until - Date.now()) / 1000),
                };
            }

            return {
                attempts,
                blocked: false,
            };
        } catch (error) {
            console.error(`[RateLimit] ⚠️ Error getting status:`, error.message);
            return { attempts: 0, blocked: false };
        }
    }
}
