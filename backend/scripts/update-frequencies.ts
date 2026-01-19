
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('🔧 Agregando columnas frecuencia y canal...\n');

    try {
        await prisma.$executeRawUnsafe(`
            ALTER TABLE comunicaciones 
            ADD COLUMN IF NOT EXISTS frecuencia DOUBLE PRECISION,
            ADD COLUMN IF NOT EXISTS canal VARCHAR(255);
        `);
        console.log('✅ Columnas agregadas\n');
    } catch (error) {
        console.log('⚠️  Las columnas ya existen o hubo un error:', error);
    }

    console.log('🔄 Actualizando frecuencias y canales desde Excel...\n');

    // Leer el archivo Excel
    const filePath = path.join(__dirname, '..', '..', 'Equipamiento VHF Nacional.xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`📊 Total de registros en Excel: ${data.length}\n`);

    let updated = 0;
    let notFound = 0;

    for (const row of data as any[]) {
        try {
            const numeroSerie = row['Nro de Serie'] || row['Activo Fijo'];
            const frecuencia = row['Frecuencia [MHz]'];
            const canal = row['Canal'];

            if (!numeroSerie || !frecuencia) {
                continue;
            }

            // Actualizar directamente con SQL
            const result = await prisma.$executeRawUnsafe(`
                UPDATE comunicaciones 
                SET frecuencia = ${parseFloat(frecuencia.toString())},
                    canal = '${canal || ''}'
                WHERE LOWER(numero_serie) LIKE LOWER('%${numeroSerie}%')
            `);

            if (result > 0) {
                updated++;
                if (updated % 100 === 0) {
                    console.log(`✅ Actualizados: ${updated}...`);
                }
            } else {
                notFound++;
            }

        } catch (error) {
            console.error(`❌ Error procesando fila:`, error);
        }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMEN DE ACTUALIZACIÓN');
    console.log('='.repeat(80));
    console.log(`✅ Equipos actualizados: ${updated}`);
    console.log(`⚠️  No encontrados: ${notFound}`);
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
