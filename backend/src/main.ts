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

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    // ...

    // Basic Security
    // In production, specify your frontend domain: e.g. origin: 'https://cns.eana.com.ar'
    app.enableCors({
        origin: true, // Allow all for now, but recommend restricting in production env vars
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
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
    console.log(`🚀 Servidor iniciado en puerto 3000`);
}
bootstrap();
