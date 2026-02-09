import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { Personal } from '../personal/entities/personal.entity';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(
        @InjectRepository(Notification) private notificationRepository: Repository<Notification>,
        @InjectRepository(Personal) private personalRepository: Repository<Personal>,
        @InjectQueue('notifications') private notificationsQueue: Queue
    ) { }

    async findAll(user: any) {
        // ... (existing find logic)
        // 1. Global Admins see everything
        if (['ADMIN', 'CNS_NACIONAL'].includes(user.role)) {
            return this.notificationRepository.find({
                order: { createdAt: 'DESC' },
                take: 50,
                relations: ['aeropuerto', 'fir']
            });
        }

        // 2. Get User Context
        const personal = await this.personalRepository.findOne({
            where: { userId: user.userId },
            relations: ['aeropuerto', 'fir']
        });

        const qb = this.notificationRepository.createQueryBuilder('n')
            .leftJoinAndSelect('n.aeropuerto', 'aeropuerto')
            .leftJoinAndSelect('n.fir', 'fir')
            .orderBy('n.createdAt', 'DESC')
            .take(50);

        // Build OR conditions
        // Base conditions: Personal messages OR Global system messages
        let whereCondition = `(n.userId = :userId OR (n.firId IS NULL AND n.aeropuertoId IS NULL))`;
        const params: any = { userId: user.userId };

        if (personal) {
            let userFirId = personal.fir?.id;
            const userSector = personal.sector;

            // If linked to airport but not FIR directly, extract FIR from airport
            if (!userFirId && personal.aeropuerto?.firId) {
                userFirId = personal.aeropuerto.firId;
            }

            if (userFirId) {
                // Notifications for the FIR itself (optionally filtered by sector)
                whereCondition += ` OR (n.firId = :userFirId AND (n.sector IS NULL OR n.sector = :userSector))`;
                params.userFirId = userFirId;
                params.userSector = userSector;

                // Notifications for ANY airport within this FIR (optionally filtered by sector)
                whereCondition += ` OR (aeropuerto.firId = :userFirId AND (n.sector IS NULL OR n.sector = :userSector))`;
            } else if (personal.aeropuertoId) {
                // Notifications for specific airport
                whereCondition += ` OR (n.aeropuertoId = :aeropuertoId AND (n.sector IS NULL OR n.sector = :userSector))`;
                params.aeropuertoId = personal.aeropuertoId;
                params.userSector = userSector;
            }
        }

        qb.where(whereCondition, params);

        return qb.getMany();
    }

    async create(data: { message: string, type?: string, userId?: number, aeropuertoId?: number, firId?: number, sector?: any }) {
        // Enviar a la cola para procesamiento en segundo plano
        this.logger.log(`🔔 Queuing notification creation: ${data.message.substring(0, 30)}...`);
        return this.notificationsQueue.add('create-notification', {
            message: data.message,
            type: data.type || 'INFO',
            userId: data.userId,
            aeropuertoId: data.aeropuertoId,
            firId: data.firId,
            sector: data.sector
        });
    }

    async markAsRead(id: number) {
        return this.notificationRepository.update(id, { read: true });
    }

    async markAllAsRead(user: any) {
        const notifications = await this.findAll(user);
        const ids = notifications.filter(n => !n.read).map(n => n.id);

        if (ids.length > 0) {
            await this.notificationRepository.update(
                { id: In(ids) },
                { read: true }
            );
        }

        return { count: ids.length };
    }
}

