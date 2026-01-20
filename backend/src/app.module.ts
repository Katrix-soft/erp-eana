import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VhfModule } from './vhf/vhf.module';
import { EquiposModule } from './equipos/equipos.module';
import { CanalesModule } from './canales/canales.module';
import { FrecuenciasModule } from './frecuencias/frecuencias.module';
import { ChecklistsModule } from './checklists/checklists.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ImportModule } from './import/import.module';
import { CommonModule } from './common/common.module';
import { AeropuertosModule } from './aeropuertos/aeropuertos.module';
import { User } from './users/entities/user.entity';
import { Checklist } from './checklists/entities/checklist.entity';
import { Notification } from './notifications/entities/notification.entity';
import { Vhf } from './vhf/entities/vhf.entity';
import { Equipo } from './equipos/entities/equipo.entity';
import { Energia } from './energia/entities/energia.entity';

import { FirsModule } from './firs/firs.module';
import { PersonalModule } from './personal/personal.module';
import { PuestosPersonalModule } from './puestos-personal/puestos-personal.module';
import { ComunicacionesModule } from './comunicaciones/comunicaciones.module';
import { VhfEquiposModule } from './vhf-equipos/vhf-equipos.module';
import { AuditModule } from './audit/audit.module';
import { WorkOrdersModule } from './work-orders/work-orders.module';
import { NavegacionModule } from './navegacion/navegacion.module';
import { VigilanciaModule } from './vigilancia/vigilancia.module';
import { EnergiaModule } from './energia/energia.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { VorModule } from './vor/vor.module';
import { ForoModule } from './foro/foro.module';
import { ChatModule } from './chat/chat.module';
import { UploadModule } from './upload/upload.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';


import { AppService } from './app.service';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        ThrottlerModule.forRoot([{
            ttl: 60000,
            limit: 100, // Increased for production handling
        }]),
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                type: 'postgres',
                host: config.get<string>('POSTGRES_HOST', 'localhost'),
                port: config.get<number>('POSTGRES_PORT', 5434),
                username: config.get<string>('POSTGRES_USER', 'postgres'),
                password: config.get<string>('POSTGRES_PASSWORD', 'postgrespassword'),
                database: config.get<string>('POSTGRES_DB', 'cns_db'),
                entities: [__dirname + '/**/*.entity{.ts,.js}'],
                synchronize: true,
                logging: config.get<string>('NODE_ENV') !== 'production',
                poolSize: 10,
            }),
        }),
        // PrismaModule, // Removed
        AuthModule,
        UsersModule,
        VhfModule,
        EquiposModule,
        CanalesModule,
        FrecuenciasModule,
        ChecklistsModule,
        NotificationsModule,
        ImportModule,
        CommonModule,
        AeropuertosModule,

        FirsModule,
        PersonalModule,
        PuestosPersonalModule,
        ComunicacionesModule,
        VhfEquiposModule,
        AuditModule,
        WorkOrdersModule,
        NavegacionModule,
        VigilanciaModule,
        EnergiaModule,
        DashboardModule,
        VorModule,
        ForoModule,
        ChatModule,
        UploadModule,
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, '..', 'uploads'),
            serveRoot: '/uploads',
        }),
        TypeOrmModule.forFeature([User, Checklist, Notification, Vhf, Equipo, Energia]),
    ],


    controllers: [AppController],
    providers: [AppService],
})
export class AppModule { }
