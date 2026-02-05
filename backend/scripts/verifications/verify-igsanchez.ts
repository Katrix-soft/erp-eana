import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

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
        const res = await client.query(`
            SELECT u.email, p.dni, p.nombre, p.apellido 
            FROM users u
            LEFT JOIN personal p ON p.user_id = u.id
            WHERE u.email ILIKE 'igsanchez%' OR p.dni = 'igsanchez'
        `);

        if (res.rows.length > 0) {
            const user = res.rows[0];
            console.log(`USUARIO: ${user.email}`);
            console.log(`DNI (PASSWORD): ${user.dni || 'eana1234'}`);
            console.log(`NOMBRE: ${user.nombre} ${user.apellido}`);
        } else {
            console.log('NO SE ENCONTRO');
        }

    } catch (error) {
        console.error(error);
    } finally {
        await client.end();
    }
}

main();
