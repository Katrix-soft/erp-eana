


const prisma = new PrismaClient();

async function main() {
    const allPersonal = await prisma.personal.findMany({
        include: {
            user: true,
            aeropuerto: true,
            fir: true
        }
    });

    const target = allPersonal.find(p =>
        (p.nombre + ' ' + p.apellido).toLowerCase().includes('alfredo german') ||
        (p.nombre + ' ' + p.apellido).toLowerCase().includes('sanchez')
    );

    if (target) {
        console.log('Target Personal found:');
        console.dir(target, { depth: null });
    } else {
        console.log('Target Personal not found');
        // Print all names to debug
        console.log('Available names:');
        allPersonal.forEach(p => console.log(`${p.nombre} ${p.apellido}`));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
