import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VorService } from './vor.service';
import { VorController } from './vor.controller';
import { GeminiService } from './gemini.service';
import { VorMeasurement } from './entities/vor-measurement.entity';
import { Personal } from '../personal/entities/personal.entity';
import { Aeropuerto } from '../aeropuertos/entities/aeropuerto.entity';

@Module({
    imports: [TypeOrmModule.forFeature([VorMeasurement, Personal, Aeropuerto])],
    controllers: [VorController],
    providers: [VorService, GeminiService],
})
export class VorModule { }
