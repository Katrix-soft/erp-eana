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
        const email = 'admin@eana.com.ar';
        const password = 'admin1234';
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if table exists
        const tableCheck = await client.query("SELECT to_regclass('public.users')");
        if (!tableCheck.rows[0].to_regclass) {
            console.log('❌ Table "users" does not exist yet. Please start the backend first so TypeORM creates it.');
            return;
        }

        // Upsert user
        const result = await client.query('SELECT id FROM users WHERE email = $1', [email]);
        if (result.rows.length > 0) {
            await client.query('UPDATE users SET password = $1, role = $2 WHERE email = $3', [hashedPassword, 'ADMIN', email]);
            console.log('✅ Updated existing admin user');
        } else {
            await client.query('INSERT INTO users (email, password, role, password_changed) VALUES ($1, $2, $3, $4)', [email, hashedPassword, 'ADMIN', true]);
            console.log('✅ Created new admin user');
        }

        console.log('\n📋 CREDENCIALES DE ADMIN:');
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.end();
    }
}

main().catch(e => console.error(e));
