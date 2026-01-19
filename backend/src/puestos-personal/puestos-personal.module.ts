import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PuestosPersonalService } from './puestos-personal.service';
import { PuestosPersonalController } from './puestos-personal.controller';
import { PuestoPersonal } from './entities/puesto-personal.entity';

@Module({
    imports: [TypeOrmModule.forFeature([PuestoPersonal])],
    controllers: [PuestosPersonalController],
    providers: [PuestosPersonalService],
    exports: [PuestosPersonalService],
})
export class PuestosPersonalModule { }
