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
        const res = await client.query(`
            SELECT u.email FROM users u ORDER BY u.email ASC
        `);
        console.log('LISTA DE EMAILS:');
        res.rows.forEach(r => console.log(r.email));
    } catch (error) {
        console.error(error);
    } finally {
        await client.end();
    }
}

main();
