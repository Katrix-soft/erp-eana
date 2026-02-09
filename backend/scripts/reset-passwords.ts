import { Client } from 'pg';
import * as bcrypt from 'bcrypt';

async function resetPasswords() {
    const client = new Client({
        host: process.env.POSTGRES_HOST || 'postgres',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'postgrespassword',
        database: process.env.POSTGRES_DB || 'cns_db',
    });

    try {
        await client.connect();
        const password = 'Eana2024!';
        const hashedPassword = await bcrypt.hash(password, 10);

        const users = ['asanchez@eana.com.ar', 'admin@eana.com.ar', 'admin@eana.com'];

        for (const email of users) {
            const res = await client.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email]);
            if (res.rowCount > 0) {
                console.log(`✅ Contraseña actualizada para: ${email}`);
            } else {
                console.log(`⚠️ Usuario no encontrado: ${email}`);
            }
        }

        // También intentar por prefijo para asanchez
        await client.query("UPDATE users SET password = $1 WHERE email LIKE 'asanchez@%'", [hashedPassword]);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.end();
    }
}

resetPasswords();
