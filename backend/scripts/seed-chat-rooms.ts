
import { PrismaClient, TipoChatRoom, Sector } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const count = await prisma.chatRoom.count();
        if (count > 0) {
            console.log(`Ya existen ${count} salas de chat. No se crearán nuevas.`);
            return;
        }

        console.log('Creando salas de chat iniciales...');

        const rooms = [
            {
                nombre: 'Sala General',
                descripcion: 'Espacio para discusiones generales de todo EANA',
                tipo: TipoChatRoom.GENERAL,
            },
            {
                nombre: 'CNSE General',
                descripcion: 'Sala exclusiva para el sector CNSE',
                tipo: TipoChatRoom.SECTOR,
                sector: Sector.CNSE,
            },
            {
                nombre: 'Comunicaciones',
                descripcion: 'Sala técnica de Comunicaciones',
                tipo: TipoChatRoom.SECTOR,
                sector: Sector.COMUNICACIONES,
            },
            {
                nombre: 'Navegación',
                descripcion: 'Sala técnica de Navegación',
                tipo: TipoChatRoom.SECTOR,
                sector: Sector.NAVEGACION,
            },
            {
                nombre: 'Vigilancia',
                descripcion: 'Sala técnica de Vigilancia',
                tipo: TipoChatRoom.SECTOR,
                sector: Sector.VIGILANCIA,
            },
        ];

        for (const room of rooms) {
            await prisma.chatRoom.create({
                data: {
                    nombre: room.nombre,
                    descripcion: room.descripcion,
                    tipo: room.tipo,
                    sector: room.sector,
                    activa: true,
                }
            });
            console.log(`Sala creada: ${room.nombre}`);
        }

        console.log('Salas de chat creadas exitosamente.');

    } catch (error) {
        console.error('Error al crear salas de chat:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
