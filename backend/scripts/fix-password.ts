
import { Client } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

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
        const email = 'asanchez@eana.com.ar';
        const password = 'eana1234';
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await client.query('UPDATE users SET password = $1 WHERE email = $2 OR email LIKE $3', [hashedPassword, email, 'asanchez@%']);

        if (result.rowCount > 0) {
            console.log(`✅ Password updated for ${email}`);
        } else {
            console.log(`❌ User ${email} not found`);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.end();
    }
}

main().catch(e => console.error(e));
