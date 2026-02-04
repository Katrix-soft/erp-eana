
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Equipo } from '../equipos/entities/equipo.entity';
import { Navegacion } from '../navegacion/entities/navegacion.entity';
import { Vigilancia } from '../vigilancia/entities/vigilancia.entity';
import { Energia } from '../energia/entities/energia.entity';
import { Personal } from '../personal/entities/personal.entity';
import { Vhf } from '../vhf/entities/vhf.entity';
import { Vor } from '../vor/entities/vor.entity'; // Aunque sea dummy por ahora

@Injectable()
export class DashboardService {
    private readonly logger = new Logger('DashboardService');

    constructor(
        @InjectRepository(Equipo) private equipoRepository: Repository<Equipo>,
        @InjectRepository(Navegacion) private navegacionRepository: Repository<Navegacion>,
        @InjectRepository(Vigilancia) private vigilanciaRepository: Repository<Vigilancia>,
        @InjectRepository(Energia) private energiaRepository: Repository<Energia>,
        @InjectRepository(Personal) private personalRepository: Repository<Personal>,
        @InjectRepository(Vhf) private vhfRepository: Repository<Vhf>
    ) { }

    async getSummary(user: any) {
        try {
            const userId = Number(user.userId || user.sub || user.id);
            const isGlobalAdmin = ['ADMIN', 'CNS_NACIONAL'].includes(user.role);

            // 1. Get User Context
            const personal = await this.personalRepository.findOne({
                where: { userId: userId },
                relations: ['aeropuerto', 'fir'],
            });

            // 2. Prepare Queries
            // 2. Prepare Queries
            // Communications: Query 'Equipo' directly to get the REAL count of equipments, not just sites
            const commsQb = this.equipoRepository.createQueryBuilder('equipo')
                .leftJoinAndSelect('equipo.vhf', 'vhf')
                .where('equipo.vhfId IS NOT NULL');

            // Navigation: Use Navegacion table (assuming it's populated for services)
            const navQb = this.navegacionRepository.createQueryBuilder('navegacion').leftJoinAndSelect('navegacion.equipos', 'equipos');

            // Surveillance & Energy
            const vigQb = this.vigilanciaRepository.createQueryBuilder('vigilancia');
            const enerQb = this.energiaRepository.createQueryBuilder('energia');

            // 3. Apply Filtering
            if (!isGlobalAdmin && personal) {
                if (personal.aeropuertoId) {
                    const aeroId = personal.aeropuertoId;
                    const aeroNombre = personal.aeropuerto?.nombre; // e.g. "SAEZ", "EZE"

                    // Filter VHF (via joined relation)
                    if (aeroNombre) {
                        commsQb.andWhere('vhf.aeropuerto = :aeroNombre', { aeroNombre });
                    }

                    // Filter others by ID
                    navQb.andWhere('navegacion.aeropuertoId = :aeroId', { aeroId });
                    vigQb.andWhere('vigilancia.aeropuertoId = :aeroId', { aeroId });
                    enerQb.andWhere('energia.aeropuertoId = :aeroId', { aeroId });
                } else if (personal.firId) {
                    // Filter by FIR logic if needed (not fully implemented in CSV imports yet)
                }
            }

            // 4. Exec Queries
            const [comms, nav, vig, ener] = await Promise.all([
                commsQb.getMany(),
                navQb.getMany(),
                vigQb.getMany(),
                enerQb.getMany()
            ]);

            this.logger.log(`📊 Dashboard Counts: VHF Equipments=${comms.length}, Nav=${nav.length}, Vig=${vig.length}, Ener=${ener.length}`);

            // 5. Aggregate Stats
            const stats = {
                // Now comms is a list of equipments, so we use the standard aggregation
                comms: this.aggregateStatus(comms),
                nav: this.aggregateNavStatus(nav),
                vig: this.aggregateStatus(vig),
                ener: this.aggregateStatus(ener)
            };

            const global = {
                total: stats.comms.total + stats.nav.total + stats.vig.total + stats.ener.total,
                operational: stats.comms.operational + stats.nav.operational + stats.vig.operational + stats.ener.operational,
                warning: stats.comms.warning + stats.nav.warning + stats.vig.warning + stats.ener.warning,
                danger: stats.comms.danger + stats.nav.danger + stats.vig.danger + stats.ener.danger
            };

            return {
                global,
                categories: stats,
                context: {
                    user: `${personal?.nombre || user.email} ${personal?.apellido || ''}`.trim(),
                    aeropuerto: personal?.aeropuerto?.nombre,
                    fir: personal?.fir?.nombre
                }
            };

        } catch (error) {
            this.logger.error('Error in getSummary:', error);
            // Return empty structure on error to prevent frontend crash
            return {
                global: { total: 0, operational: 0, warning: 0, danger: 0 },
                categories: {
                    comms: { total: 0, operational: 0, warning: 0, danger: 0 },
                    nav: { total: 0, operational: 0, warning: 0, danger: 0 },
                    vig: { total: 0, operational: 0, warning: 0, danger: 0 },
                    ener: { total: 0, operational: 0, warning: 0, danger: 0 }
                },
                context: {}
            };
        }
    }

    private aggregateStatus(items: any[]) {
        const res = { total: items.length, operational: 0, warning: 0, danger: 0 };
        items.forEach(i => {
            // Check 'estado' or 'status' or derive from available fields
            const s = (i.estado || i.status || 'OK').toUpperCase();

            if (s === 'OK' || s === 'OPERATIVO' || s === 'NORMAL') res.operational++;
            else if (s === 'NOVEDAD' || s === 'WARNING' || s === 'ALERTA') res.warning++;
            else res.danger++; // FALLA, OUT, etc.
        });
        return res;
    }

    private aggregateNavStatus(items: any[]) {
        const res = { total: 0, operational: 0, warning: 0, danger: 0 };
        items.forEach(nav => {
            if (nav.equipos && nav.equipos.length > 0) {
                nav.equipos.forEach(eq => {
                    res.total++;
                    const s = (eq.estado || 'OK').toUpperCase();
                    if (s === 'OK' || s === 'OPERATIVO') res.operational++;
                    else if (s === 'NOVEDAD' || s === 'WARNING') res.warning++;
                    else res.danger++;
                });
            } else {
                // If it's a Nav service/facility itself
                res.total++;
                const s = (nav.estado || 'OK').toUpperCase();
                if (s === 'OK' || s === 'OPERATIVO') res.operational++;
                else res.danger++;
            }
        });
        return res;
    }

    private aggregateVhfStatus(items: any[]) {
        const res = { total: 0, operational: 0, warning: 0, danger: 0 };
        items.forEach(vhf => {
            if (vhf.equipos && vhf.equipos.length > 0) {
                vhf.equipos.forEach(eq => {
                    res.total++;
                    const s = (eq.estado || 'OK').toUpperCase();
                    if (s === 'OK' || s === 'OPERATIVO') res.operational++;
                    else if (s === 'NOVEDAD' || s === 'WARNING') res.warning++;
                    else res.danger++;
                });
            } else {
                // Should we count the Site/Vhf itself if no equipment? 
                // Let's say yes, assuming it's a valid location but maybe lacks detailed inventory
                res.total++;
                res.operational++; // Default to operational if no detailed equipment info
            }
        });
        return res;
    }
}
