import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, ILike, Brackets } from 'typeorm';
import { Equipo } from '../equipos/entities/equipo.entity';
import { Vhf } from '../vhf/entities/vhf.entity';
import { Aeropuerto } from '../aeropuertos/entities/aeropuerto.entity';
import { Personal } from '../personal/entities/personal.entity';
import { EstadoEquipo } from '../common/enums/shared.enums';

@Injectable()
export class VhfEquiposService {
    constructor(
        @InjectRepository(Equipo) private equipoRepository: Repository<Equipo>,
        @InjectRepository(Vhf) private vhfRepository: Repository<Vhf>,
        @InjectRepository(Aeropuerto) private aeropuertoRepository: Repository<Aeropuerto>,
        @InjectRepository(Personal) private personalRepository: Repository<Personal>
    ) { }

    async getStatistics(user: any, filters?: { fir?: string; aeropuerto?: string }) {
        console.log('📊 VhfEquiposService.getStatistics', { user: user.email, userId: user.userId, role: user.role });

        const isGlobalAdmin = ['ADMIN', 'CNS_NACIONAL'].includes(user.role);
        const qb = this.equipoRepository.createQueryBuilder('equipo')
            .leftJoinAndSelect('equipo.vhf', 'vhf');

        if (!isGlobalAdmin) {
            const personal = await this.personalRepository.findOne({
                where: { userId: Number(user.userId) },
                relations: ['aeropuerto', 'fir']
            });

            if (personal) {
                if (personal.aeropuerto) {
                    qb.andWhere(new Brackets(qb2 => {
                        qb2.where('vhf.aeropuerto ILIKE :aptName', { aptName: personal.aeropuerto.nombre })
                            .orWhere('vhf.aeropuerto ILIKE :aptCode', { aptCode: personal.aeropuerto.codigo })
                            .orWhere('vhf.sitio ILIKE :aptName', { aptName: personal.aeropuerto.nombre })
                            .orWhere('vhf.sitio ILIKE :aptCode', { aptCode: personal.aeropuerto.codigo });
                    }));
                } else if (personal.fir) {
                    const firName = personal.fir.nombre.replace(/^FIR\s+/i, '').trim();
                    qb.andWhere('vhf.fir ILIKE :firName', { firName: `%${firName}%` });
                }
            } else {
                console.warn(`⚠️ User ${user.email} has no linked Personal record.`);
                return [];
            }
        } else {
            if (filters?.aeropuerto) {
                const val = filters.aeropuerto.trim();
                const airportInfo = await this.aeropuertoRepository.findOne({
                    where: [
                        { nombre: ILike(val) },
                        { codigo: ILike(val) }
                    ]
                });

                let searchVals = [val];
                if (airportInfo) {
                    if (airportInfo.nombre) searchVals.push(airportInfo.nombre);
                    if (airportInfo.codigo) searchVals.push(airportInfo.codigo);
                }

                qb.andWhere(new Brackets(qb2 => {
                    searchVals.forEach((v, i) => {
                        qb2.orWhere(`vhf.aeropuerto ILIKE :val${i}`, { [`val${i}`]: v })
                            .orWhere(`vhf.sitio ILIKE :val${i}`, { [`val${i}`]: v });
                    });
                }));
            }
            if (filters?.fir) {
                const firName = filters.fir.replace(/^FIR\s+/i, '').trim();
                qb.andWhere('vhf.fir ILIKE :firName', { firName: `%${firName}%` });
            }
        }

        const equipos = await qb.getMany();

        // Normalization Logic
        const allAirports = await this.aeropuertoRepository.find({
            select: ['nombre', 'codigo']
        });

        const airportMap = new Map<string, string>();
        allAirports.forEach(a => {
            if (a.codigo) airportMap.set(a.codigo.toUpperCase(), a.nombre);
            if (a.nombre) airportMap.set(a.nombre.toUpperCase(), a.nombre);
        });

        const getCanonicalAirportName = (raw: string | undefined | null) => {
            if (!raw) return 'Sin Aeropuerto';
            const clean = raw.trim().toUpperCase();
            if (clean === 'DOZ') return 'Mendoza';
            return airportMap.get(clean) || raw;
        };

        const groupedByAirport = new Map<string, any>();

        equipos.forEach(equipo => {
            const rawAirport = equipo.vhf?.aeropuerto || 'Sin Aeropuerto';
            const airportCode = getCanonicalAirportName(rawAirport);
            const fir = equipo.vhf?.fir || 'Sin FIR';

            if (!groupedByAirport.has(airportCode)) {
                groupedByAirport.set(airportCode, {
                    name: airportCode,
                    fir: fir,
                    totalEquipments: 0,
                    operationalCount: 0,
                    warningCount: 0,
                    errorCount: 0,
                    breakdown: {}
                });
            }

            const airportData = groupedByAirport.get(airportCode);
            airportData.totalEquipments++;

            const tipo = equipo.tipoEquipo || 'Otros';
            airportData.breakdown[tipo] = (airportData.breakdown[tipo] || 0) + 1;

            const estado = equipo.estado;

            if (estado === EstadoEquipo.OK) {
                airportData.operationalCount++;
            } else if (estado === EstadoEquipo.NOVEDAD) {
                airportData.warningCount++;
            } else if (estado === EstadoEquipo.FUERA_SERVICIO) {
                airportData.errorCount++;
            } else {
                airportData.operationalCount++;
            }
        });

        const result = Array.from(groupedByAirport.values()).map(airport => {
            const total = airport.totalEquipments;
            const operational = airport.operationalCount;
            const availability = total > 0 ? Math.round((operational / total) * 100) : 0;
            return { ...airport, availability };
        });

        console.log(`✅ Estadísticas generadas para ${result.length} aeropuertos (Normalizado)`);
        return result;
    }

    async findAll(user: any, filters?: { sector?: string; aeropuerto?: string; fir?: string }) {
        const isGlobalAdmin = ['ADMIN', 'CNS_NACIONAL'].includes(user.role);

        const qb = this.equipoRepository.createQueryBuilder('equipo')
            .leftJoinAndSelect('equipo.vhf', 'vhf')
            .leftJoinAndSelect('equipo.frecuencias', 'frecuencias')
            // .leftJoinAndSelect('equipo.checklists', 'checklists') // Assuming relation exists
            .orderBy('equipo.createdAt', 'DESC');

        if (!isGlobalAdmin) {
            const personal = await this.personalRepository.findOne({
                where: { userId: Number(user.userId) },
                relations: ['aeropuerto', 'fir']
            });

            if (personal) {
                if (personal.aeropuerto) {
                    qb.andWhere(new Brackets(qb2 => {
                        qb2.where('vhf.aeropuerto ILIKE :aptName', { aptName: personal.aeropuerto.nombre })
                            .orWhere('vhf.aeropuerto ILIKE :aptCode', { aptCode: personal.aeropuerto.codigo })
                            .orWhere('vhf.sitio ILIKE :aptName', { aptName: personal.aeropuerto.nombre })
                            .orWhere('vhf.sitio ILIKE :aptCode', { aptCode: personal.aeropuerto.codigo });
                    }));
                } else if (personal.fir) {
                    const firName = personal.fir.nombre.replace(/^FIR\s+/i, '').trim();
                    qb.andWhere('vhf.fir ILIKE :firName', { firName: `%${firName}%` });
                }
            } else {
                return [];
            }
        } else {
            if (filters?.aeropuerto) {
                const val = filters.aeropuerto.trim();
                qb.andWhere(new Brackets(qb2 => {
                    qb2.where('vhf.aeropuerto ILIKE :val', { val })
                        .orWhere('vhf.sitio ILIKE :val', { val });
                }));
            }
            if (filters?.fir) {
                const firName = filters.fir.replace(/^FIR\s+/i, '').trim();
                qb.andWhere('vhf.fir ILIKE :firName', { firName: `%${firName}%` });
            }
        }

        const equipos = await qb.getMany();
        console.log(`📡 VhfEquiposService.findAll: Found ${equipos.length} equipments`);

        // Normalization
        const allAirports = await this.aeropuertoRepository.find();
        const airportMap = new Map<string, { name: string, id: number, firId: number }>();
        allAirports.forEach(a => {
            const data = { name: a.nombre, id: a.id, firId: a.firId };
            if (a.codigo) airportMap.set(a.codigo.toUpperCase(), data);
            if (a.nombre) airportMap.set(a.nombre.toUpperCase(), data);
        });

        const getCanonicalAirportData = (raw: string | undefined | null) => {
            if (!raw) return null;
            const clean = raw.trim().toUpperCase();
            if (clean === 'DOZ' || clean === 'SAME') return airportMap.get('MENDOZA');
            if (clean === 'EZE' || clean === 'SAEZ') return airportMap.get('EZEIZA');
            return airportMap.get(clean);
        };

        return equipos.map((equipo: any) => {
            let aeropuertoId = null;
            let firId = null;

            if (equipo.vhf && equipo.vhf.aeropuerto) {
                const data = getCanonicalAirportData(equipo.vhf.aeropuerto);
                if (data) {
                    equipo.vhf.aeropuerto = data.name;
                    aeropuertoId = data.id;
                    firId = data.firId;
                } else if (equipo.vhf.aeropuerto.toUpperCase().trim() === 'DOZ') {
                    equipo.vhf.aeropuerto = 'Mendoza';
                }
            }

            // Extract frequency: try relation first, then fallback to original property if it somehow exists
            const frecuencia = equipo.frecuencias && equipo.frecuencias.length > 0
                ? equipo.frecuencias[0].frecuencia
                : (equipo.frecuencia || null);

            if (!frecuencia) {
                console.warn(`⚠️ Equipment ${equipo.id} (${equipo.marca} ${equipo.modelo}) has NO frequency associated.`);
            }

            const lastChecklistDate = equipo.createdAt; // Temporary fallback

            return {
                ...equipo,
                vhf: {
                    ...equipo.vhf,
                    aeropuertoId,
                    firId
                },
                frecuencia,
                lastChecklistDate
            };
        });
    }

    async getList(user: any, filters?: { sector?: string; aeropuerto?: string; fir?: string }) {
        return this.findAll(user, filters);
    }

    async getDropdown() {
        return this.equipoRepository.find({
            relations: ['vhf'],
            take: 100,
            select: ['id', 'marca', 'modelo', 'tipoEquipo']
        });
    }

    async getFullDetails(id: number) {
        return this.equipoRepository.findOne({
            where: { id },
            relations: ['vhf', 'canales', 'canales.frecuencias', 'frecuencias']
        });
    }

    async findOne(id: number) {
        return this.getFullDetails(id);
    }

    async create(data: any) {
        return this.equipoRepository.save(data);
    }

    async update(id: number, data: any) {
        await this.equipoRepository.update(id, data);
        return this.findOne(id);
    }

    async remove(id: number) {
        return this.equipoRepository.delete(id);
    }
}
