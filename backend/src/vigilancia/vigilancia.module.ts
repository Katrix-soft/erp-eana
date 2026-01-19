
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VigilanciaController } from './vigilancia.controller';
import { VigilanciaService } from './vigilancia.service';
import { Vigilancia } from './entities/vigilancia.entity';
import { Personal } from '../personal/entities/personal.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Vigilancia, Personal])],
    controllers: [VigilanciaController],
    providers: [VigilanciaService],
    exports: [VigilanciaService]
})
export class VigilanciaModule { }
