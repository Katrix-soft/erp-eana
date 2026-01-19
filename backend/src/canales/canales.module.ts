import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CanalesService } from './canales.service';
import { CanalesController } from './canales.controller';
import { Canal } from './entities/canal.entity';
import { Aeropuerto } from '../aeropuertos/entities/aeropuerto.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Canal, Aeropuerto])],
    controllers: [CanalesController],
    providers: [CanalesService],
})
export class CanalesModule { }
