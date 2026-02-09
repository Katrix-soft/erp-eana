
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Energia } from './entities/energia.entity';
import { TableroElectrico, ComponenteTablero } from './entities/tablero-electrico.entity';
import { Personal } from '../personal/entities/personal.entity';

@Injectable()
export class EnergiaService {
    private readonly logger = new Logger(EnergiaService.name);

    constructor(
        @InjectRepository(Energia) private energiaRepository: Repository<Energia>,
        @InjectRepository(TableroElectrico) private tableroRepository: Repository<TableroElectrico>,
        @InjectRepository(ComponenteTablero) private componenteRepository: Repository<ComponenteTablero>,
        @InjectRepository(Personal) private personalRepository: Repository<Personal>
    ) { }

    async findAll(user: any, filters?: { aeropuerto?: string, fir?: string }) {
        const userId = Number(user.userId || user.sub);
        const isGlobalAdmin = ['ADMIN', 'CNS_NACIONAL'].includes(user.role);

        const qb = this.energiaRepository.createQueryBuilder('energia')
            .leftJoinAndSelect('energia.aeropuerto', 'aeropuerto')
            .leftJoinAndSelect('energia.firRel', 'firRel')
            .orderBy('energia.referencia', 'ASC');

        if (!isGlobalAdmin) {
            const personal = await this.personalRepository.findOne({
                where: { userId: userId },
                relations: ['aeropuerto', 'fir']
            });

            if (personal) {
                if (personal.aeropuertoId) {
                    qb.andWhere(new Brackets(qb2 => {
                        qb2.where('energia.aeropuertoId = :aptId', { aptId: personal.aeropuertoId })
                            .orWhere('energia.siglasLocal ILIKE :aptCode', { aptCode: personal.aeropuerto?.codigo || '' });
                    }));
                } else if (personal.firId || personal.aeropuerto?.firId) {
                    const effectiveFirId = personal.firId || personal.aeropuerto?.firId;
                    qb.andWhere('energia.firId = :firId', { firId: effectiveFirId });
                }
            } else {
                return [];
            }
        } else {
            if (filters?.aeropuerto) {
                qb.andWhere(new Brackets(qb2 => {
                    qb2.where('energia.siglasLocal ILIKE :apt', { apt: filters.aeropuerto })
                        .orWhere('energia.oaci ILIKE :apt', { apt: filters.aeropuerto })
                        .orWhere('energia.referencia ILIKE :apt', { apt: `%${filters.aeropuerto}%` });
                }));
            }
            if (filters?.fir) {
                const firName = filters.fir.replace(/^FIR\s+/i, '').trim();
                qb.andWhere('firRel.nombre ILIKE :firName', { firName: `%${firName}%` });
            }
        }

        return qb.getMany();
    }

    async findOne(id: number) {
        return this.energiaRepository.findOne({
            where: { id },
            relations: ['aeropuerto', 'firRel']
        });
    }

    async updateStatus(id: number, estado: any) {
        await this.energiaRepository.update(id, { estado });
        return this.findOne(id);
    }

    // --- Métodos para Tableros Eléctricos ---

    async findAllTableros(user: any, filters?: { aeropuerto?: string }) {
        const userId = Number(user.userId || user.sub);
        const isGlobalAdmin = ['ADMIN', 'CNS_NACIONAL'].includes(user.role);

        const qb = this.tableroRepository.createQueryBuilder('tablero')
            .leftJoinAndSelect('tablero.aeropuerto', 'aeropuerto')
            .leftJoinAndSelect('tablero.componentes', 'componentes')
            .orderBy('tablero.nombre', 'ASC');

        if (!isGlobalAdmin) {
            const personal = await this.personalRepository.findOne({
                where: { userId: userId },
                relations: ['aeropuerto']
            });

            if (personal && personal.aeropuertoId) {
                qb.andWhere('tablero.aeropuertoId = :aptId', { aptId: personal.aeropuertoId });
            } else {
                return [];
            }
        } else if (filters?.aeropuerto) {
            qb.andWhere('aeropuerto.codigo ILIKE :apt', { apt: filters.aeropuerto });
        }

        return qb.getMany();
    }

    async findTablero(id: number) {
        return this.tableroRepository.findOne({
            where: { id },
            relations: ['aeropuerto', 'componentes']
        });
    }

    async createTablero(data: Partial<TableroElectrico>) {
        const tablero = this.tableroRepository.create(data);
        return this.tableroRepository.save(tablero);
    }

    async addComponente(tableroId: number, data: Partial<ComponenteTablero>) {
        const componente = this.componenteRepository.create({
            ...data,
            tableroId
        });
        return this.componenteRepository.save(componente);
    }
}
