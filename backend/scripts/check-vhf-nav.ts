
import { Client } from 'pg';

async function checkVhfNav() {
    const client = new Client({
        host: 'localhost',
        port: 5434,
        user: 'postgres',
        password: 'postgrespassword',
        database: 'cns_db',
    });

    try {
        await client.connect();

        console.log('--- VHF ---');
        // Check columns
        const vhfCols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'vhf'");
        const cols = vhfCols.rows.map(r => r.column_name);
        console.log('Columns:', cols);

        // Check distinct values of aeropuerto column
        if (cols.includes('aeropuerto')) {
            const dist = await client.query('SELECT DISTINCT aeropuerto FROM vhf ORDER BY aeropuerto LIMIT 10');
            console.log('Distinct airports in VHF:', dist.rows.map(r => r.aeropuerto));
        }

        // Check if there is ANY record for Malargue (maybe case difference?)
        const malargue = await client.query("SELECT * FROM vhf WHERE aeropuerto ILIKE '%Malargue%' LIMIT 1");
        console.log('Malargue match ILIKE:', malargue.rows);

        console.log('\n--- Navegacion ---');
        // Check for Airport ID 34
        const nav34 = await client.query('SELECT count(*) FROM navegacion WHERE aeropuerto_id = 34');
        console.log('Navegacion count for ID 34:', nav34.rows[0].count);

        // Check columns
        const navCols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'navegacion'");
        console.log('Nav Columns:', navCols.rows.map(r => r.column_name));

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

checkVhfNav();
