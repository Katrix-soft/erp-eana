import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function main() {
    const client = new Client({
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5434'),
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'postgrespassword',
        database: process.env.POSTGRES_DB || 'cns_db',
    });

    try {
        await client.connect();
        console.log('🌱 Creando datos básicos (FIRs, Puestos)...');

        // 1. Crear FIR Ezeiza
        await client.query(`
            INSERT INTO firs (nombre) 
            VALUES ('FIR Ezeiza') 
            ON CONFLICT (nombre) DO NOTHING
        `);

        // 2. Crear Puesto Técnico
        await client.query(`
            INSERT INTO puestos_personal (nombre) 
            VALUES ('Técnico') 
            ON CONFLICT (nombre) DO NOTHING
        `);

        console.log('✅ Datos básicos creados/verificados.');

    } catch (error) {
        console.error('❌ Error en seed-basic-data:', error);
    } finally {
        await client.end();
    }
}

main().catch(e => console.error(e));
