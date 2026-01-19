import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NavegacionController } from './navegacion.controller';
import { NavegacionService } from './navegacion.service';
import { Navegacion } from './entities/navegacion.entity';
import { EquipoNavegacion } from './entities/equipo-navegacion.entity';
import { Aeropuerto } from '../aeropuertos/entities/aeropuerto.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Navegacion, EquipoNavegacion, Aeropuerto])],
    controllers: [NavegacionController],
    providers: [NavegacionService],
    exports: [NavegacionService]
})
export class NavegacionModule { }
