import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChecklistsService } from './checklists.service';
import { ChecklistsController } from './checklists.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { MailModule } from '../mail/mail.module';
import { Checklist } from './entities/checklist.entity';
import { Personal } from '../personal/entities/personal.entity';
import { Equipo } from '../equipos/entities/equipo.entity';
import { WorkOrder } from '../work-orders/entities/work-order.entity';
import { Fir } from '../firs/entities/fir.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Checklist, Personal, Equipo, WorkOrder, Fir]),
        NotificationsModule,
        MailModule
    ],
    controllers: [ChecklistsController],
    providers: [ChecklistsService],
})
export class ChecklistsModule { }
