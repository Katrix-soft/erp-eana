
import { Client } from 'pg';
import * as fs from 'fs';

async function dumpVhf() {
    const client = new Client({
        host: 'localhost',
        port: 5434,
        user: 'postgres',
        password: 'postgrespassword',
        database: 'cns_db',
    });

    try {
        await client.connect();
        const res = await client.query('SELECT DISTINCT aeropuerto FROM vhf ORDER BY aeropuerto');
        const aeropuertos = res.rows.map(r => r.aeropuerto);
        fs.writeFileSync('vhf_airports.txt', aeropuertos.join('\n'));
        console.log('Dumped to vhf_airports.txt');
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

dumpVhf();
