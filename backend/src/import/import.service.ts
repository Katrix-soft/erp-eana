import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vhf } from '../vhf/entities/vhf.entity';
import { Equipo } from '../equipos/entities/equipo.entity';
import { Canal } from '../canales/entities/canal.entity';
import { Frecuencia } from '../frecuencias/entities/frecuencia.entity';
import * as XLSX from 'xlsx';

@Injectable()
export class ImportService {
    constructor(
        @InjectRepository(Vhf) private vhfRepository: Repository<Vhf>,
        @InjectRepository(Equipo) private equipoRepository: Repository<Equipo>,
        @InjectRepository(Canal) private canalRepository: Repository<Canal>,
        @InjectRepository(Frecuencia) private frecuenciaRepository: Repository<Frecuencia>
    ) { }

    async processExcelFile(buffer: Buffer) {
        const workbook = XLSX.read(buffer);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        // Agrupar por sitio
        const sitesMap = new Map<string, any>();

        for (let i = 0; i < data.length; i++) {
            const row: any = data[i];
            const siteKey = `${row['FIR']}-${row['Sitio']}`;

            if (!sitesMap.has(siteKey)) {
                sitesMap.set(siteKey, {
                    fir: row['FIR'],
                    aeropuerto: row['Desginador 3 Letras'] || row['FIR'],
                    sitio: row['Sitio'],
                    equipos: []
                });
            }

            const site = sitesMap.get(siteKey);
            site.equipos.push({
                tipoEquipo: row['EAVA/TWR'] || 'TWR',
                marca: row['Marca'] || 'Sin Marca',
                modelo: row['Modelo'] || 'Sin Modelo',
                numeroSerie: row['Nro de Serie'] || `S/N-${i}`,
                tecnologia: row['Tecnologia'] || null,
                activoFijo: row['Activo Fijo'] || null,
                canal: row['Canal'] || 'N/A',
                tipo: row['Tipo'] || 'Main',
                frecuencia: this.parseFrequency(row['Frecuencia [MHz]'])
            });
        }

        // Procesar cada sitio
        const sites = Array.from(sitesMap.values());

        for (const site of sites) {
            try {
                // 1. Crear o buscar VHF (sitio)
                // Note: TypeORM doesn't have findFirst in same way, assume simple findOne where parameters match
                let vhf = await this.vhfRepository.findOne({
                    where: {
                        fir: site.fir,
                        sitio: site.sitio
                    }
                });

                if (!vhf) {
                    const newVhf = this.vhfRepository.create({
                        fir: site.fir,
                        aeropuerto: site.aeropuerto,
                        sitio: site.sitio
                    });
                    vhf = await this.vhfRepository.save(newVhf);
                }

                // 2. Crear equipos
                for (const eq of site.equipos) {
                    try {
                        const newEquipo = this.equipoRepository.create({
                            vhfId: vhf.id, // Or use relation: vhf: vhf
                            tipoEquipo: eq.tipoEquipo,
                            marca: eq.marca,
                            modelo: eq.modelo,
                            numeroSerie: eq.numeroSerie,
                            tecnologia: eq.tecnologia,
                            activoFijo: eq.activoFijo
                        });
                        const equipo = await this.equipoRepository.save(newEquipo);

                        // 3. Crear canal
                        const newCanal = this.canalRepository.create({
                            equipoVhfId: equipo.id, // Or relation: equipoVhf: equipo
                            canal: eq.canal,
                            tipo: eq.tipo
                        });
                        const canal = await this.canalRepository.save(newCanal);

                        // 4. Crear frecuencia
                        if (eq.frecuencia > 0) {
                            const newFrecuencia = this.frecuenciaRepository.create({
                                frecuencia: eq.frecuencia,
                                canalId: canal.id, // Or relation: canal: canal
                                equipoVhfId: equipo.id // Or relation: equipoVhf: equipo
                            });
                            await this.frecuenciaRepository.save(newFrecuencia);
                        }

                        successCount++;
                    } catch (error) {
                        errorCount++;
                        errors.push(`Error en equipo ${eq.numeroSerie}: ${error.message}`);
                    }
                }
            } catch (error) {
                errorCount++;
                errors.push(`Error en sitio ${site.sitio}: ${error.message}`);
            }
        }

        return {
            successCount,
            errorCount,
            totalProcessed: data.length,
            errors: errors.slice(0, 10) // Solo primeros 10 errores
        };
    }

    private parseFrequency(value: any): number {
        try {
            if (typeof value === 'number') return value;
            if (typeof value === 'string') {
                return parseFloat(value.replace(',', '.'));
            }
            return 0;
        } catch {
            return 0;
        }
    }
}
