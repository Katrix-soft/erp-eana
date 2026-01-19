import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EquiposService } from './equipos.service';
import { EquiposController } from './equipos.controller';
import { Vhf } from '../vhf/entities/vhf.entity';
import { Equipo } from './entities/equipo.entity';
import { Comunicaciones } from '../comunicaciones/entities/comunicaciones.entity';
import { Navegacion } from '../navegacion/entities/navegacion.entity';
import { EquipoNavegacion } from '../navegacion/entities/equipo-navegacion.entity';
import { Vigilancia } from '../vigilancia/entities/vigilancia.entity';
import { Energia } from '../energia/entities/energia.entity';
import { Aeropuerto } from '../aeropuertos/entities/aeropuerto.entity';
import { Fir } from '../firs/entities/fir.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Vhf,
            Equipo,
            Comunicaciones,
            Navegacion,
            EquipoNavegacion,
            Vigilancia,
            Energia,
            Aeropuerto,
            Fir
        ])
    ],
    controllers: [EquiposController],
    providers: [EquiposService],
    exports: [EquiposService]
})
export class EquiposModule { }
