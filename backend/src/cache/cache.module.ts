import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';
import { RateLimiterService } from './rate-limiter.service';
import { redisStore } from 'cache-manager-redis-yet';

/**
 * Global Cache Module con Redis y Fallback
 * 
 * Features:
 * - Cache Redis con fallback automático a memoria
 * - Configuración dinámica desde variables de entorno
 * - TTL configurable
 * - Lightweight y resiliente
 */
@Global()
@Module({
    imports: [
        ConfigModule,
        NestCacheModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => {
                const cacheEnabled = configService.get<string>('CACHE_ENABLED', 'true') === 'true';
                const redisHost = configService.get<string>('REDIS_HOST', 'localhost');
                const redisPort = configService.get<number>('REDIS_PORT', 6379);
                const redisTTL = configService.get<number>('REDIS_TTL', 300); // 5 minutos

                // Intentar conectar a Redis si está habilitado
                if (cacheEnabled) {
                    try {
                        console.log(`[Cache] 🔄 Attempting Redis connection: ${redisHost}:${redisPort}`);

                        const store = await redisStore({
                            socket: {
                                host: redisHost,
                                port: redisPort,
                                connectTimeout: 5000,
                                reconnectStrategy: (retries) => {
                                    if (retries > 3) {
                                        console.log('[Cache] ⚠️ Redis connection failed, using in-memory cache');
                                        return false; // detener reintentos
                                    }
                                    return Math.min(retries * 100, 3000);
                                },
                            },
                            ttl: redisTTL * 1000, // convertir a ms
                            // Configuración para recursos limitados
                            commandsQueueMaxLength: 100,
                        });

                        console.log('[Cache] ✅ Redis connected successfully');
                        return {
                            store,
                            ttl: redisTTL * 1000,
                            max: 1000, // más capacidad con Redis
                        };
                    } catch (error) {
                        console.error('[Cache] ❌ Redis connection failed:', error.message);
                        console.log('[Cache] 🔄 Falling back to in-memory cache');
                    }
                }

                // Fallback a memoria in-memory
                console.log('[Cache] 💾 Using in-memory cache');
                return {
                    ttl: redisTTL * 1000,
                    max: 100, // límite menor para memoria
                };
            },
        }),
    ],
    providers: [
        CacheService,
        RateLimiterService,
    ],
    exports: [
        NestCacheModule,
        CacheService,
        RateLimiterService,
    ],
})
export class CacheModule { }
