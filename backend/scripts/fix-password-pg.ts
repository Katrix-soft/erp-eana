
import { Client } from 'pg';
import * as bcrypt from 'bcrypt';

async function main() {
    const email = process.argv[2] || 'asanchez@eana.com.ar';
    const password = process.argv[3] || 'Eana2024!';

    const client = new Client({
        host: 'localhost',
        port: 5434,
        user: 'postgres',
        password: 'postgrespassword',
        database: 'cns_db',
    });

    try {
        await client.connect();
        const hashedPassword = await bcrypt.hash(password, 10);

        const res = await client.query(
            'UPDATE "users" SET "password" = $1 WHERE "email" = $2 RETURNING id',
            [hashedPassword, email]
        );

        if (res.rowCount > 0) {
            console.log(`✅ Password successfully updated for ${email}`);
        } else {
            console.error(`❌ User with email ${email} not found.`);
        }
    } catch (err) {
        console.error('❌ Error updating password:', err);
    } finally {
        await client.end();
    }
}

main();
