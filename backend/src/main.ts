import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import compression from 'compression';

import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ProductionLogger } from './common/logger/production.logger';

async function bootstrap() {
    // ═══════════════════════════════════════════════
    // OPTIMIZACIÓN DE MEMORIA: Limitar el heap de V8
    // ═══════════════════════════════════════════════
    if (global.gc) {
        // Forzar garbage collection periódico (cada 5 min)
        setInterval(() => {
            const before = process.memoryUsage().heapUsed;
            global.gc();
            const after = process.memoryUsage().heapUsed;
            const freed = Math.round((before - after) / 1024 / 1024);
            if (freed > 5) {
                console.log(`[GC] Liberados ${freed}MB de memoria`);
            }
        }, 5 * 60 * 1000);
    }

    // Configure logger based on environment
    const logger = process.env.NODE_ENV === 'production'
        ? new ProductionLogger()
        : undefined;

    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
        logger: logger || ['log', 'error', 'warn'],
        // Reducir overhead de buffers internos de NestJS
        abortOnError: false,
        bufferLogs: false,
    });

    // ═══════════════════════════════════════════════
    // OPTIMIZACIÓN RAM: Compresión agresiva de respuestas
    // ═══════════════════════════════════════════════
    app.use(compression({
        level: 6,          // Balance compresión/CPU (1-9)
        threshold: 1024,   // Solo comprimir respuestas > 1KB
        memLevel: 7,       // Memoria para compresión (1-9)
    }));

    // Seguridad
    app.use(helmet({
        contentSecurityPolicy: process.env.NODE_ENV === 'production',
    }));

    // CORS Configuration
    const corsOrigin = process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
        : process.env.NODE_ENV === 'production'
            ? false
            : true;

    app.enableCors({
        origin: corsOrigin,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
        allowedHeaders: 'Content-Type,Authorization,X-Requested-With',
        exposedHeaders: 'X-Total-Count',
        maxAge: 3600,
    });

    // Global Validation (whitelist reduce memoria en DTOs grandes)
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: false, // No rechazar en producción, solo filtrar
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    // API Prefix
    app.setGlobalPrefix('api/v1', {
        exclude: ['/', '/health'],
    });

    // Swagger (solo en desarrollo para ahorrar RAM en producción)
    if (process.env.NODE_ENV !== 'production') {
        const config = new DocumentBuilder()
            .setTitle('EANA Enterprise API')
            .setDescription('API documentation for EANA System')
            .setVersion('1.0')
            .addBearerAuth()
            .build();
        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('api/docs', app, document);
    }

    await app.listen(3000, '0.0.0.0');

    const env = process.env.NODE_ENV || 'development';
    const mem = process.memoryUsage();
    console.log(`🚀 Servidor iniciado en puerto 3000`);
    console.log(`📝 Ambiente: ${env}`);
    if (env !== 'production') {
        console.log(`📚 API Docs: http://localhost:3000/api/docs`);
    }
    console.log(`❤️  Health: http://localhost:3000/health`);
    console.log(`💾 RAM Inicial: ${Math.round(mem.heapUsed / 1024 / 1024)}MB heap / ${Math.round(mem.rss / 1024 / 1024)}MB RSS`);

    if (env === 'production') {
        console.log(`📊 Logs guardados en: ./logs/`);
    }
}
bootstrap();
