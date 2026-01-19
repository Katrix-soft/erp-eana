
const { Client } = require('pg');

async function checkOldData() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'postgrespassword',
        database: 'cns_db', // Intentando nombre común
        ssl: false
    });

    try {
        await client.connect();
        console.log('Connected to Old DB (5432). Checking tables...');

        const res = await client.query(`
            SELECT 
                (SELECT count(*) FROM "users") as users_count,
                (SELECT count(*) FROM "personal") as personal_count,
                (SELECT count(*) FROM "vhf") as vhf_count,
                (SELECT count(*) FROM "equipos") as equipos_count
        `);

        console.log('Data found:', res.rows[0]);
        await client.end();
        return true;
    } catch (e) {
        console.error('Could not connect to Old DB at 5432:', e.message);
        if (e.message.includes('authentication failed')) {
            console.log('Wrong credentials for Old DB.');
        } else if (e.message.includes('database "cns_db" does not exist')) {
            console.log('Database cns_db does not exist.');
        }
        return false;
    }
}

checkOldData();
