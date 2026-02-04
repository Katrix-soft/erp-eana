import * as dotenv from 'dotenv';
dotenv.config();

console.log('DEBUG ENV:', {
    HOST: process.env.POSTGRES_HOST,
    PORT: process.env.POSTGRES_PORT,
    DB: process.env.POSTGRES_DB
});

import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import compression from 'compression';

import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ProductionLogger } from './common/logger/production.logger';

async function bootstrap() {
    // Configure logger based on environment
    const logger = process.env.NODE_ENV === 'production'
        ? new ProductionLogger()
        : undefined;

    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
        logger: logger || ['log', 'error', 'warn', 'debug', 'verbose'],
    });

    // ...

    // CORS Configuration - Secure for production
    const corsOrigin = process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
        : process.env.NODE_ENV === 'production'
            ? false // Deny all in production if not configured
            : true; // Allow all in development

    app.enableCors({
        origin: corsOrigin,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
        allowedHeaders: 'Content-Type,Authorization,X-Requested-With',
        exposedHeaders: 'X-Total-Count',
        maxAge: 3600,
    });
    app.use(helmet());
    app.use(compression());

    // Global Validation
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    // API Prefix
    app.setGlobalPrefix('api/v1', {
        exclude: ['/', '/health'],
    });

    // Swagger Documentation
    const config = new DocumentBuilder()
        .setTitle('EANA Enterprise API')
        .setDescription('API documentation for EANA System')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    await app.listen(3000, '0.0.0.0');

    const env = process.env.NODE_ENV || 'development';
    console.log(`🚀 Servidor iniciado en puerto 3000`);
    console.log(`📝 Ambiente: ${env}`);
    console.log(`📚 API Docs: http://localhost:3000/api/docs`);
    console.log(`❤️  Health: http://localhost:3000/health`);

    if (env === 'production') {
        console.log(`📊 Logs guardados en: ./logs/`);
    }
}
bootstrap();
