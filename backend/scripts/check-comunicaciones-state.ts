
import { Client } from 'pg';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function main() {
    console.log('🔍 Verificando estado de la tabla comunicaciones...\n');

    const client = new Client({
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5434'),
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'postgrespassword',
        database: process.env.POSTGRES_DB || 'cns_db',
    });

    try {
        await client.connect();

        // Contar registros
        const resTotal = await client.query('SELECT COUNT(*) FROM comunicaciones');
        const total = resTotal.rows[0].count;

        // Contar con frecuencia
        const resFreq = await client.query('SELECT COUNT(*) FROM comunicaciones WHERE frecuencia IS NOT NULL');
        const conFrecuencia = resFreq.rows[0].count;

        console.log(`📊 TOTAL: ${total}`);
        console.log(`✅ CON FRECUENCIA: ${conFrecuencia}`);

        if (conFrecuencia > 0) {
            console.log('\n📻 Algunos ejemplos:');
            const resEjemplos = await client.query('SELECT nombre, frecuencia, canal FROM comunicaciones WHERE frecuencia IS NOT NULL LIMIT 5');
            resEjemplos.rows.forEach(row => {
                console.log(`  - ${row.nombre}: ${row.frecuencia} MHz | Canal: ${row.canal}`);
            });
        } else {
            console.log('\n⚠️ No se encontraron equipos con frecuencia en la tabla comunicaciones.');
        }

    } catch (error) {
        console.error('❌ Error checking DB:', error);
    } finally {
        await client.end();
    }
}

main();
