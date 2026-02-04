
import { Client } from 'pg';

async function fixMalargue() {
    const client = new Client({
        host: 'localhost',
        port: 5434,
        user: 'postgres',
        password: 'postgrespassword',
        database: 'cns_db',
    });

    try {
        await client.connect();
        console.log('✅ Connected');

        // 1. Fix VHF: "Malargüe" -> "Malargue"
        const vhfRes = await client.query("UPDATE vhf SET aeropuerto = 'Malargue' WHERE aeropuerto = 'Malargüe'");
        console.log(`✅ Updated ${vhfRes.rowCount} VHF records from 'Malargüe' to 'Malargue'`);

        // 2. Fix Navegacion: Link "MALARGUE" to ID 34
        // Check finding by name first
        const navFind = await client.query("SELECT * FROM navegacion WHERE nombre = 'MALARGUE' AND aeropuerto_id IS NULL");
        console.log(`Found ${navFind.rowCount} unlinked Navegacion records for MALARGUE`);

        if (navFind.rowCount > 0) {
            const navUpd = await client.query("UPDATE navegacion SET aeropuerto_id = 34 WHERE nombre = 'MALARGUE' AND aeropuerto_id IS NULL");
            console.log(`✅ Linked ${navUpd.rowCount} Navegacion records to Airport ID 34`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

fixMalargue();
