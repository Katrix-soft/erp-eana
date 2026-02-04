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
        const res = await client.query("SELECT email, password FROM users WHERE email = 'igsanchez@eana.com.ar'");
        if (res.rows.length > 0) {
            console.log('USUARIO:', res.rows[0].email);
            console.log('HASH:', res.rows[0].password);
        } else {
            console.log('NO ENCONTRADO');
        }
    } catch (error) {
        console.error(error);
    } finally {
        await client.end();
    }
}

main();
