
import { Client } from 'pg';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function main() {
    console.log('🔍 Checking database tables...\n');

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
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log('Tables found:');
        res.rows.forEach(row => console.log(` - ${row.table_name}`));

        // Check users
        const userRes = await client.query('SELECT COUNT(*) FROM users');
        console.log(`\nTotal users: ${userRes.rows[0].count}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.end();
    }
}

main();
