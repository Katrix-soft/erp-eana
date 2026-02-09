import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnergiaService } from './energia.service';
import { EnergiaController } from './energia.controller';
import { Energia } from './entities/energia.entity';
import { TableroElectrico, ComponenteTablero } from './entities/tablero-electrico.entity';
import { Personal } from '../personal/entities/personal.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Energia, TableroElectrico, ComponenteTablero, Personal])],
    controllers: [EnergiaController],
    providers: [EnergiaService],
    exports: [EnergiaService],
})
export class EnergiaModule { }
