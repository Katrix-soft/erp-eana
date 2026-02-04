
import { Client } from 'pg';

async function checkVhfCodes() {
    const client = new Client({
        host: 'localhost',
        port: 5434,
        user: 'postgres',
        password: 'postgrespassword',
        database: 'cns_db',
    });

    try {
        await client.connect();

        console.log('--- VHF Search ---');
        // Search for MLG or SAMM
        const vhfMLG = await client.query("SELECT * FROM vhf WHERE aeropuerto ILIKE '%MLG%' OR aeropuerto ILIKE '%SAMM%'");
        console.log('VHF MLG/SAMM matched:', vhfMLG.rows.length);
        if (vhfMLG.rows.length > 0) console.log('Sample:', vhfMLG.rows[0]);

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

checkVhfCodes();
