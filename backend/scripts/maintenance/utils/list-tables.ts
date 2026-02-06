
import { Client } from 'pg';

async function listTables() {
    const client = new Client({
        host: 'localhost',
        port: 5434,
        user: 'postgres',
        password: 'postgrespassword',
        database: 'cns_db',
    });

    try {
        await client.connect();

        const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
        console.log('Tables:', res.rows.map(r => r.table_name).join(', '));

        await client.end();
    } catch (err) {
        console.error('❌ DB Error:', err.message);
    }
}

listTables();
