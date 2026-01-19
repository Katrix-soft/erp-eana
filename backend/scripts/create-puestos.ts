


const prisma = new PrismaClient();

async function main() {
    console.log('Creating Puestos...');
    const puestos = ['Técnico', 'Jefe CNS', 'Coordinador', 'Supervisor'];

    for (const nombre of puestos) {
        await prisma.puestoPersonal.upsert({
            where: { nombre_sector: { nombre, sector: 'CNSE' } },
            update: {},
            create: { nombre, sector: 'CNSE' }
        });
    }

    console.log('Puestos created/verified.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
