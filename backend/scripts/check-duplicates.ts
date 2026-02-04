import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function checkDuplicates() {
    const client = new Client({
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5434'),
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'postgrespassword',
        database: process.env.POSTGRES_DB || 'cns_db',
    });

    try {
        await client.connect();

        console.log('--- DUPLICATES CHECK ---');

        // 1. Users by email
        const userDupes = await client.query(`
            SELECT email, COUNT(*) 
            FROM users 
            GROUP BY email 
            HAVING COUNT(*) > 1
        `);
        console.log(`Duplicate users by email: ${userDupes.rows.length}`);
        userDupes.rows.forEach(r => console.log(`  ${r.email}: ${r.count}`));

        // 2. Personal by DNI
        const personalDniDupes = await client.query(`
            SELECT dni, COUNT(*) 
            FROM personal 
            WHERE dni IS NOT NULL 
            GROUP BY dni 
            HAVING COUNT(*) > 1
        `);
        console.log(`Duplicate personal by DNI: ${personalDniDupes.rows.length}`);
        personalDniDupes.rows.forEach(r => console.log(`  ${r.dni}: ${r.count}`));

        // 3. Personal by Name/Apellido (suspected duplicates)
        const personalNameDupes = await client.query(`
            SELECT nombre, apellido, COUNT(*) 
            FROM personal 
            GROUP BY nombre, apellido 
            HAVING COUNT(*) > 1
        `);
        console.log(`Duplicate personal by Name/Apellido: ${personalNameDupes.rows.length}`);
        personalNameDupes.rows.forEach(r => console.log(`  ${r.nombre} ${r.apellido}: ${r.count}`));

        // 4. Broken relationships
        const brokenAeropuertos = await client.query(`
            SELECT COUNT(*) FROM personal p 
            LEFT JOIN aeropuertos a ON p.aeropuerto_id = a.id 
            WHERE p.aeropuerto_id IS NOT NULL AND a.id IS NULL
        `);
        console.log(`Personal with invalid aeropuerto_id: ${brokenAeropuertos.rows[0].count}`);

        const brokenPuestos = await client.query(`
            SELECT COUNT(*) FROM personal p 
            LEFT JOIN puestos_personal pp ON p.puesto_id = pp.id 
            WHERE p.puesto_id IS NOT NULL AND pp.id IS NULL
        `);
        console.log(`Personal with invalid puesto_id: ${brokenPuestos.rows[0].count}`);

    } catch (error) {
        console.error('❌ Error checking duplicates:', error);
    } finally {
        await client.end();
    }
}

checkDuplicates();
