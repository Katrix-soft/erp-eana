
# ⚠️ MIGRACIÓN A TYPEORM: Guía de Pasos

Sigue estos pasos para reemplazar Prisma con TypeORM y reducir el consumo de memoria.

## 1. Eliminar Prisma y dependencias
Ejecuta esto en la carpeta `backend-nest`:

```bash
npm uninstall prisma @prisma/client
rm -rf prisma
```

## 2. Instalar TypeORM y drivers
```bash
npm install @nestjs/typeorm typeorm pg
```

## 3. Configurar Entorno (.env)
Asegúrate de tener estas variables en tu `.env`:
```
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASS=postgrespassword
DB_NAME=cns_db
```

## 4. Configurar AppModule
Reemplaza `PrismaModule` en `src/app.module.ts` con `TypeOrmModule` optimizado:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { User } from './users/entities/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      // OPTIMIZACIÓN DE MEMORIA:
      synchronize: false, // NO usar en producción: crea tablas automáticamente
      logging: false,     // Desactivar logs pesados
      poolSize: 5,        // Límite de conexiones para ahorrar RAM (default es 10)
      extra: {
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      }
    }),
    // ... tus otros módulos (UsersModule, AuthModule, etc.)
  ],
})
export class AppModule {}
```

## 5. Convertir Modelos (Ejemplo)
El archivo `src/users/entities/user.entity.ts` ya ha sido creado como ejemplo. Deberás crear una `.entity.ts` por cada modelo que tenías en `schema.prisma`.

## 6. Actualizar Servicios
Tendrás que ir servicio por servicio reemplazando:
- `constructor(private prisma: PrismaService)`
- POR
- `@InjectRepository(User) private userRepository: Repository<User>`

Y las queries:
- `this.prisma.user.findMany(...)` -> `this.userRepository.find(...)`
