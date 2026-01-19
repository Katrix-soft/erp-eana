import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComunicacionesController } from './comunicaciones.controller';
import { ComunicacionesService } from './comunicaciones.service';
import { Comunicaciones } from './entities/comunicaciones.entity';
import { Aeropuerto } from '../aeropuertos/entities/aeropuerto.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Comunicaciones, Aeropuerto])],
    controllers: [ComunicacionesController],
    providers: [ComunicacionesService],
    exports: [ComunicacionesService]
})
export class ComunicacionesModule { }
