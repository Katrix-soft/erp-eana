import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
    constructor(
        @InjectRepository(AuditLog) private auditLogRepository: Repository<AuditLog>
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
        try {
            const logEntry = this.auditLogRepository.create({
                userId: data.userId,
                action: data.action,
                entity: data.entity,
                entityId: data.entityId,
                oldValue: data.oldValue || {},
                newValue: data.newValue || {},
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
            });
            return await this.auditLogRepository.save(logEntry);
        } catch (error) {
            console.error('❌ Error saving audit log:', error);
            // We don't throw to avoid breaking the main flow
        }
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

