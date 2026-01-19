import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { Personal } from '../personal/entities/personal.entity';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notification) private notificationRepository: Repository<Notification>,
        @InjectRepository(Personal) private personalRepository: Repository<Personal>
    ) { }

    async findAll(user: any) {
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
                // (firId matches AND (sector is null OR sector matches))
                whereCondition += ` OR (n.firId = :userFirId AND (n.sector IS NULL OR n.sector = :userSector))`;
                params.userFirId = userFirId;
                params.userSector = userSector;

                // Notifications for ANY airport within this FIR (optionally filtered by sector)
                // We need to check if n.aeropuerto is in this FIR.
                whereCondition += ` OR (aeropuerto.firId = :userFirId AND (n.sector IS NULL OR n.sector = :userSector))`;
            } else if (personal.aeropuertoId) {
                // Notifications for specific airport
                whereCondition += ` OR (n.aeropuertoId = :aeropuertoId AND (n.sector IS NULL OR n.sector = :userSector))`;
                params.aeropuertoId = personal.aeropuertoId;
                params.userSector = userSector; // Refresh if needed, same var
            }
        }

        qb.where(whereCondition, params);

        return qb.getMany();
    }

    async create(data: { message: string, type?: string, userId?: number, aeropuertoId?: number, firId?: number, sector?: any }) {
        const notification = this.notificationRepository.create({
            message: data.message,
            type: data.type || 'INFO',
            userId: data.userId,
            aeropuertoId: data.aeropuertoId,
            firId: data.firId,
            sector: data.sector
        });
        return this.notificationRepository.save(notification);
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
