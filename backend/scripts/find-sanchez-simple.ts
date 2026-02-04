import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

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
        const res = await client.query("SELECT p.nombre, p.apellido, p.dni, u.email FROM personal p LEFT JOIN users u ON u.id = p.user_id WHERE p.nombre ILIKE '%ignacio%' OR p.apellido ILIKE '%sanchez%'");
        for (const row of res.rows) {
            console.log(`DATA: ${row.nombre} | ${row.apellido} | ${row.dni} | ${row.email}`);
        }
    } catch (error) {
        console.error(error);
    } finally {
        await client.end();
    }
}

main();
