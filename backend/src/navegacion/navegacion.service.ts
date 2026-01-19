import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Navegacion } from './entities/navegacion.entity';
import { EquipoNavegacion } from './entities/equipo-navegacion.entity';
import { VorDataDto, DocDataDto, HistoryDataDto } from './dto/nav-data.dto';

@Injectable()
export class NavegacionService {
    constructor(
        @InjectRepository(Navegacion) private navegacionRepository: Repository<Navegacion>,
        @InjectRepository(EquipoNavegacion) private equipoNavegacionRepository: Repository<EquipoNavegacion>,
        private dataSource: DataSource
    ) { }

    async findAll(filters?: any) {
        return this.navegacionRepository.find({
            where: filters,
            relations: ['aeropuerto', 'aeropuerto.fir', 'equipos'],
            order: { nombre: 'ASC' }
        });
    }

    getVorData(): VorDataDto[] {
        return [
            { fecha: '2024-01-05', equipo: 'VOR MENDOZA', azimut: 0, error: 0.5, tecnico: 'A. Sanchez' },
            { fecha: '2024-01-05', equipo: 'VOR MENDOZA', azimut: 90, error: -0.2, tecnico: 'A. Sanchez' },
            { fecha: '2024-01-05', equipo: 'VOR MENDOZA', azimut: 180, error: 1.1, tecnico: 'A. Sanchez' },
            { fecha: '2024-01-05', equipo: 'VOR MENDOZA', azimut: 270, error: 0.8, tecnico: 'A. Sanchez' },
            { fecha: '2024-01-04', equipo: 'VOR SAN JUAN', azimut: 90, error: 2.5, tecnico: 'J. Perez' },
        ];
    }

    getDocs(): DocDataDto[] {
        return [
            { nombre: 'Manual Mantenimiento VOR Thales', tipo: 'PDF', fecha: '2023-11-15', size: '12.4 MB' },
            { nombre: 'Procedimiento Calibración ILS', tipo: 'PDF', fecha: '2023-10-01', size: '2.8 MB' },
            { nombre: 'Reporte Incidente DME #402', tipo: 'DOCX', fecha: '2024-01-02', size: '1.2 MB' },
            { nombre: 'Planilla Mediciones Mensuales', tipo: 'XLSX', fecha: '2023-12-28', size: '450 KB' },
        ];
    }

    getHistory(): HistoryDataDto[] {
        return [
            { evento: 'FALLA DETECTADA', type: 'ALERT', descripcion: 'Pérdida de potencia en TX1 VOR MENDOZA', responsable: 'Sistema', fecha: '2024-01-05 14:30' },
            { evento: 'MANTENIMIENTO OK', type: 'OK', descripcion: 'Limpieza de filtros y reseteo TX1', responsable: 'A. Sanchez', fecha: '2024-01-05 15:45' },
            { evento: 'CHECKLIST OK', type: 'OK', descripcion: 'Checklist Semanal completada sin novedades', responsable: 'A. Sanchez', fecha: '2024-01-04 09:00' },
        ];
    }

    async updateSystem(id: number, data: any) {
        return this.dataSource.transaction(async (manager) => {
            // Update main record
            await manager.update(Navegacion, id, {
                nombre: data.name,
                tipo: data.type
            });

            // Update sub-units if they exist
            // OR conditions in update with complex filtering is tricky.
            // Using QueryBuilder within transaction manager
            if (data.main?.id) {
                await manager.createQueryBuilder()
                    .update(EquipoNavegacion)
                    .set({
                        modelo: data.main.modelo,
                        frecuencia: data.main.frecuencia
                    })
                    .where('navegacionId = :id', { id })
                    .andWhere('(tipoEquipo LIKE :t1 OR tipoEquipo LIKE :t2)', { t1: '%1%', t2: '%Principal%' })
                    .execute();
            }

            if (data.standby?.id) {
                await manager.createQueryBuilder()
                    .update(EquipoNavegacion)
                    .set({
                        modelo: data.standby.modelo,
                        frecuencia: data.standby.frecuencia
                    })
                    .where('navegacionId = :id', { id })
                    .andWhere('(tipoEquipo LIKE :t1 OR tipoEquipo LIKE :t2)', { t1: '%2%', t2: '%Standby%' })
                    .execute();
            }

            return { success: true };
        });
    }
}
