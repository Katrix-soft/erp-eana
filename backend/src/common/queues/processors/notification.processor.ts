import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../../notifications/entities/notification.entity';

@Processor('notifications')
export class NotificationProcessor extends WorkerHost {
    private readonly logger = new Logger(NotificationProcessor.name);

    constructor(
        @InjectRepository(Notification) private notificationRepository: Repository<Notification>
    ) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<any> {
        this.logger.log(`🔔 Processing notification job ${job.id}`);

        try {
            const notification = this.notificationRepository.create(job.data);
            await this.notificationRepository.save(notification);
            return { success: true };
        } catch (error) {
            this.logger.error(`❌ Failed to save notification: ${error.message}`);
            throw error;
        }
    }
}
