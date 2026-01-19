import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { WorkOrder } from './entities/work-order.entity';
import { Personal } from '../personal/entities/personal.entity';
import { Equipo } from '../equipos/entities/equipo.entity';
import { EstadoEquipo, EstadoOT, Prioridad } from '../common/enums/shared.enums';

@Injectable()
export class WorkOrdersService {
    constructor(
        @InjectRepository(WorkOrder) private workOrderRepository: Repository<WorkOrder>,
        @InjectRepository(Personal) private personalRepository: Repository<Personal>,
        @InjectRepository(Equipo) private equipoRepository: Repository<Equipo>,
    ) { }

    async findAll(user: any, filters?: { estado?: string; prioridad?: string }) {
        const qb = this.workOrderRepository.createQueryBuilder('wo')
            .leftJoinAndSelect('wo.equipo', 'equipo')
            .leftJoinAndSelect('equipo.vhf', 'vhf')
            .leftJoinAndSelect('wo.solicitante', 'solicitante') // User
            .leftJoinAndSelect('solicitante.personal', 'personalSolicitante')
            .leftJoinAndSelect('wo.tecnicoAsignado', 'tecnico') // User
            .leftJoinAndSelect('tecnico.personal', 'personalTecnico')
            .orderBy('wo.createdAt', 'DESC');

        // Context filtering
        if (user.role !== 'ADMIN' && user.role !== 'CNS_NACIONAL') {
            const personal = await this.personalRepository.findOne({
                where: { userId: user.userId },
                relations: ['aeropuerto', 'fir']
            });

            if (personal?.aeropuerto) {
                // Filter by Airport Name (as per original logic using name string in vhf)
                // vhf.aeropuerto is string.
                qb.andWhere('vhf.aeropuerto = :aptName', { aptName: personal.aeropuerto.nombre });
                // If vhf has Aeropuerto RELATION, we would use vhf.aeropuerto.id. 
                // But earlier analysis said Vhf uses Strings.
            } else if (personal?.fir) {
                const firName = personal.fir.nombre.replace(/^FIR\s+/i, '');
                qb.andWhere('vhf.fir ILIKE :firName', { firName: `%${firName}%` });
            }
        }

        if (filters?.estado) {
            qb.andWhere('wo.estado = :estado', { estado: filters.estado });
        }
        if (filters?.prioridad) {
            qb.andWhere('wo.prioridad = :prioridad', { prioridad: filters.prioridad });
        }

        const orders = await qb.getMany();

        // Transform result to match simplified shape if needed, but returning entity is usually fine.
        // The original prisma 'select' limited user fields. TypeORM loads full User usually unless we strictly select.
        // We can map if needed to hide password hash etc.
        return orders.map(o => {
            if (o.solicitante) delete o.solicitante.password;
            if (o.tecnicoAsignado) delete o.tecnicoAsignado.password;
            return o;
        });
    }

    async findOne(id: number) {
        return this.workOrderRepository.findOne({
            where: { id },
            relations: [
                'equipo', 'equipo.vhf',
                'solicitante', 'solicitante.personal',
                'tecnicoAsignado', 'tecnicoAsignado.personal',
                'checklist'
            ]
        });
    }

    async update(id: number, data: any) {
        // data might contain sector? ignore it.
        // Updates can be status, assigned tech, etc.
        // Prisma `update` returns updated entity.

        // Handle relations update logic if IDs passed?
        // Usually update just updates fields.

        await this.workOrderRepository.update(id, data);

        const order = await this.findOne(id);
        if (!order) throw new Error("Order not found");

        // ERP Logic: If OT is CLOSED, check if we should set equipment back to OK
        if (data.estado === EstadoOT.CERRADA && order.equipo) {
            await this.equipoRepository.update(order.equipo.id, { estado: EstadoEquipo.OK });
        }

        return order;
    }

    async remove(id: number) {
        return this.workOrderRepository.delete(id);
    }
}
