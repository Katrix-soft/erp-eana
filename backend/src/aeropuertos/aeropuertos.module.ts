import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AeropuertosService } from './aeropuertos.service';
import { AeropuertosController } from './aeropuertos.controller';
import { Aeropuerto } from './entities/aeropuerto.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Aeropuerto])],
    controllers: [AeropuertosController],
    providers: [AeropuertosService],
    exports: [AeropuertosService],
})
export class AeropuertosModule { }
