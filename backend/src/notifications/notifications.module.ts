import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Notification } from './entities/notification.entity';
import { Personal } from '../personal/entities/personal.entity';

@Global()
@Module({
    imports: [TypeOrmModule.forFeature([Notification, Personal])],
    controllers: [NotificationsController],
    providers: [NotificationsService],
    exports: [NotificationsService, TypeOrmModule],
})
export class NotificationsModule { }
