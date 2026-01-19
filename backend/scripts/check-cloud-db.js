
const { Client } = require('pg');

async function checkCloudData() {
    // URL from previous .env view
    const connectionString = "postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19pZFJjSmJUT3diVjJNWld2Vmg3b2ciLCJhcGlfa2V5IjoiMDFLQVpaWFZHNUg1TjZZNUNLVzJTNkMxQjciLCJ0ZW5hbnRfaWQiOiI2OGRmMDM2YzI5YzMwYTkyNmRhN2JmNzZiMjViMzhiNjFiYmM3MGI2NDJlMGE2ZDFlMWEyNDA1ODg5NGFiNDljIiwiaW50ZXJuYWxfc2VjcmV0IjoiZDgyYzRlNjYtNTIyYS00YTk0LWE4Y2EtZWJmZjVkYTIxOTE5In0.j_PPoM3y-P4pjJn08_fHp33_LwLCcLtEOsyBacwgMn8";

    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to Cloud DB. Checking tables...');

        const res = await client.query(`
            SELECT 
                (SELECT count(*) FROM "users") as users_count,
                (SELECT count(*) FROM "personal") as personal_count,
                (SELECT count(*) FROM "vhf") as vhf_count
        `);

        console.log('Data found in Cloud:', res.rows[0]);
        await client.end();
    } catch (e) {
        console.error('Could not connect to Cloud DB:', e.message);
    }
}

checkCloudData();
