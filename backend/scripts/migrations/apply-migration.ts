import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function main() {
    console.log('🔧 Aplicando migración manual...\n');

    const client = new Client({
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5434'),
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'postgrespassword',
        database: process.env.POSTGRES_DB || 'cns_db',
    });

    try {
        await client.connect();
        const sql = fs.readFileSync(path.join(__dirname, '..', 'add-frequency-canal.sql'), 'utf-8');
        await client.query(sql);
        console.log('✅ Migración aplicada exitosamente\n');
    } catch (error) {
        console.error('❌ Error applying migration:', error);
    } finally {
        await client.end();
    }
}

main().catch(e => console.error('❌ Error:', e));
