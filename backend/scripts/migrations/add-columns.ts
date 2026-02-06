import { Client } from 'pg';
import * as dotenv from 'dotenv';

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

        await client.query(`ALTER TABLE comunicaciones ADD COLUMN IF NOT EXISTS frecuencia DOUBLE PRECISION;`);
        console.log('✅ Columna frecuencia verificada/agregada');

        await client.query(`ALTER TABLE comunicaciones ADD COLUMN IF NOT EXISTS canal VARCHAR(255);`);
        console.log('✅ Columna canal verificada/agregada\n');

        console.log('✅ Proceso completado');
    } catch (error: any) {
        console.error('❌ Error fatal:', error.message);
    } finally {
        await client.end();
    }
}

main().catch((e) => {
    console.error('❌ Error fatal:', e);
    process.exit(1);
});
