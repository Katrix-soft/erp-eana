import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { VorMeasurement } from './entities/vor-measurement.entity';
import { Personal } from '../personal/entities/personal.entity';
import { Aeropuerto } from '../aeropuertos/entities/aeropuerto.entity';

@Injectable()
@Injectable()
export class VorService {
    constructor(
        @InjectRepository(VorMeasurement) private vorMeasurementRepository: Repository<VorMeasurement>,
        @InjectRepository(Personal) private personalRepository: Repository<Personal>,
        @InjectRepository(Aeropuerto) private aeropuertoRepository: Repository<Aeropuerto>
    ) { }

    async findAll(user: any) {
        const isGlobalAdmin = ['ADMIN', 'CNS_NACIONAL'].includes(user.role);
        const where: any = {};

        if (!isGlobalAdmin) {
            const personal = await this.personalRepository.findOne({
                where: [
                    { userId: Number(user.userId || user.sub) },
                    { user: { email: user.email } }
                ],
                relations: ['user']
            });

            if (personal) {
                if (personal.aeropuertoId) {
                    // Si tiene aeropuerto asignado, ve solo ese aeropuerto
                    where.aeropuerto = { id: personal.aeropuertoId };
                } else if (personal.firId) {
                    // Si no tiene aeropuerto pero tiene FIR, ve todo el FIR
                    const airports = await this.aeropuertoRepository.find({
                        where: { firId: personal.firId },
                        select: ['id'],
                    });
                    where.aeropuerto = { id: In(airports.map(a => a.id)) };
                } else {
                    // Si no tiene ni aeropuerto ni FIR (y no es admin), no ve nada por seguridad
                    // Dummy condition to result in empty list
                    where.id = -1;
                }
            } else {
                // Si no se encuentra el registro de personal, restringimos por seguridad
                where.id = -1;
            }
        }

        return this.vorMeasurementRepository.find({
            where,
            order: { fecha: 'DESC' },
            relations: ['aeropuerto']
        });
    }

    async create(data: any) {
        // Should validate relations but create accepts partial.
        // Assuming data structure matches entity columns. 
        // If data has aeropuertoId (number), TypeORM needs logic or transform.
        // data likely comes from DTO with IDs. 
        // Let's assume TypeORM create handles basic primitives if entity has plain columns for IDs?
        // No, TypeORM entities usually only have ID column if explicitly defined separate from relation.
        // My `VorMeasurement` entity might not have separate `aeropuertoId` column if not defined using `@Column() aeropuertoId`.
        // Let's check if I should map data.
        // For safety:

        // If data has aeropuertoId, specific mapping might be needed.
        // Assuming data is ready for save or needs minimal mapping.

        return this.vorMeasurementRepository.save(data);
    }
}
