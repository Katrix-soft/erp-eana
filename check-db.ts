
import { Client } from 'pg';

async function checkDb() {
    const client = new Client({
        host: 'localhost',
        port: 5434, // Puerto externo mapeado en docker-compose
        user: 'postgres',
        password: 'postgrespassword',
        database: 'cns_db',
    });

    try {
        await client.connect();
        console.log('✅ Connected to DB');

        const users = await client.query('SELECT id, email, role FROM users');
        console.log('Users found:', users.rows);

        await client.end();
    } catch (err) {
        console.error('❌ DB Error:', err.message);
    }
}

checkDb();
