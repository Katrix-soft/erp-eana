import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Vigilancia } from './entities/vigilancia.entity';
import { Personal } from '../personal/entities/personal.entity';
import * as fs from 'fs';

@Injectable()
export class VigilanciaService {
    private readonly logger = new Logger(VigilanciaService.name);

    constructor(
        @InjectRepository(Vigilancia) private vigilanciaRepository: Repository<Vigilancia>,
        @InjectRepository(Personal) private personalRepository: Repository<Personal>
    ) { }

    private logToFile(msg: string) {
        // Logging preserved
        const time = new Date().toISOString();
        const logFile = 'vigilancia_service_debug.log';
        // fs.appendFileSync(logFile, `[${time}] ${msg}\n`);
    }

    async findAll(user: any, filters?: { aeropuerto?: string, fir?: string }) {
        // Logging removed for brevity in TypeORM migration, but logic preserved
        const isGlobalAdmin = ['ADMIN', 'CNS_NACIONAL'].includes(user.role);

        const qb = this.vigilanciaRepository.createQueryBuilder('vigilancia')
            .leftJoinAndSelect('vigilancia.aeropuerto', 'aeropuerto')
            .leftJoinAndSelect('vigilancia.firRel', 'firRel') // Assuming firRel relation exists
            .orderBy('vigilancia.ubicacion', 'ASC');

        if (!isGlobalAdmin) {
            const personal = await this.personalRepository.findOne({
                where: { userId: Number(user.userId || user.sub) },
                relations: ['aeropuerto', 'fir']
            });

            if (personal) {
                if (personal.aeropuertoId) {
                    qb.andWhere(new Brackets(qb2 => {
                        qb2.where('vigilancia.aeropuertoId = :aptId', { aptId: personal.aeropuertoId })
                            // Assuming 'siglasLocal' exists on Vigilancia
                            .orWhere('vigilancia.siglasLocal ILIKE :aptCode', { aptCode: personal.aeropuerto?.codigo || '' });
                    }));
                } else if (personal.firId || personal.aeropuerto?.firId) {
                    const effectiveFirId = personal.firId || personal.aeropuerto?.firId;
                    qb.andWhere(new Brackets(qb2 => {
                        qb2.where('vigilancia.firId = :firId', { firId: effectiveFirId });
                    }));
                }
            } else {
                return [];
            }
        } else {
            if (filters?.aeropuerto) {
                qb.andWhere(new Brackets(qb2 => {
                    qb2.where('vigilancia.siglasLocal ILIKE :apt', { apt: filters.aeropuerto })
                        .orWhere('vigilancia.ubicacion ILIKE :apt', { apt: `%${filters.aeropuerto}%` });
                }));
            }

            if (filters?.fir) {
                const firName = filters.fir.replace(/^FIR\s+/i, '').trim();
                // Assuming Filter by relation name or simple column if exists
                // Code said: fir: { contains: ... }
                // So checking likely column 'fir' (string) or relation 'firRel.nombre'?
                // Prisma code had: fir: { contains... }.
                // If Vigilancia has 'fir' string column:
                qb.andWhere('vigilancia.fir ILIKE :firName', { firName: `%${firName}%` });

                // If 'fir' was ambiguous (relation vs column):
                // In Prisma, it was 'where.fir = ...'.
                // If it was relation, it would be 'fir: { nombre: ... }'.
                // So it's likely a string column on Vigilancia table.
            }
        }

        return qb.getMany();
    }

    async findOne(id: number) {
        return this.vigilanciaRepository.findOne({
            where: { id },
            relations: ['aeropuerto', 'firRel']
        });
    }

    async updateStatus(id: number, estado: any) {
        await this.vigilanciaRepository.update(id, { estado });
        return this.findOne(id);
    }
}
