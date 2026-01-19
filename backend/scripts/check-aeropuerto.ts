
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const airports = await prisma.aeropuerto.findMany({
        where: {
            OR: [
                { nombre: { contains: 'Malarg', mode: 'insensitive' } },
                { codigo: { contains: 'SAMM', mode: 'insensitive' } }
            ]
        },
        include: { fir: true }
    });

    console.log('Airports found:');
    console.dir(airports, { depth: null });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
