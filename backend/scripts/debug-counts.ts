
import { Client } from 'pg';

async function checkCounts() {
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

        // Check tables existence
        const tablesRes = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
        const tables = tablesRes.rows.map(r => r.table_name);

        const hasNavegacion = tables.includes('navegacion');
        const hasEquipos = tables.includes('equipos');
        const hasVhf = tables.includes('vhf');
        const hasAeropuertos = tables.includes('aeropuertos');

        console.log({ hasNavegacion, hasEquipos, hasVhf, hasAeropuertos });

        if (hasEquipos) {
            // Check 'vhf_id' column existence in 'equipos'
            const cols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'equipos'");
            const colNames = cols.rows.map(r => r.column_name);
            console.log('Equipos cols:', colNames);

            if (colNames.includes('vhf_id')) {
                const eqVhfCount = await client.query('SELECT count(*) FROM equipos WHERE vhf_id IS NOT NULL');
                console.log('Equipos with vhf_id NOT NULL:', eqVhfCount.rows[0].count);
            } else {
                console.log('❌ Column vhf_id missing in equipos');
            }
        }

        if (hasNavegacion) {
            const navCount = await client.query('SELECT count(*) FROM navegacion');
            console.log('Navegacion count:', navCount.rows[0].count);
        } else {
            console.log('❌ Table navegacion missing');
        }

        if (hasAeropuertos) {
            const aeroCount = await client.query('SELECT count(*) FROM aeropuertos');
            console.log('Aeropuertos count:', aeroCount.rows[0].count);
        }


        // Check Airport 34
        const aero34 = await client.query('SELECT * FROM aeropuertos WHERE id = 34');
        if (aero34.rows.length) {
            const aero = aero34.rows[0];
            console.log('Airport 34:', aero);

            // Check Navegacion for this airport
            const nav = await client.query('SELECT count(*) FROM navegacion WHERE aeropuerto_id = 34');
            console.log(`Navegacion for Airport 34: ${nav.rows[0].count}`);

            // Check VHF table structure and content for this airport
            const vhfCols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'vhf'");
            console.log('Vhf Cols:', vhfCols.rows.map(r => r.column_name));

            // Try matching by name (since code uses name)
            const vhfName = await client.query("SELECT count(*) FROM vhf WHERE aeropuerto = $1", [aero.nombre]);
            console.log(`Vhf count by name '${aero.nombre}': ${vhfName.rows[0].count}`);

            // Try matching by id if exists
            if (vhfCols.rows.map(r => r.column_name).includes('aeropuerto_id')) {
                const vhfId = await client.query("SELECT count(*) FROM vhf WHERE aeropuerto_id = 34");
                console.log(`Vhf count by ID 34: ${vhfId.rows[0].count}`);
            }
        }


    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

checkCounts();
