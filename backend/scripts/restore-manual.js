const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const DATA_DIR = path.join(__dirname, '..');

// Map identical to TS file
const FILES_TO_TABLES = [
    { file: 'firs_202601161523.csv', table: 'firs' },
    { file: 'aeropuertos_202601161523.csv', table: 'aeropuertos' },
    { file: 'puestos_personal_202601161523.csv', table: 'puestos_personal' },
    { file: 'users_202601161523.csv', table: 'users' },
    { file: 'personal_202601161523.csv', table: 'personal' },
    { file: 'vhf_202601161523.csv', table: 'vhf' },
    { file: 'equipos_202601161523.csv', table: 'equipos' },
    { file: 'canales_202601161523.csv', table: 'canales' },
    { file: 'frecuencias_202601161523.csv', table: 'frecuencias' },
    { file: 'comunicaciones_202601161523.csv', table: 'comunicaciones' },
    { file: 'activos_comunicaciones_202601161523.csv', table: 'activos_comunicaciones' },
    { file: 'navegacion_202601161523.csv', table: 'navegacion' },
    { file: 'equipos_navegacion_202601161523.csv', table: 'equipos_navegacion' },
    { file: 'vigilancia_202601161523.csv', table: 'vigilancia' },
    { file: 'energia_202601161523.csv', table: 'energia' },
    { file: 'turnos_202601161523.csv', table: 'turnos' },
    { file: 'chat_rooms_202601161523.csv', table: 'chat_rooms' },
    { file: 'chat_participants_202601161523.csv', table: 'chat_participants' },
    { file: 'chat_messages_202601161523.csv', table: 'chat_messages' },
    { file: 'foro_posts_202601161523.csv', table: 'foro_posts' },
    { file: 'foro_comments_202601161523.csv', table: 'foro_comments' },
    { file: 'checklists_202601161523.csv', table: 'checklists' },
    { file: 'work_orders_202601161523.csv', table: 'work_orders' },
    { file: 'notifications_202601161523.csv', table: 'notifications' },
    { file: 'audit_logs_202601161523.csv', table: 'audit_logs' },
    { file: 'system_settings_202601161523.csv', table: 'system_settings' },
    { file: 'vor_measurements_202601161523.csv', table: 'vor_measurements' },
];

async function main() {
    console.log('Connecting to DB via localhost:5434...');
    const client = new Client({
        host: 'localhost',
        port: 5434, // External port
        user: 'postgres',
        password: 'postgrespassword',
        database: 'cns_db',
    });

    try {
        await client.connect();
        console.log('✅ Connected to DB');

        for (const item of FILES_TO_TABLES) {
            const filePath = path.join(DATA_DIR, item.file);
            if (!fs.existsSync(filePath)) {
                console.warn(`⚠️ Skipped missing file: ${item.file}`);
                continue;
            }

            console.log(`📥 Processing ${item.file} -> ${item.table}...`);
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const records = parse(fileContent, {
                columns: true,
                skip_empty_lines: true,
                relax_quotes: true
            });

            if (records.length === 0) continue;

            const columns = Object.keys(records[0]).map(c => `"${c}"`).join(', ');

            let inserted = 0;
            for (const record of records) {
                const values = Object.entries(record).map(([key, val]) => {
                    if (val === '') {
                        if (key === 'imagenes') return '{}';
                        if (key === 'password_changed') return true;
                        if (key === 'vistas') return 0;
                        if (key === 'resuelto') return false;
                        if (key === 'activa') return true;
                        return null;
                    }
                    if (val === 't' || val === 'true') return true;
                    if (val === 'f' || val === 'false') return false;
                    return val;
                });

                const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
                const query = `INSERT INTO "${item.table}" (${columns}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;

                try {
                    await client.query(query, values);
                    inserted++;
                } catch (e) {
                    if (!e.message.includes('duplicate key') && !e.message.includes('violates foreign key constraint')) {
                        // Ignore FK errors for now as order might be tricky or data incomplete
                        console.error(`Error inserting into ${item.table}: ${e.message}`);
                    }
                }
            }
            console.log(`   ✅ Inserted ${inserted} records into ${item.table}`);

            // Reset sequence logic simplified or omitted if not critical
            try {
                await client.query(`SELECT setval(pg_get_serial_sequence('${item.table}', 'id'), COALESCE(MAX(id), 1)) FROM "${item.table}"`);
            } catch (e) { }
        }

        console.log('🎉 Restoration Complete');

    } catch (e) {
        console.error('❌ Fatal Error:', e);
    } finally {
        await client.end();
    }
}

main();
