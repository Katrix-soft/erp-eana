import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FrecuenciasService } from './frecuencias.service';
import { FrecuenciasController } from './frecuencias.controller';
import { Frecuencia } from './entities/frecuencia.entity';
import { Aeropuerto } from '../aeropuertos/entities/aeropuerto.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Frecuencia, Aeropuerto])],
    controllers: [FrecuenciasController],
    providers: [FrecuenciasService],
})
export class FrecuenciasModule { }
