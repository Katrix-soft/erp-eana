
import { Client } from 'pg';

async function inspectData() {
    const client = new Client({
        host: 'localhost',
        port: 5434,
        user: 'postgres',
        password: 'postgrespassword',
        database: 'cns_db',
    });

    try {
        await client.connect();
        console.log('✅ Connected to DB');

        // 1. Check Personal Columns
        console.log('\n--- Personal Columns ---');
        const pCols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'personal'");
        console.log(pCols.rows.map(r => r.column_name).join(', '));

        console.log('\n--- User Info ---');
        // Get all with similar name
        const userRes = await client.query("SELECT * FROM personal WHERE nombre ILIKE '%Alfredo%' OR apellido ILIKE '%German%'");
        userRes.rows.forEach(u => {
            console.log('User:', u);
        });

        // 2. Global Counts
        console.log('\n--- Tables ---');
        const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
        console.log('Tables:', tables.rows.map(r => r.table_name).join(', '));

        console.log('\n--- Airport 34 ---');
        const aero34 = await client.query('SELECT * FROM aeropuerto WHERE id = 34');
        console.log('Airport 34:', aero34.rows[0]);


        await client.end();
    } catch (err) {
        console.error('❌ DB Error:', err.message);
    }
}

inspectData();
