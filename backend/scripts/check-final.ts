
import { Client } from 'pg';

async function checkFinal() {
    const client = new Client({
        host: 'localhost',
        port: 5434,
        user: 'postgres',
        password: 'postgrespassword',
        database: 'cns_db',
    });

    try {
        await client.connect();
        const vhfRes = await client.query("SELECT id FROM vhf WHERE aeropuerto = 'Malargue'");
        if (vhfRes.rows.length > 0) {
            const vhfId = vhfRes.rows[0].id;
            console.log(`VHF ID for Malargue: ${vhfId}`);

            const eqCount = await client.query("SELECT count(*) FROM equipos WHERE vhf_id = $1", [vhfId]);
            console.log(`Linked Equipos count: ${eqCount.rows[0].count}`);
        } else {
            console.log('No VHF record for Malargue');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

checkFinal();
