import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkOrdersService } from './work-orders.service';
import { WorkOrdersController } from './work-orders.controller';
import { WorkOrder } from './entities/work-order.entity';
import { Personal } from '../personal/entities/personal.entity';
import { Equipo } from '../equipos/entities/equipo.entity';

@Module({
    imports: [TypeOrmModule.forFeature([WorkOrder, Personal, Equipo])],
    controllers: [WorkOrdersController],
    providers: [WorkOrdersService],
    exports: [WorkOrdersService]
})
export class WorkOrdersModule { }
