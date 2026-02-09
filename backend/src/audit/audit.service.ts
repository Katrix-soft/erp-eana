import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class AuditService {
    private readonly logger = new Logger(AuditService.name);

    constructor(
        @InjectRepository(AuditLog) private auditLogRepository: Repository<AuditLog>,
        @InjectQueue('audit') private auditQueue: Queue
    ) { }

    async log(data: {
        userId: number;
        action: string;
        entity: string;
        entityId: number;
        oldValue?: any;
        newValue?: any;
        ipAddress?: string;
        userAgent?: string;
    }) {
        // Enviar a la cola para procesamiento en segundo plano
        return this.auditQueue.add('log-event', data, {
            removeOnComplete: true,
            priority: 10 // Prioridad baja para no interferir con procesos críticos
        });
    }

    async findByEntity(entity: string, entityId: number) {
        return this.auditLogRepository.find({
            where: { entity, entityId },
            relations: ['user'],
            order: { createdAt: 'DESC' },
        });
    }

    async findByUser(userId: number) {
        return this.auditLogRepository.find({
            where: userId ? { userId } : {},
            relations: ['user'],
            order: { createdAt: 'DESC' },
            take: 200,
        });
    }

    async findAll() {
        return this.auditLogRepository.find({
            relations: ['user'],
            order: { createdAt: 'DESC' },
            take: 500,
        });
    }
}


