import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../../audit/entities/audit-log.entity';

@Processor('audit')
export class AuditProcessor extends WorkerHost {
    private readonly logger = new Logger(AuditProcessor.name);

    constructor(
        @InjectRepository(AuditLog) private auditLogRepository: Repository<AuditLog>
    ) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<any> {
        this.logger.log(`📝 Processing audit log job ${job.id}`);

        try {
            const logEntry = this.auditLogRepository.create(job.data);
            await this.auditLogRepository.save(logEntry);
            return { success: true };
        } catch (error) {
            this.logger.error(`❌ Failed to save audit log: ${error.message}`);
            throw error;
        }
    }
}
