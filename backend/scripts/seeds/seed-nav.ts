import { Client } from 'pg';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function main() {
    const client = new Client({
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5434'),
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'postgrespassword',
        database: process.env.POSTGRES_DB || 'cns_db',
    });

    const excelPath = path.join(__dirname, '../../data/excel/Instrumental NAV.xlsx');
    if (!fs.existsSync(excelPath)) {
        console.warn(`⚠️ Excel file not found: ${excelPath}. Skipping navigation seed.`);
        return;
    }

    try {
        await client.connect();
        console.log('🚀 Iniciando importación de Instrumental NAV...');

        const workbook = XLSX.readFile(excelPath);
        const sheetName = workbook.SheetNames[0];
        const data: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        console.log(`📊 Procesando ${data.length} registros...`);

        for (const row of data) {
            try {
                await client.query(`
                    INSERT INTO navegacion (
                        ayuda, "asociadoA", modelo, nombre, latitud, longitud, 
                        oaci, "anioInstalacion", "monitorTorre", frecuencia, 
                        fir, tipo, "siglasLocal", estacion
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                    ON CONFLICT (nombre) DO NOTHING
                `, [
                    row['AYUDA']?.toString(),
                    row['Asociado a']?.toString(),
                    row['MODELO']?.toString(),
                    row['Title']?.toString() || 'Sin Nombre',
                    row['Latitud'] ? parseFloat(row['Latitud']) : null,
                    row['Longitud'] ? parseFloat(row['Longitud']) : null,
                    row['OACI']?.toString(),
                    row['AÑO DE INSTALACION']?.toString(),
                    row['MonitorTorre'] === true || row['MonitorTorre'] === '1',
                    row['FRECUENCIA']?.toString(),
                    row['FIR']?.toString(),
                    row['Tipo']?.toString(),
                    row['Siglas Local']?.toString(),
                    row['Estación']?.toString()
                ]);
            } catch (e) {
                console.error(`❌ Error en fila ${row['Title']}:`, e);
            }
        }

        console.log('✅ Importación de NAV finalizada.');
    } catch (error) {
        console.error('❌ Error crítico en seed-nav:', error);
    } finally {
        await client.end();
    }
}

main().catch(e => console.error(e));
