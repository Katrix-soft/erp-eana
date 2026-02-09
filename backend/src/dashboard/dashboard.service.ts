
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
                    const aeroNombre = personal.aeropuerto?.nombre; // e.g. "Malargue"
                    const aeroCodigo = personal.aeropuerto?.codigo; // e.g. "MLG"

                    this.logger.log(`🔍 Filtering for user: aeroId=${aeroId}, aeroNombre=${aeroNombre}, aeroCodigo=${aeroCodigo}`);

                    // Filter VHF by aeropuerto_id (foreign key) OR text matching for robustness
                    commsQb.andWhere('(vhf.aeropuertoId = :aeroId OR vhf.aeropuerto ILIKE :aeroNombre_exact OR vhf.aeropuerto ILIKE :aeroNombre_with_accent OR vhf.aeropuerto ILIKE :aeroCodigo)', {
                        aeroId,
                        aeroNombre_exact: aeroNombre,
                        aeroNombre_with_accent: aeroNombre ? aeroNombre.replace('u', 'ü').replace('U', 'Ü') : '', // Handle Malargüe
                        aeroCodigo: `%${aeroCodigo}%`
                    });

                    // Filter Navigation with fallback
                    navQb.andWhere('(navegacion.aeropuertoId = :aeroId OR navegacion.oaci = :aeroCodigo OR navegacion.siglasLocal = :aeroCodigo OR navegacion.nombre ILIKE :aeroNombre)', {
                        aeroId,
                        aeroCodigo,
                        aeroNombre: `%${aeroNombre}%`
                    });

                    // Filter Surveillance with fallback - join airport to filter by name properly
                    vigQb.leftJoin('vigilancia.aeropuerto', 'v_aero')
                        .andWhere('(vigilancia.aeropuertoId = :aeroId OR v_aero.nombre ILIKE :aeroNombre OR vigilancia.siglasLocal = :aeroCodigo OR vigilancia.ubicacion ILIKE :aeroNombre)', {
                            aeroId,
                            aeroNombre: `%${aeroNombre}%`,
                            aeroCodigo
                        });

                    // Filter Energy with fallback - join airport to filter by name properly
                    enerQb.leftJoin('energia.aeropuerto', 'e_aero')
                        .andWhere('(energia.aeropuertoId = :aeroId OR e_aero.nombre ILIKE :aeroNombre OR energia.oaci = :aeroCodigo OR energia.siglasLocal = :aeroCodigo)', {
                            aeroId,
                            aeroNombre: `%${aeroNombre}%`,
                            aeroCodigo
                        });
                } else if (personal.firId) {
                    // Filter by FIR logic if needed
                    this.logger.log(`🔍 Filtering by FIR: ${personal.firId}`);
                }
            } else {
                this.logger.log(`🌍 Global admin view - no filtering applied`);
            }

            // 4. Exec Queries
            const [comms, nav, vig, ener] = await Promise.all([
                commsQb.getMany(),
                navQb.getMany(),
                vigQb.getMany(),
                enerQb.getMany()
            ]);

            this.logger.log(`📊 Dashboard Counts: VHF Equipments=${comms.length}, Nav=${nav.length}, Vig=${vig.length}, Ener=${ener.length}`);

            // Log sample data for debugging
            if (comms.length > 0) {
                this.logger.log(`📡 Sample comm equipment: ${JSON.stringify({
                    id: comms[0].id,
                    vhfId: comms[0].vhfId,
                    estado: comms[0].estado,
                    vhf: comms[0].vhf ? { sitio: comms[0].vhf.sitio, aeropuerto: comms[0].vhf.aeropuerto } : null
                })}`);
            } else {
                this.logger.warn(`⚠️ No communication equipments found!`);
            }

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
