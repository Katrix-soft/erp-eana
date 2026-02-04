
import { Client } from 'pg';

async function checkCodes() {
    const client = new Client({
        host: 'localhost',
        port: 5434,
        user: 'postgres',
        password: 'postgrespassword',
        database: 'cns_db',
    });

    try {
        await client.connect();

        const aero34 = await client.query('SELECT * FROM aeropuertos WHERE id = 34');
        const aero = aero34.rows[0];
        console.log('Airport 34 full:', aero);

        // Check VHF for codes
        if (aero.oaci) {
            const vhfOaci = await client.query("SELECT * FROM vhf WHERE aeropuerto ILIKE $1", [`%${aero.oaci}%`]);
            console.log(`VHF match ${aero.oaci}:`, vhfOaci.rows.length);
        }
        if (aero.iata) {
            const vhfIata = await client.query("SELECT * FROM vhf WHERE aeropuerto ILIKE $1", [`%${aero.iata}%`]);
            console.log(`VHF match ${aero.iata}:`, vhfIata.rows.length);
        }

        // Check Navegacion
        // Maybe checks by 'ident' or 'oaci'
        const nav = await client.query("SELECT * FROM navegacion WHERE oaci ILIKE $1 OR ident ILIKE $1 OR nombre ILIKE $2", [`%${aero.oaci || 'XXX'}%`, `%${aero.nombre}%`]);
        console.log('Navegacion match by name/code:', nav.rows.length);
        if (nav.rows.length > 0) console.log('Sample:', nav.rows[0]);

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

checkCodes();
