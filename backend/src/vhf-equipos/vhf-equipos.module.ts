import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VhfEquiposController } from './vhf-equipos.controller';
import { VhfEquiposService } from './vhf-equipos.service';
import { Equipo } from '../equipos/entities/equipo.entity';
import { Vhf } from '../vhf/entities/vhf.entity';
import { Aeropuerto } from '../aeropuertos/entities/aeropuerto.entity';
import { Personal } from '../personal/entities/personal.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Equipo, Vhf, Aeropuerto, Personal])],
    controllers: [VhfEquiposController],
    providers: [VhfEquiposService],
    exports: [VhfEquiposService]
})
export class VhfEquiposModule { }
