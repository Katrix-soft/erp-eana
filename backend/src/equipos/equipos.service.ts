import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, In } from 'typeorm';
import { Vhf } from '../vhf/entities/vhf.entity';
import { Equipo } from './entities/equipo.entity';
import { Comunicaciones } from '../comunicaciones/entities/comunicaciones.entity';
import { Navegacion } from '../navegacion/entities/navegacion.entity';
import { EquipoNavegacion } from '../navegacion/entities/equipo-navegacion.entity';
import { Vigilancia } from '../vigilancia/entities/vigilancia.entity';
import { Energia } from '../energia/entities/energia.entity';
import { Aeropuerto } from '../aeropuertos/entities/aeropuerto.entity';
import { Fir } from '../firs/entities/fir.entity';
import { EstadoEquipo } from '../common/enums/shared.enums';

@Injectable()
export class EquiposService {
    constructor(
        @InjectRepository(Comunicaciones) private comunicacionesRepo: Repository<Comunicaciones>,
        @InjectRepository(Vhf) private vhfRepo: Repository<Vhf>,
        @InjectRepository(Equipo) private equipoRepo: Repository<Equipo>, // Equipo VHF
        @InjectRepository(Navegacion) private navegacionRepo: Repository<Navegacion>,
        @InjectRepository(EquipoNavegacion) private equipoNavegacionRepo: Repository<EquipoNavegacion>,
        @InjectRepository(Vigilancia) private vigilanciaRepo: Repository<Vigilancia>,
        @InjectRepository(Energia) private energiaRepo: Repository<Energia>,
        @InjectRepository(Aeropuerto) private aeropuertoRepo: Repository<Aeropuerto>,
        @InjectRepository(Fir) private firRepo: Repository<Fir>,
    ) { }

    async findAll(filters?: { fir?: string; aeropuerto?: string; sector?: string }) {
        console.log('🔍 EquiposService.findAll - Filters:', filters);

        const equipos: any[] = [];

        // Build where helpers for simple tables like Vigilancia, Energia, Comunicaciones
        // They all have 'aeropuerto' relation or 'aeropuertoId'. But original code had implicit joins.
        // Prisma: where.aeropuerto.OR = [nombre, codigo]
        // TypeORM: we need to join 'aeropuerto' alias and filter on it.

        // Helper to add airport/fir filters to a QueryBuilder
        const applyFilters = (qb: any, alias: string) => {
            if (filters?.aeropuerto) {
                // Join airport if not already joined? Assume joined as 'aeropuerto'
                qb.andWhere(
                    `(aeropuerto.nombre ILIKE :apt OR aeropuerto.codigo ILIKE :apt)`,
                    { apt: filters.aeropuerto } // exact match or partial? code said equals or contains depending on block.
                    // filters.aeropuerto usually sends code or name. Old logic: equals name OR equals code.
                    // But then later logic for VHF: contains...
                    // Let's stick to ILIKE for robustness.
                );
            }
            if (filters?.fir) {
                // Join fir? Or check aeropuerto.fir? or table.fir column (text)?
                // Most tables have a 'fir' text column AND relations.
                // Old code: Filters by Relation first.
                // Let's assume relation 'fir' or 'aeropuerto.fir'
                qb.leftJoin('aeropuerto.fir', 'firRel');
                qb.andWhere(`(firRel.nombre ILIKE :fir OR ${alias}.fir ILIKE :fir)`, { fir: `%${filters.fir}%` });
            }
        };

        const showAll = !filters?.sector || filters.sector === 'CNSE';

        // 1. COMUNICACIONES (VHF + Table Comunicaciones?)
        // The original code only queried `Prisma.vhf`. It ignored `Prisma.comunicaciones` table in the 'findAll' block shown!
        // Wait, line 45: "Lógica para buscar en VHF (Nueva estructura importada de Excel)".
        // It seems `VHF` is the source of truth for "Comunicaciones" sector in this view.

        if (showAll || filters.sector === 'COMUNICACIONES') {
            // Query VHF Table
            const qb = this.vhfRepo.createQueryBuilder('vhf')
                .leftJoinAndSelect('vhf.equipos', 'equipo')
                .leftJoinAndSelect('equipo.canales', 'canal')
                .leftJoinAndSelect('canal.frecuencias', 'frecuencia')
            // .leftJoinAndSelect('vhf.aeropuerto', 'apt') // VHF has aeropuerto STRING column, not relation in entity defined earlier?
            // Let's check Vhf entity... defined as `aeropuerto: string`.
            // Ah, the entity definition I wrote earlier for Vhf might be too simple?
            // `c:\Users\exe20\OneDrive\Escritorio\proyecto-Eana\backend-nest\src\vhf\entities\vhf.entity.ts`:
            // @Column() aeropuerto: string;
            // No relation to Aeropuerto entity? The service logic previously implied relations `personal.aeropuerto` matching `vhf.aeropuerto` string.
            // But lines 57-63 in original service fetch Aeropuerto to match string.
            // So VHF table has STRINGs.

            if (filters?.aeropuerto) {
                //  vhfWhere.OR = [ { aeropuerto: { contains... } }, { sitio: { contains... } } ]
                // plus ID lookup logic
                qb.andWhere(`(vhf.aeropuerto ILIKE :apt OR vhf.sitio ILIKE :apt)`, { apt: `%${filters.aeropuerto}%` });
            }
            if (filters?.fir) {
                qb.andWhere(`vhf.fir ILIKE :fir`, { fir: `%${filters.fir}%` });
            }

            const vhfRecords = await qb.getMany();

            // Map to result
            vhfRecords.forEach(vhf => {
                if (vhf.equipos) {
                    vhf.equipos.forEach(eq => {
                        let freq = 0;
                        if (eq.canales && eq.canales.length > 0 && eq.canales[0].frecuencias && eq.canales[0].frecuencias.length > 0) {
                            freq = eq.canales[0].frecuencias[0].frecuencia;
                        }

                        equipos.push({
                            id: eq.id,
                            nombre: `${vhf.sitio} - ${eq.tipoEquipo} ${eq.modelo}`,
                            marca: eq.marca || 'N/A',
                            modelo: eq.modelo || 'N/A',
                            numeroSerie: eq.numeroSerie || 'N/A',
                            tipoEquipo: eq.tipoEquipo || 'COMUNICACIONES',
                            tipo: eq.tipoEquipo,
                            frecuencia: freq,
                            canal: eq.canales && eq.canales.length > 0 ? eq.canales[0].canal : null,
                            estado: eq.estado || 'OK',
                            sector: 'COMUNICACIONES',
                            aeropuerto: { nombre: vhf.aeropuerto, fir: { nombre: vhf.fir } },
                            canales: eq.canales,
                            createdAt: eq.createdAt
                        });
                    });
                }
            });
        }

        // 2. NAVEGACION
        if (showAll || filters.sector === 'NAVEGACION') {
            // Query Navegacion table (Sites)
            const qb = this.navegacionRepo.createQueryBuilder('nav')
                .leftJoinAndSelect('nav.aeropuerto', 'aeropuerto')
                .leftJoinAndSelect('aeropuerto.fir', 'firRel');

            if (filters?.aeropuerto) {
                qb.andWhere(`(nav.oaci ILIKE :apt OR nav.nombre ILIKE :apt OR nav.siglasLocal ILIKE :apt OR aeropuerto.codigo ILIKE :apt OR aeropuerto.nombre ILIKE :apt)`, { apt: `%${filters.aeropuerto}%` });
            }
            if (filters?.fir) {
                qb.andWhere(`(nav.fir ILIKE :fir OR firRel.nombre ILIKE :fir)`, { fir: `%${filters.fir}%` });
            }

            const radioayudas = await qb.getMany();

            equipos.push(...radioayudas.map(nav => ({
                id: nav.id + 10000,
                nombre: nav.nombre,
                ayuda: nav.ayuda,
                modelo: nav.modelo || 'N/A',
                tipoEquipo: nav.ayuda || 'NAVEGACION',
                tipo: nav.tipo || nav.ayuda,
                estado: 'OK', // Nav Site doesn't have status, Equipment does. But legacy code mapped site as 'OK'.
                sector: 'NAVEGACION',
                aeropuerto: nav.aeropuerto || { nombre: nav.oaci || 'N/A', fir: { nombre: nav.fir || 'N/A' } },
                frecuencia: nav.frecuencia,
                oaci: nav.oaci,
                latitud: nav.latitud,
                longitud: nav.longitud,
                navegacionId: nav.id,
                createdAt: nav.createdAt
            })));
        }

        // 3. VIGILANCIA
        if (showAll || filters.sector === 'VIGILANCIA') {
            const qb = this.vigilanciaRepo.createQueryBuilder('vig')
                .leftJoinAndSelect('vig.aeropuerto', 'aeropuerto')
                .leftJoinAndSelect('aeropuerto.fir', 'firRel');

            // Vigilancia has no direct 'fir' relation in typical findAll unless implicit. Use filters helper if apt exists.
            if (filters?.aeropuerto) {
                qb.andWhere(`(aeropuerto.nombre ILIKE :apt OR aeropuerto.codigo ILIKE :apt)`, { apt: filters.aeropuerto });
            }
            if (filters?.fir) {
                // Vigilancia entity has 'fir' string column too?
                qb.andWhere(`(vig.fir ILIKE :fir OR firRel.nombre ILIKE :fir)`, { fir: `%${filters.fir}%` });
            }

            const vigilancia = await qb.getMany();
            equipos.push(...vigilancia.map(eq => ({
                id: eq.id + 20000,
                nombre: eq.nombre,
                marca: eq.marca || 'N/A',
                modelo: eq.modelo || 'N/A',
                numeroSerie: eq.numeroSerie || 'N/A',
                tipoEquipo: eq.tipo || 'VIGILANCIA',
                tipo: eq.tipo,
                estado: eq.estado || 'OK',
                sector: 'VIGILANCIA',
                aeropuerto: eq.aeropuerto,
                canales: [],
                createdAt: eq.createdAt
            })));
        }

        // 4. ENERGIA
        if (showAll || filters.sector === 'ENERGIA') {
            const qb = this.energiaRepo.createQueryBuilder('ene')
                .leftJoinAndSelect('ene.aeropuerto', 'aeropuerto')
                .leftJoinAndSelect('aeropuerto.fir', 'firRel');

            if (filters?.aeropuerto) {
                qb.andWhere(`(aeropuerto.nombre ILIKE :apt OR aeropuerto.codigo ILIKE :apt)`, { apt: filters.aeropuerto });
            }
            if (filters?.fir) {
                qb.andWhere(`firRel.nombre ILIKE :fir`, { fir: `%${filters.fir}%` });
            }

            const energia = await qb.getMany();
            equipos.push(...energia.map(eq => ({
                id: eq.id + 30000,
                nombre: eq.nombre,
                marca: eq.marca || 'N/A',
                modelo: eq.modelo || 'N/A',
                numeroSerie: eq.numeroSerie || 'N/A',
                tipoEquipo: eq.tipo || 'ENERGIA',
                tipo: eq.tipo,
                estado: eq.estado || 'OK',
                sector: 'ENERGIA',
                aeropuerto: eq.aeropuerto,
                canales: [],
                createdAt: eq.createdAt
            })));
        }

        return equipos;
    }

    async findOne(id: number) {
        console.log(`🔍 EquiposService.findOne - ID: ${id}`);
        let realId = id;

        if (id >= 30000) {
            return this.energiaRepo.findOne({
                where: { id: id - 30000 },
                relations: ['aeropuerto', 'aeropuerto.fir']
            });
        } else if (id >= 20000) {
            return this.vigilanciaRepo.findOne({
                where: { id: id - 20000 },
                relations: ['aeropuerto', 'aeropuerto.fir']
            });
        } else if (id >= 10000) {
            const eq = await this.equipoNavegacionRepo.findOne({
                where: { id: id - 10000 },
                relations: ['navegacion', 'navegacion.aeropuerto', 'navegacion.aeropuerto.fir']
            });
            if (!eq) return null;
            return {
                ...eq,
                nombre: eq.navegacion.nombre,
                aeropuerto: eq.navegacion.aeropuerto
            };
        } else {
            // Caso Comunicaciones (VHF)
            const eq = await this.equipoRepo.findOne({
                where: { id: realId },
                relations: [
                    'vhf',
                    // 'checklists' // Relation added??
                    // 'checklists' needs to be explicitly added to Entity if used here
                ],
                // limit on checklists?
                // TypeORM standard findOne doesn't support 'take' on relations directly in simple options.
                // We would need to load checklists separately or use QueryBuilder if strict limit needed.
            });

            // Simulating checklists load if needed
            // const checklists = await this.checklistRepo.find({ where: { equipoId: eq.id }, order: { fecha: 'DESC' }, take: 1 });
            // eq.checklists = checklists;

            if (!eq) return null;

            return {
                ...eq,
                nombre: `${eq.vhf.sitio} - ${eq.tipoEquipo} ${eq.modelo}`,
                aeropuerto: { nombre: eq.vhf.aeropuerto, fir: { nombre: eq.vhf.fir } },
                sitio: eq.vhf.sitio
            };
        }
    }

    // DASHBOARD STATS
    async getDashboardStats() {
        console.log('📊 Generando Estadísticas de Dashboard (Optimizado)...');
        const start = Date.now();

        const aeropuertos = await this.aeropuertoRepo.find({ relations: ['fir'] });

        // Use QueryBuilder for Counts/Group By
        // TypeORM doesn't have a simple 'groupBy' method like Prisma.
        // We need: select aeropuertoId, estado, count(*) from table group by 1,2

        const getGroupedStats = async (repo: Repository<any>, groupCols: string[]) => {
            return repo.createQueryBuilder('e')
                .select([`e.${groupCols[0]} AS "aeropuertoId"`, `e.${groupCols[1]} AS "${groupCols[1]}"`, 'COUNT(e.id) AS "count"'])
                .groupBy(`e.${groupCols[0]}`)
                .addGroupBy(`e.${groupCols[1]}`)
                .getRawMany();
        };

        const [statsCom, statsVig, statsEnergia, typesCom, typesVig, typesEnergia] = await Promise.all([
            getGroupedStats(this.comunicacionesRepo, ['aeropuertoId', 'estado']),
            getGroupedStats(this.vigilanciaRepo, ['aeropuertoId', 'estado']),
            getGroupedStats(this.energiaRepo, ['aeropuertoId', 'estado']),

            getGroupedStats(this.comunicacionesRepo, ['aeropuertoId', 'tipo']),
            getGroupedStats(this.vigilanciaRepo, ['aeropuertoId', 'tipo']),
            getGroupedStats(this.energiaRepo, ['aeropuertoId', 'tipo']),
        ]);

        // Nav Equipment Stats
        const navEquipments = await this.equipoNavegacionRepo.find({ relations: ['navegacion'] });
        const statsNav = [];
        const typesNav = [];
        // Processing manually as before since Nav relation is indirect
        const navMapStatus = new Map<string, number>();
        const navMapType = new Map<string, number>();

        navEquipments.forEach(eq => {
            const aptId = eq.navegacion.aeropuertoId;
            if (!aptId) return;

            const keyS = `${aptId}_${eq.estado}`;
            navMapStatus.set(keyS, (navMapStatus.get(keyS) || 0) + 1);

            const keyT = `${aptId}_${eq.navegacion.tipo || 'Other'}`;
            navMapType.set(keyT, (navMapType.get(keyT) || 0) + 1);
        });

        navMapStatus.forEach((count, key) => {
            const [aptId, estado] = key.split('_');
            statsNav.push({ aeropuertoId: parseInt(aptId), estado, count }); // Unify structure to 'count' property
        });

        navMapType.forEach((count, key) => {
            const [aptId, tipo] = key.split('_');
            typesNav.push({ aeropuertoId: parseInt(aptId), tipo, count });
        });

        // Helper to process stats (adjusting for 'count' property vs Prisma '_count')
        const summary = aeropuertos.map(a => {
            let total = 0;
            let ok = 0;
            let warn = 0;
            let err = 0;
            const breakdown: Record<string, number> = {};

            const processStats = (stats: any[]) => {
                const airportStats = stats.filter((s: any) => s.aeropuertoId == a.id); // loose equality for string/int raw results
                airportStats.forEach((s: any) => {
                    const count = parseInt(s.count);
                    total += count;
                    if (s.estado === 'OK' || s.estado === 'OPERATIVO') ok += count;
                    else if (s.estado === 'NOVEDAD' || s.estado === 'PRECAUCION') warn += count;
                    else if (s.estado === 'FUERA_SERVICIO' || s.estado === 'FALLA') err += count;
                });
            };

            const processTypes = (stats: any[]) => {
                const airportStats = stats.filter((s: any) => s.aeropuertoId == a.id);
                airportStats.forEach((s: any) => {
                    let type = s.tipo || 'Otro';
                    breakdown[type] = (breakdown[type] || 0) + parseInt(s.count);
                });
            };

            processStats(statsCom); processTypes(typesCom);
            processStats(statsVig); processTypes(typesVig);
            processStats(statsEnergia); processTypes(typesEnergia);

            // Nav manual
            const airportNavStats = statsNav.filter((s: any) => s.aeropuertoId == a.id);
            airportNavStats.forEach((s: any) => {
                const count = s.count;
                total += count;
                if (s.estado === 'OK' || s.estado === 'OPERATIVO') ok += count;
                else if (s.estado === 'NOVEDAD' || s.estado === 'PRECAUCION') warn += count;
                else if (s.estado === 'FUERA_SERVICIO' || s.estado === 'FALLA') err += count;
            });

            const airportNavTypes = typesNav.filter((s: any) => s.aeropuertoId == a.id);
            airportNavTypes.forEach((s: any) => {
                let type = s.tipo || 'Otro';
                breakdown[type] = (breakdown[type] || 0) + s.count;
            });

            const availability = total > 0 ? Math.round((ok / total) * 100) : 0;
            const finalAvail = total > 0 ? availability : 100;

            return {
                id: a.id,
                name: a.nombre,
                fir: a.fir?.nombre || 'Desconocida',
                totalEquipments: total,
                operationalCount: ok,
                warningCount: warn,
                errorCount: err,
                availability: finalAvail,
                breakdown,
                technicians: [],
            };
        });

        console.log(`✅ Estadísticas generadas en ${Date.now() - start}ms`);
        return summary;
    }

    async create(createDto: any) {
        console.log('🆕 Creando equipo:', createDto);
        const { sector, ...data } = createDto;

        let result;
        switch (sector?.toUpperCase()) {
            case 'COMUNICACIONES':
                result = await this.comunicacionesRepo.save(this.comunicacionesRepo.create(data));
                break;
            case 'NAVEGACION':
                // Logic to create Site then Equipment
                const nav = await this.navegacionRepo.save(this.navegacionRepo.create({
                    nombre: data.nombre,
                    tipo: data.tipo,
                    aeropuertoId: data.aeropuertoId,
                }));
                result = await this.equipoNavegacionRepo.save(this.equipoNavegacionRepo.create({
                    navegacionId: nav.id,
                    marca: data.marca,
                    modelo: data.modelo,
                    numeroSerie: data.numeroSerie,
                    tipoEquipo: 'MAIN',
                    estado: EstadoEquipo.OK
                }));
                break;
            case 'VIGILANCIA':
                result = await this.vigilanciaRepo.save(this.vigilanciaRepo.create(data));
                break;
            case 'ENERGIA':
                result = await this.energiaRepo.save(this.energiaRepo.create(data));
                break;
            default:
                result = await this.comunicacionesRepo.save(this.comunicacionesRepo.create(data));
        }
        return result;
    }

    async update(id: number, updateDto: any) {
        console.log(`📝 Actualizando equipo ID ${id}:`, updateDto);
        const { sector, ...data } = updateDto;
        // Decode ID
        let realId = id;
        let table = 'comunicaciones';
        if (id >= 30000) { realId = id - 30000; table = 'energia'; }
        else if (id >= 20000) { realId = id - 20000; table = 'vigilancia'; }
        else if (id >= 10000) { realId = id - 10000; table = 'navegacion'; }

        if (table === 'comunicaciones') {
            await this.comunicacionesRepo.update(realId, data);
        } else if (table === 'navegacion') {
            await this.equipoNavegacionRepo.update(realId, {
                marca: data.marca,
                modelo: data.modelo,
                numeroSerie: data.numeroSerie,
                // other fields
            });
            if (data.nombre || data.tipo) {
                const eq = await this.equipoNavegacionRepo.findOne({ where: { id: realId } });
                if (eq) {
                    await this.navegacionRepo.update(eq.navegacionId, { nombre: data.nombre, tipo: data.tipo });
                }
            }
        } else if (table === 'vigilancia') {
            await this.vigilanciaRepo.update(realId, data);
        } else if (table === 'energia') {
            await this.energiaRepo.update(realId, data);
        }
        return { success: true };
    }

    async remove(id: number) {
        let realId = id;
        let table = 'comunicaciones';
        if (id >= 30000) { realId = id - 30000; table = 'energia'; }
        else if (id >= 20000) { realId = id - 20000; table = 'vigilancia'; }
        else if (id >= 10000) { realId = id - 10000; table = 'navegacion'; }

        if (table === 'comunicaciones') await this.comunicacionesRepo.delete(realId);
        else if (table === 'navegacion') await this.equipoNavegacionRepo.delete(realId);
        else if (table === 'vigilancia') await this.vigilanciaRepo.delete(realId);
        else if (table === 'energia') await this.energiaRepo.delete(realId);

        return { success: true };
    }
}
