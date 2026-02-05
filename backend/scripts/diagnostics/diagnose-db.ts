
import { Client } from 'pg';

const CONFIGS = [
    // Local Docker (Current Plan)
    { host: 'localhost', port: 5434, user: 'postgres', password: 'postgrespassword', db: 'cns_db', label: 'Docker (5434)' },
    // Local Native (Default)
    { host: 'localhost', port: 5432, user: 'postgres', password: 'postgres', db: 'postgres', label: 'Local Native (postgres)' },
    { host: 'localhost', port: 5432, user: 'postgres', password: 'postgrespassword', db: 'postgres', label: 'Local Native (postgrespassword)' },
    { host: 'localhost', port: 5432, user: 'postgres', password: 'admin', db: 'postgres', label: 'Local Native (admin)' },
    { host: 'localhost', port: 5432, user: 'postgres', password: 'root', db: 'postgres', label: 'Local Native (root)' },
    { host: 'localhost', port: 5432, user: 'postgres', password: '1234', db: 'postgres', label: 'Local Native (1234)' },
    { host: 'localhost', port: 5432, user: 'postgres', password: '', db: 'postgres', label: 'Local Native (empty)' },
];

async function main() {
    console.log('🔍 Buscando servidor de base de datos disponible...');

    for (const conf of CONFIGS) {
        const client = new Client({
            host: conf.host,
            port: conf.port,
            user: conf.user,
            password: conf.password,
            database: conf.db,
            connectionTimeoutMillis: 2000,
        });

        try {
            await client.connect();
            console.log(`✅ ¡ÉXITO! Conectado a ${conf.label}`);
            console.log(`   Host: ${conf.host}:${conf.port}`);
            console.log(`   User: ${conf.user}`);
            console.log(`   Pass: ${conf.password}`);

            // If we found a working one, update .env?
            // For now just exit success
            await client.end();
            process.exit(0);
        } catch (e) {
            // console.log(`❌ Falló ${conf.label}: ${e.message}`);
            await client.end();
        }
    }

    console.log('❌ No se pudo conectar a ninguna base de datos conocida.');
    process.exit(1);
}

main();
