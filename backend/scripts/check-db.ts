


const prisma = new PrismaClient();

async function main() {
    console.log('Connecting to DB...');
    try {
        const userCount = await prisma.user.count();
        const navCount = await prisma.navegacion.count();
        const airportCount = await prisma.aeropuerto.count();

        console.log('--- DB STATUS ---');
        console.log(`Users: ${userCount}`);
        console.log(`Airports: ${airportCount}`);
        console.log(`Navegacion items: ${navCount}`);
        console.log('-----------------');

        if (userCount === 0 && navCount === 0 && airportCount === 0) {
            console.log('DATABASE APPEARS EMPTY');
        } else {
            console.log('DATABASE HAS DATA');
        }

    } catch (error) {
        console.error('Error connecting or querying DB:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
