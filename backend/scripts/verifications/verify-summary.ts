import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

async function main() {
    const client = new Client({
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5434'),
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'postgrespassword',
        database: process.env.POSTGRES_DB || 'cns_db',
    });

    try {
        await client.connect();

        const vhfRes = await client.query('SELECT COUNT(*) FROM vhf');
        const equipoRes = await client.query('SELECT COUNT(*) FROM equipos');
        const airportRes = await client.query('SELECT COUNT(DISTINCT aeropuerto) FROM vhf');

        console.log(`=== RESUMEN DE IMPORTACION ===`);
        console.log(`Total Sitios (VHF): ${vhfRes.rows[0].count}`);
        console.log(`Total Equipos: ${equipoRes.rows[0].count}`);
        console.log(`Total Aeropuertos únicos: ${airportRes.rows[0].count}`);

        console.log(`\nEjemplo: Ezeiza`);
        const ezeRes = await client.query(`
            SELECT v.fir, v.sitio, v.id 
            FROM vhf v 
            WHERE v.aeropuerto ILIKE '%Ezeiza%' 
            LIMIT 1
        `);

        if (ezeRes.rows.length > 0) {
            const eze = ezeRes.rows[0];
            console.log(`- FIR: ${eze.fir}, SITIO: ${eze.sitio}`);

            const eqRes = await client.query(`
                SELECT "tipoEquipo", marca, modelo 
                FROM equipos 
                WHERE "vhfId" = $1 
                LIMIT 5
            `, [eze.id]);

            eqRes.rows.forEach((e: any) => console.log(`  * [${e.tipoEquipo}] ${e.marca} ${e.modelo}`));
        }
    } catch (error) {
        console.error('❌ Error in verification summary:', error);
    } finally {
        await client.end();
    }
}

main().catch(e => console.error(e));
