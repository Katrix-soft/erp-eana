const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');

const prisma = new PrismaClient();

async function importVHF() {
    try {
        console.log('📊 Importando Equipamiento VHF...\n');

        // Leer el archivo Excel
        const filePath = path.join(__dirname, '../../Equipamiento VHF Nacional.xlsx');
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`📄 Total de filas: ${data.length}\n`);

        // Agrupar por sitio
        const sitesMap = new Map();

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
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

            // Parsear frecuencia
            let frecuencia = 0;
            try {
                const freqValue = row['Frecuencia [MHz]'];
                if (freqValue) {
                    frecuencia = parseFloat(String(freqValue).replace(',', '.'));
                }
            } catch (e) {
                console.warn(`⚠️  Frecuencia inválida en fila ${i + 1}`);
            }

            site.equipos.push({
                tipoEquipo: row['EAVA/TWR'] || 'TWR',
                marca: row['Marca'] || 'Sin Marca',
                modelo: row['Modelo'] || 'Sin Modelo',
                numeroSerie: row['Nro de Serie'] || `S/N-${i}`,
                tecnologia: row['Tecnologia'] || null,
                activoFijo: row['Activo Fijo'] || null,
                canal: row['Canal'] || 'N/A',
                tipo: row['Tipo'] || 'Main',
                frecuencia: frecuencia
            });
        }

        const sites = Array.from(sitesMap.values());
        console.log(`📍 Total de sitios: ${sites.length}\n`);

        let successCount = 0;
        let errorCount = 0;

        // Procesar cada sitio
        for (const site of sites) {
            try {
                console.log(`\n📍 Procesando sitio: ${site.sitio} (${site.fir})`);

                // 1. Buscar o crear VHF (sitio)
                let vhf = await prisma.vhf.findFirst({
                    where: {
                        fir: site.fir,
                        sitio: site.sitio
                    }
                });

                if (!vhf) {
                    vhf = await prisma.vhf.create({
                        data: {
                            fir: site.fir,
                            aeropuerto: site.aeropuerto,
                            sitio: site.sitio
                        }
                    });
                    console.log(`   ✅ Sitio creado`);
                } else {
                    console.log(`   ℹ️  Sitio ya existe`);
                }

                // 2. Crear equipos
                for (const eq of site.equipos) {
                    try {
                        // Verificar si el equipo ya existe
                        const existingEquipo = await prisma.equipo.findFirst({
                            where: {
                                vhfId: vhf.id,
                                numeroSerie: eq.numeroSerie
                            }
                        });

                        if (existingEquipo) {
                            console.log(`   ⏭️  Equipo ${eq.numeroSerie} ya existe, omitiendo...`);
                            continue;
                        }

                        const equipo = await prisma.equipo.create({
                            data: {
                                vhfId: vhf.id,
                                tipoEquipo: eq.tipoEquipo,
                                marca: eq.marca,
                                modelo: eq.modelo,
                                numeroSerie: eq.numeroSerie,
                                tecnologia: eq.tecnologia,
                                activoFijo: eq.activoFijo
                            }
                        });

                        // 3. Crear canal
                        const canal = await prisma.canal.create({
                            data: {
                                equipoVhfId: equipo.id,
                                canal: eq.canal,
                                tipo: eq.tipo
                            }
                        });

                        // 4. Crear frecuencia
                        if (eq.frecuencia > 0) {
                            await prisma.frecuencia.create({
                                data: {
                                    frecuencia: eq.frecuencia,
                                    canalId: canal.id,
                                    equipoVhfId: equipo.id
                                }
                            });
                        }

                        successCount++;
                        process.stdout.write(`\r   ✅ Equipos creados: ${successCount}`);

                    } catch (error) {
                        errorCount++;
                        console.error(`\n   ❌ Error en equipo ${eq.numeroSerie}:`, error.message);
                    }
                }
            } catch (error) {
                errorCount++;
                console.error(`\n❌ Error en sitio ${site.sitio}:`, error.message);
            }
        }

        console.log('\n\n✅ Importación completada!');
        console.log(`\n📊 Resumen:`);
        console.log(`   ✅ Exitosos: ${successCount}`);
        console.log(`   ❌ Errores: ${errorCount}`);
        console.log(`   📄 Total procesados: ${data.length}`);

    } catch (error) {
        console.error('❌ Error fatal:', error);
    } finally {
        await prisma.$disconnect();
    }
}

importVHF();
