

import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('📡 Importando equipos VHF a tablas UNIFICADAS (Equipos/VHF) desde Excel...\n');

    // Leer el archivo Excel
    const filePath = path.join(__dirname, '..', '..', 'Equipamiento VHF Nacional.xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`📊 Total de registros en Excel: ${data.length}\n`);

    // Cache para evitar lecturas repetidas de VHF
    // Key: "FIR-AEROPUERTO-SITIO"
    const vhfCache = new Map<string, number>();

    let createdEquipos = 0;
    let createdVhfs = 0;
    let skipped = 0;
    let errors = 0;

    // Limpiar tablas antes (opcional, pero recomendado para evitar duplicados si se corre varias veces y no hay upsert logic compleja)
    // await prisma.equipo.deleteMany();
    // await prisma.vhf.deleteMany();
    // console.log('🧹 Tablas limpiadas (Vhf, Equipo)...');

    for (const row of data as any[]) {
        try {
            const sitio = (row['Sitio'] || row['Ubicacion: Nombre '] || '').toString().trim();
            const firNombre = (row['FIR'] || row['Ubicacion: FIR'] || '').toString().trim();
            const designador = (row['Desginador 3 Letras'] || '').toString().trim();

            // Si falta sitio y designador, skip
            if (!sitio && !designador) {
                skipped++;
                continue;
            }

            // Determinar valores para VHF
            const vhfFir = firNombre || 'SIN DATOS';
            const vhfSitio = sitio || designador; // Sitio es mandatorio para el frontend usualmente

            // Priorizamos Designador como Aeropuerto, si no Sitio, si no "DESCONOCIDO"
            // El modelo VHF tiene 'aeropuerto' como String.
            const vhfAeropuerto = designador || sitio || 'DESCONOCIDO';

            const cacheKey = `${vhfFir.toUpperCase()}-${vhfAeropuerto.toUpperCase()}-${vhfSitio.toUpperCase()}`;

            let vhfId = vhfCache.get(cacheKey);

            if (!vhfId) {
                // Buscar si existe en DB
                const existingVhf = await prisma.vhf.findFirst({
                    where: {
                        fir: vhfFir,
                        aeropuerto: vhfAeropuerto,
                        sitio: vhfSitio
                    }
                });

                if (existingVhf) {
                    vhfId = existingVhf.id;
                } else {
                    // Crear VHF
                    const newVhf = await prisma.vhf.create({
                        data: {
                            fir: vhfFir,
                            aeropuerto: vhfAeropuerto, // Usamos el código o nombre del sitio
                            sitio: vhfSitio
                        }
                    });
                    vhfId = newVhf.id;
                    createdVhfs++;
                }
                vhfCache.set(cacheKey, vhfId);
            }

            // Crear Equipo
            await prisma.equipo.create({
                data: {
                    vhfId: vhfId,
                    tipoEquipo: row['Tipo'] || 'VHF', // Default VHF
                    marca: (row['Marca'] || 'N/A').toString(),
                    modelo: (row['Modelo'] || 'N/A').toString(),
                    numeroSerie: (row['Nro de Serie'] || row['Activo Fijo'] || 'N/A').toString(),
                    tecnologia: row['Tecnologia'] || null,
                    activoFijo: (row['Activo Fijo'] || '').toString() || null,
                    estado: 'OK', // Default
                    // Frecuencia? El modelo Equipo tiene relacion con Frecuencia, pero es complejo. 
                    // El Excel tiene columna Frecuencia?
                }
            });
            // Nota: Frecuencia no se mapea trivialmente al modelo complejo Frecuencia/Canal aquí.
            // Se puede agregar después si es crítico.

            createdEquipos++;

            if (createdEquipos % 100 === 0) {
                console.log(`✅ Equipos procesados: ${createdEquipos}...`);
            }

        } catch (error) {
            console.error(`❌ Error procesando fila:`, error);
            errors++;
        }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMEN DE IMPORTACIÓN UNIFICADA');
    console.log('='.repeat(80));
    console.log(`✅ VHFs creados (Sitios): ${createdVhfs}`);
    console.log(`✅ Equipos creados: ${createdEquipos}`);
    console.log(`⚠️  Saltados: ${skipped}`);
    console.log(`❌ Errores: ${errors}`);
    console.log('='.repeat(80));
}

main()
    .catch((e) => {
        console.error('❌ Error fatal:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
