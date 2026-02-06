import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
    const client = new Client({
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5434'),
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'postgrespassword',
        database: process.env.POSTGRES_DB || 'cns_db',
    });

    console.log('Seeding initial data for Forum and Chat...');

    try {
        await client.connect();

        // 1. Create General Chat Room
        await client.query(`
            INSERT INTO chat_rooms (id, nombre, descripcion, tipo, activa) 
            VALUES (1, 'Chat General CNS', 'Sala de chat para comunicación general entre técnicos de todo el país.', 'GENERAL', true)
            ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre, descripcion = EXCLUDED.descripcion
        `);
        console.log('Created or updated general chat room');

        // 2. Create Sector Rooms
        const sectors = ['COMUNICACIONES', 'NAVEGACION', 'VIGILANCIA', 'ENERGIA'];
        for (const sector of sectors) {
            try {
                await client.query(`
                    INSERT INTO chat_rooms (nombre, descripcion, tipo, sector, activa) 
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT DO NOTHING
                `, [`Chat Sector ${sector}`, `Sala específica para técnicos de ${sector.toLowerCase()}.`, 'SECTOR', sector, true]);
                console.log(`Ensured room for ${sector}`);
            } catch (e: any) {
                console.log(`Room for ${sector} already exists or error:`, e.message);
            }
        }

        console.log('Seeding completed!');
    } catch (error) {
        console.error('❌ Error during seeding:', error);
    } finally {
        await client.end();
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
