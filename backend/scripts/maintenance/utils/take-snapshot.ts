import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

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
        const res = await client.query("SELECT u.email, p.dni FROM users u LEFT JOIN personal p ON p.user_id = u.id");
        fs.writeFileSync('users_snapshot.json', JSON.stringify(res.rows, null, 2));
        console.log('SNAPSHOT GUARDADO EN users_snapshot.json');
    } catch (error) {
        console.error(error);
    } finally {
        await client.end();
    }
}

main();
