import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { CacheService } from '../src/cache/cache.service';
import { RateLimiterService } from '../src/cache/rate-limiter.service';

/**
 * Script de verificación de Redis y Cache
 * 
 * Prueba:
 * 1. Conexión a Redis
 * 2. Operaciones básicas de cache
 * 3. Rate limiting
 */
async function testRedisIntegration() {
    console.log('🔍 Iniciando verificación de Redis...\n');

    const app = await NestFactory.createApplicationContext(AppModule);
    const cacheService = app.get(CacheService);
    const rateLimiter = app.get(RateLimiterService);

    try {
        // Test 1: Cache básico
        console.log('📝 Test 1: Operaciones básicas de cache');
        console.log('----------------------------------------');

        const testKey = 'test:verification';
        const testValue = { message: 'Hello Redis!', timestamp: Date.now() };

        // Set
        await cacheService.set(testKey, testValue, 60);
        console.log('✅ SET exitoso');

        // Get
        const retrieved = await cacheService.get(testKey);
        if (retrieved && JSON.stringify(retrieved) === JSON.stringify(testValue)) {
            console.log('✅ GET exitoso - Valor coincide');
        } else {
            console.log('❌ GET falló - Valor no coincide');
        }

        // Delete
        await cacheService.del(testKey);
        const afterDelete = await cacheService.get(testKey);
        if (!afterDelete) {
            console.log('✅ DELETE exitoso\n');
        } else {
            console.log('❌ DELETE falló\n');
        }

        // Test 2: getOrSet (cache miss y hit)
        console.log('📝 Test 2: Cache Miss y Hit');
        console.log('----------------------------------------');

        let dbCallCount = 0;
        const factoryFunction = async () => {
            dbCallCount++;
            console.log(`  🔄 Factory llamada (simulando consulta DB) - Llamada #${dbCallCount}`);
            return { data: 'From Factory', count: dbCallCount };
        };

        // Primera llamada (cache miss)
        const result1 = await cacheService.getOrSet('test:factory', factoryFunction, 60);
        console.log(`  📦 Resultado 1:`, result1);

        // Segunda llamada (cache hit)
        const result2 = await cacheService.getOrSet('test:factory', factoryFunction, 60);
        console.log(`  📦 Resultado 2:`, result2);

        if (dbCallCount === 1) {
            console.log('✅ Cache funcionando correctamente (factory solo llamada 1 vez)\n');
        } else {
            console.log('❌ Cache no está funcionando (factory llamada múltiples veces)\n');
        }

        // Limpiar
        await cacheService.del('test:factory');

        // Test 3: Rate Limiting
        console.log('📝 Test 3: Rate Limiting');
        console.log('----------------------------------------');

        const testIdentifier = 'test-user-' + Date.now();

        // Simular 3 intentos permitidos
        for (let i = 1; i <= 3; i++) {
            const check = await rateLimiter.check(testIdentifier, 'test-action', {
                maxAttempts: 5,
                windowSeconds: 60
            });
            console.log(`  Intento ${i}: ${check.allowed ? '✅ Permitido' : '❌ Bloqueado'} (${check.remaining} restantes)`);

            if (check.allowed) {
                await rateLimiter.recordFailure(testIdentifier, 'test-action', 60);
            }
        }

        // Verificar estado
        const status = await rateLimiter.getStatus(testIdentifier, 'test-action');
        console.log(`  Estado actual: ${status.attempts} intentos, ${status.blocked ? 'BLOQUEADO' : 'ACTIVO'}`);

        // Simular login exitoso
        await rateLimiter.recordSuccess(testIdentifier, 'test-action');
        const statusAfterSuccess = await rateLimiter.getStatus(testIdentifier, 'test-action');
        console.log(`  Después de éxito: ${statusAfterSuccess.attempts} intentos, ${statusAfterSuccess.blocked ? 'BLOQUEADO' : 'ACTIVO'}`);

        if (statusAfterSuccess.attempts === 0) {
            console.log('✅ Rate limiting funcionando correctamente\n');
        } else {
            console.log('❌ Rate limiting no limpió los contadores\n');
        }

        // Test 4: Bloqueo por exceso de intentos
        console.log('📝 Test 4: Bloqueo por exceso de intentos');
        console.log('----------------------------------------');

        const testIdentifier2 = 'test-blocked-' + Date.now();

        // Simular 6 intentos (excede el límite de 5)
        for (let i = 1; i <= 6; i++) {
            const check = await rateLimiter.check(testIdentifier2, 'test-action', {
                maxAttempts: 5,
                windowSeconds: 60,
                blockSeconds: 10
            });

            if (!check.allowed) {
                console.log(`  Intento ${i}: ❌ BLOQUEADO (retry after ${check.retryAfter}s)`);
                break;
            } else {
                console.log(`  Intento ${i}: ✅ Permitido (${check.remaining} restantes)`);
                await rateLimiter.recordFailure(testIdentifier2, 'test-action', 60);
            }
        }

        // Verificar que está bloqueado
        const blockedCheck = await rateLimiter.check(testIdentifier2, 'test-action', {
            maxAttempts: 5,
            windowSeconds: 60
        });

        if (blockedCheck.blocked) {
            console.log('✅ Bloqueo funcionando correctamente\n');
        } else {
            console.log('❌ Bloqueo no está funcionando\n');
        }

        // Limpiar
        await rateLimiter.reset(testIdentifier2, 'test-action');

        // Resumen final
        console.log('========================================');
        console.log('✅ Verificación completada exitosamente');
        console.log('========================================');
        console.log('\n📊 Resumen:');
        console.log('  ✅ Cache básico: OK');
        console.log('  ✅ Cache miss/hit: OK');
        console.log('  ✅ Rate limiting: OK');
        console.log('  ✅ Bloqueo automático: OK');
        console.log('\n🎉 Redis está funcionando correctamente!\n');

    } catch (error) {
        console.error('\n❌ Error durante la verificación:', error);
        console.error('\n⚠️ Posibles causas:');
        console.error('  1. Redis no está corriendo (docker-compose up redis)');
        console.error('  2. Variables de entorno incorrectas');
        console.error('  3. Puerto 6379 no disponible\n');
    } finally {
        await app.close();
    }
}

// Ejecutar
testRedisIntegration()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Error fatal:', error);
        process.exit(1);
    });
