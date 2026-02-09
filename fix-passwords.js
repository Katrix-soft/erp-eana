const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function fix() {
    const hash = await bcrypt.hash('Eana2024!', 10);
    const client = new Client({
        host: 'postgres',
        port: 5432,
        user: 'postgres',
        password: 'postgrespassword',
        database: 'cns_db'
    });

    try {
        await client.connect();
        const emails = ['asanchez@eana.com.ar', 'admin@eana.com.ar', 'admin@eana.com'];
        for (const email of emails) {
            const res = await client.query('UPDATE users SET password = $1 WHERE email = $2', [hash, email]);
            console.log(`User ${email}: ${res.rowCount > 0 ? 'UPDATED' : 'NOT FOUND'}`);
        }
        // Fix any user starting with asanchez
        const res2 = await client.query("UPDATE users SET password = $1 WHERE email LIKE 'asanchez@%'", [hash]);
        console.log(`Users like asanchez@: ${res2.rowCount} UPDATED`);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
fix();
