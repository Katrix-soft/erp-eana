import { Client } from 'pg';
import * as bcrypt from 'bcrypt';
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
        console.log('--- BUSCANDO USUARIO igsanchez ---');
        const res = await client.query(`
            SELECT u.id, u.email, u.password, p.dni, p.nombre, p.apellido 
            FROM users u
            LEFT JOIN personal p ON u."personalId" = p.id
            WHERE u.email LIKE 'igsanchez@%' OR p.dni = 'igsanchez'
        `);

        if (res.rows.length === 0) {
            console.log('❌ No se encontró el usuario igsanchez');
            // List some users to see what we have
            const allUsers = await client.query('SELECT email FROM users LIMIT 5');
            console.log('Usuarios disponibles:', allUsers.rows.map(r => r.email));
        } else {
            const user = res.rows[0];
            console.log('✅ Usuario encontrado:', user.email);
            console.log('DNI:', user.dni);

            // Reset password to 'Eana2024' or similar
            const newPassword = user.dni || '123456';
            const hashed = await bcrypt.hash(newPassword, 10);
            await client.query('UPDATE users SET password = $1, "passwordChanged" = false WHERE id = $2', [hashed, user.id]);
            console.log(`✅ Contraseña reseteada para ${user.email} -> ${newPassword}`);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.end();
    }
}

main();
