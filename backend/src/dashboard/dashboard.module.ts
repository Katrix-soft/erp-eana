import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Equipo } from '../equipos/entities/equipo.entity';
import { Navegacion } from '../navegacion/entities/navegacion.entity';
import { Vigilancia } from '../vigilancia/entities/vigilancia.entity';
import { Energia } from '../energia/entities/energia.entity';
import { Personal } from '../personal/entities/personal.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Equipo, Navegacion, Vigilancia, Energia, Personal])],
    controllers: [DashboardController],
    providers: [DashboardService],
})
export class DashboardModule { }
