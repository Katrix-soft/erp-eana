
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Actualizando frecuencias y canales desde Excel usando Prisma...\n');

    // Leer el archivo Excel
    const filePath = path.join(__dirname, '..', '..', 'Equipamiento VHF Nacional.xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`📊 Total de registros en Excel: ${data.length}\n`);

    let updated = 0;
    let notFound = 0;
    let errors = 0;

    for (const row of data as any[]) {
        try {
            const numeroSerie = row['Nro de Serie'] || row['Activo Fijo'];
            const frecuencia = row['Frecuencia [MHz]'];
            const canal = row['Canal'];

            if (!numeroSerie) {
                continue;
            }

            // Buscar equipo por número de serie usando Prisma
            const equipos = await prisma.comunicaciones.findMany({
                where: {
                    numeroSerie: {
                        contains: numeroSerie,
                        mode: 'insensitive'
                    }
                }
            });

            if (equipos.length > 0) {
                // Actualizar todos los equipos encontrados
                for (const equipo of equipos) {
                    await prisma.comunicaciones.update({
                        where: { id: equipo.id },
                        data: {
                            frecuencia: frecuencia ? parseFloat(frecuencia.toString()) : null,
                            canal: canal ? canal.toString() : null
                        }
                    });
                }
                updated += equipos.length;

                if (updated % 100 === 0) {
                    console.log(`✅ Actualizados: ${updated}...`);
                }
            } else {
                notFound++;
            }

        } catch (error) {
            console.error(`❌ Error procesando fila:`, error);
            errors++;
        }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMEN DE ACTUALIZACIÓN');
    console.log('='.repeat(80));
    console.log(`✅ Equipos actualizados: ${updated}`);
    console.log(`⚠️  No encontrados: ${notFound}`);
    console.log(`❌ Errores: ${errors}`);
    console.log(`📈 Total procesados: ${data.length}`);
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
