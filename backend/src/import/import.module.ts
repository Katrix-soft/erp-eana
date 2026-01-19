import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';
import { Vhf } from '../vhf/entities/vhf.entity';
import { Equipo } from '../equipos/entities/equipo.entity';
import { Canal } from '../canales/entities/canal.entity';
import { Frecuencia } from '../frecuencias/entities/frecuencia.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Vhf, Equipo, Canal, Frecuencia])],
    controllers: [ImportController],
    providers: [ImportService],
})
export class ImportModule { }
