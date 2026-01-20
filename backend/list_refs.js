const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const firs = await prisma.fir.findMany({ select: { id: true, nombre: true } });
    const aeros = await prisma.aeropuerto.findMany({ select: { id: true, nombre: true, codigo: true } });
    console.log(JSON.stringify({ firs, aeros }, null, 2));
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
