import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MailProcessor } from './processors/mail.processor';
import { AuditProcessor } from './processors/audit.processor';
import { NotificationProcessor } from './processors/notification.processor';

@Global()
@Module({
    imports: [
        BullModule.registerQueue(
            { name: 'mail' },
            { name: 'audit' },
            { name: 'notifications' }
        ),
    ],
    providers: [
        MailProcessor,
        AuditProcessor,
        NotificationProcessor
    ],
    exports: [
        BullModule
    ]
})
export class QueuesModule { }
