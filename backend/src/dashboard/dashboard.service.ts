import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Equipo } from '../equipos/entities/equipo.entity';
import { Navegacion } from '../navegacion/entities/navegacion.entity';
import { Vigilancia } from '../vigilancia/entities/vigilancia.entity';
import { Energia } from '../energia/entities/energia.entity';
import { Personal } from '../personal/entities/personal.entity';

@Injectable()
export class DashboardService {
    private readonly logger = new Logger(DashboardService.name);

    constructor(
        @InjectRepository(Equipo) private equipoRepository: Repository<Equipo>,
        @InjectRepository(Navegacion) private navegacionRepository: Repository<Navegacion>,
        @InjectRepository(Vigilancia) private vigilanciaRepository: Repository<Vigilancia>,
        @InjectRepository(Energia) private energiaRepository: Repository<Energia>,
        @InjectRepository(Personal) private personalRepository: Repository<Personal>
    ) { }

    async getSummary(user: any) {
        const userId = Number(user.userId || user.sub);
        const isGlobalAdmin = ['ADMIN', 'CNS_NACIONAL'].includes(user.role);

        // 1. Get User Context
        let personal: Personal | null = null;
        if (!isGlobalAdmin) {
            personal = await this.personalRepository.findOne({
                where: [
                    { userId: userId }
                    // OR condition for email if needed, but userId is safer. Assuming relation user exists if strictly needed, but let's stick to userId.
                ],
                relations: ['aeropuerto', 'fir'],
            });
        }

        // 2. Build Base Filters & QueryBuilders
        const commsQb = this.equipoRepository.createQueryBuilder('equipo')
            .leftJoinAndSelect('equipo.vhf', 'vhf')
            .select(['equipo.estado', 'vhf.aeropuerto']);

        const navQb = this.navegacionRepository.createQueryBuilder('navegacion')
            .leftJoinAndSelect('navegacion.equipos', 'equipos')
            .select(['navegacion.id', 'equipos.estado']); // Minimal select

        const vigQb = this.vigilanciaRepository.createQueryBuilder('vigilancia')
            .select(['vigilancia.estado']);

        const enerQb = this.energiaRepository.createQueryBuilder('energia')
            .select(['energia.estado']);

        if (personal) {
            if (personal.aeropuertoId) {
                // VHF Filters
                const aeroCode = personal.aeropuerto?.codigo || '';
                const aeroName = personal.aeropuerto?.nombre || '';

                commsQb.andWhere(new Brackets(qb => {
                    qb.where('vhf.aeropuerto ILIKE :aeroCode', { aeroCode })
                        .orWhere('vhf.aeropuerto ILIKE :aeroName', { aeroName })
                        .orWhere('vhf.sitio ILIKE :aeroName', { aeroName });
                }));

                // Other Services Filters
                navQb.andWhere('navegacion.aeropuertoId = :aeropuertoId', { aeropuertoId: personal.aeropuertoId });
                vigQb.andWhere('vigilancia.aeropuertoId = :aeropuertoId', { aeropuertoId: personal.aeropuertoId });
                enerQb.andWhere('energia.aeropuertoId = :aeropuertoId', { aeropuertoId: personal.aeropuertoId });

            } else if (personal.firId) {
                const firName = personal.fir?.nombre.replace(/^FIR\s+/i, '').trim();

                commsQb.andWhere('vhf.fir ILIKE :firName', { firName: `%${firName}%` });
                navQb.andWhere('navegacion.firId = :firId', { firId: personal.firId });
                vigQb.andWhere('vigilancia.firId = :firId', { firId: personal.firId });
                enerQb.andWhere('energia.firId = :firId', { firId: personal.firId });
            }
        }

        // 3. Fetch Data Paradoxically (Async)
        const [comms, nav, vig, ener] = await Promise.all([
            commsQb.getMany(),
            navQb.getMany(),
            vigQb.getMany(),
            enerQb.getMany(),
        ]);

        // 4. Transform & Aggregate
        const stats = {
            comms: this.aggregateStatus(comms),
            nav: this.aggregateNavStatus(nav),
            vig: this.aggregateStatus(vig),
            ener: this.aggregateStatus(ener),
        };

        // 5. Total Global Status
        const global = {
            total: stats.comms.total + stats.nav.total + stats.vig.total + stats.ener.total,
            operational: stats.comms.operational + stats.nav.operational + stats.vig.operational + stats.ener.operational,
            warning: stats.comms.warning + stats.nav.warning + stats.vig.warning + stats.ener.warning,
            danger: stats.comms.danger + stats.nav.danger + stats.vig.danger + stats.ener.danger,
        };

        return {
            global,
            categories: stats,
            context: personal ? {
                aeropuerto: personal.aeropuerto?.nombre,
                fir: personal.fir?.nombre,
            } : { role: 'ADMIN' }
        };
    }

    private aggregateStatus(items: any[]) {
        const result = { total: items.length, operational: 0, warning: 0, danger: 0 };
        items.forEach(item => {
            const status = item.estado || 'OK';
            if (status === 'OK') result.operational++;
            else if (status === 'NOVEDAD') result.warning++;
            else result.danger++;
        });
        return result;
    }

    private aggregateNavStatus(items: any[]) {
        let total = 0;
        let operational = 0;
        let warning = 0;
        let danger = 0;

        items.forEach(nav => {
            if (nav.equipos && nav.equipos.length > 0) {
                nav.equipos.forEach(eq => {
                    total++;
                    if (eq.estado === 'OK') operational++;
                    else if (eq.estado === 'NOVEDAD') warning++;
                    else danger++;
                });
            } else {
                // If no teams, count the facility itself as operational placeholder
                total++;
                operational++;
            }
        });

        return { total, operational, warning, danger };
    }
}
