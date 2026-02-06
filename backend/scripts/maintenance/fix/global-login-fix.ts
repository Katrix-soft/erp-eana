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

        // Fix column names to match actual DB (TypeORM usually uses snake_case in this project's DB)
        console.log('--- BUSCANDO TODOS LOS USUARIOS ---');
        const res = await client.query(`
            SELECT u.id, u.email, p.dni, p.nombre, p.apellido 
            FROM users u
            LEFT JOIN personal p ON p.user_id = u.id
        `);

        console.log(`Se encontraron ${res.rows.length} usuarios.`);

        for (const row of res.rows) {
            let plainPass = '';
            if (row.email === 'admin@eana.com.ar' || row.email === 'admin@eana.com') {
                plainPass = 'admin1234';
            } else if (row.dni) {
                plainPass = row.dni;
            } else {
                plainPass = 'eana1234';
            }

            const hashed = await bcrypt.hash(plainPass, 10);

            // Note: using password_changed instead of passwordChanged
            await client.query('UPDATE users SET password = $1, password_changed = true WHERE id = $2', [hashed, row.id]);

            if (row.email.includes('igsanchez')) {
                console.log(`✅ EXITO: igsanchez (${row.email}) -> password: ${plainPass}`);
            }
        }

        console.log('✅ Todos los usuarios han sido actualizados con su DNI como contraseña.');
        console.log('Admin: admin@eana.com.ar / admin1234');

    } catch (error) {
        console.error('❌ Error en el script:', error);
    } finally {
        await client.end();
    }
}

main();
