const { Client } = require('pg');

async function check() {
    console.log('Connecting to DB...');
    const client = new Client({
        host: process.env.POSTGRES_HOST || 'postgres',
        port: 5432,
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'postgrespassword',
        database: process.env.POSTGRES_DB || 'cns_db'
    });

    try {
        await client.connect();
        console.log('✅ Connected');
        const res = await client.query('SELECT id, email, role FROM users');
        console.log('Users found:', res.rows);
        await client.end();
    } catch (e) {
        console.error('❌ Error:', e);
    }
}
check();
