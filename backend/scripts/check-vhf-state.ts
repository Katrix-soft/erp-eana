
import { Client } from 'pg';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function main() {
    console.log('🔍 Verificando estado de las tablas vhf y equipo...\n');

    const client = new Client({
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5434'),
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'postgrespassword',
        database: process.env.POSTGRES_DB || 'cns_db',
    });

    try {
        await client.connect();

        // Contar registros vhf
        const resVhf = await client.query('SELECT COUNT(*) FROM vhf');
        console.log(`📊 TOTAL VHF (Sitios): ${resVhf.rows[0].count}`);

        // Contar registros equipos
        const resEquipos = await client.query('SELECT COUNT(*) FROM equipos');
        console.log(`📊 TOTAL EQUIPOS: ${resEquipos.rows[0].count}`);

        if (resEquipos.rows[0].count > 0) {
            console.log('\n📻 Algunos ejemplos de equipos:');
            const resEjemplos = await client.query('SELECT "tipoEquipo", marca, modelo, "numeroSerie" FROM equipos LIMIT 5');
            resEjemplos.rows.forEach(row => {
                console.log(`  - ${row.tipoEquipo} | ${row.marca} ${row.modelo} | SN: ${row.numeroSerie}`);
            });
        }

    } catch (error) {
        console.error('❌ Error checking DB:', error);
    } finally {
        await client.end();
    }
}

main();
