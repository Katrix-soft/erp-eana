import { Client } from 'pg';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

const client = new Client({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5434'),
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgrespassword',
    database: process.env.POSTGRES_DB || 'cns_db',
});

async function main() {
    console.log('🔧 Agregando columnas frecuencia y canal si no existen...\n');

    try {
        await client.connect();
        await client.query(`
            ALTER TABLE comunicaciones 
            ADD COLUMN IF NOT EXISTS frecuencia DOUBLE PRECISION,
            ADD COLUMN IF NOT EXISTS canal VARCHAR(255);
        `);
        console.log('✅ Columnas verificadas/agregadas\n');
    } catch (error: any) {
        console.log('⚠️  Error al verificar columnas:', error.message);
    }

    console.log('🔄 Actualizando frecuencias y canales desde Excel...\n');

    // Leer el archivo Excel
    const filePath = path.join(__dirname, '../../..', 'data/excel', 'Equipamiento VHF Nacional.xlsx');
    if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ Archivo Excel no encontrado: ${filePath}`);
        return;
    }

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
            const res = await client.query(`
                UPDATE comunicaciones 
                SET frecuencia = $1,
                    canal = $2
                WHERE LOWER(numero_serie) LIKE LOWER($3)
            `, [parseFloat(frecuencia.toString()), canal || '', `%${numeroSerie}%`]);

            if (res.rowCount && res.rowCount > 0) {
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
        await client.end().catch(() => { });
    });
