import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
    const client = new Client({
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5434'),
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'postgrespassword',
        database: process.env.POSTGRES_DB || 'cns_db',
    });

    const csvPath = path.join(__dirname, '../../data/csv/aeropuertos_202601161523.csv');
    if (!fs.existsSync(csvPath)) {
        console.warn(`⚠️ Seed file not found: ${csvPath}`);
        // Try fallback if original name exists in root for some reason
        const fallbackPath = path.join(__dirname, '../../../aeropuertos_limpios.csv');
        if (!fs.existsSync(fallbackPath)) {
            return;
        }
    }

    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.split('\n').slice(1); // Skip header

    try {
        await client.connect();
        console.log('✅ Connected to DB for airport seeding');

        for (const line of lines) {
            if (!line.trim()) continue;
            const [nombre, codigo, firNombre] = line.split(',');

            if (!nombre || !codigo || !firNombre) continue;

            const cleanNombre = nombre.trim();
            const cleanCodigo = codigo.trim();
            const cleanFir = firNombre.trim();

            // Upsert FIR
            const firRes = await client.query(
                'INSERT INTO firs (nombre) VALUES ($1) ON CONFLICT (nombre) DO UPDATE SET nombre = EXCLUDED.nombre RETURNING id',
                [cleanFir]
            );
            const firId = firRes.rows[0].id;

            // Upsert Aeropuerto
            await client.query(
                'INSERT INTO aeropuertos (nombre, codigo, "firId") VALUES ($1, $2, $3) ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre, "firId" = EXCLUDED."firId"',
                [cleanNombre, cleanCodigo, firId]
            );
        }

        console.log('✅ Aeropuertos and FIRs seeded successfully!');
    } catch (error) {
        console.error('❌ Error seeding airports:', error);
    } finally {
        await client.end();
    }
}

main().catch(e => console.error(e));
