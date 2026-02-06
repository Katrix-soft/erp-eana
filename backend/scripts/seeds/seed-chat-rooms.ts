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

    try {
        await client.connect();
        const res = await client.query('SELECT COUNT(*) FROM chat_rooms');
        const count = parseInt(res.rows[0].count);

        if (count > 0) {
            console.log(`Ya existen ${count} salas de chat. No se crearán nuevas.`);
            return;
        }

        console.log('Creando salas de chat iniciales...');

        const rooms = [
            {
                nombre: 'Sala General',
                descripcion: 'Espacio para discusiones generales de todo EANA',
                tipo: 'GENERAL',
            },
            {
                nombre: 'CNSE General',
                descripcion: 'Sala exclusiva para el sector CNSE',
                tipo: 'SECTOR',
                sector: 'CNSE',
            },
            {
                nombre: 'Comunicaciones',
                descripcion: 'Sala técnica de Comunicaciones',
                tipo: 'SECTOR',
                sector: 'COMUNICACIONES',
            },
            {
                nombre: 'Navegación',
                descripcion: 'Sala técnica de Navegación',
                tipo: 'SECTOR',
                sector: 'NAVEGACION',
            },
            {
                nombre: 'Vigilancia',
                descripcion: 'Sala técnica de Vigilancia',
                tipo: 'SECTOR',
                sector: 'VIGILANCIA',
            },
        ];

        for (const room of rooms) {
            await client.query(
                'INSERT INTO chat_rooms (nombre, descripcion, tipo, sector, activa) VALUES ($1, $2, $3, $4, $5)',
                [room.nombre, room.descripcion, room.tipo, room.sector || null, true]
            );
            console.log(`Sala creada: ${room.nombre}`);
        }

        console.log('Salas de chat creadas exitosamente.');

    } catch (error) {
        console.error('Error al crear salas de chat:', error);
    } finally {
        await client.end();
    }
}

main();
