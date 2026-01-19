


const prisma = new PrismaClient();

async function main() {
    const vhfCount = await prisma.vhf.count();
    const equipoCount = await prisma.equipo.count();
    const airports = await prisma.vhf.findMany({
        select: { aeropuerto: true },
        distinct: ['aeropuerto']
    });

    console.log(`=== RESUMEN DE IMPORTACION ===`);
    console.log(`Total Sitios (VHF): ${vhfCount}`);
    console.log(`Total Equipos: ${equipoCount}`);
    console.log(`Total Aeropuertos únicos: ${airports.length}`);

    console.log(`\nEjemplo: Ezeiza`);
    const eze = await prisma.vhf.findFirst({
        where: { aeropuerto: { contains: 'Ezeiza', mode: 'insensitive' } },
        include: { equipos: { take: 5 } }
    });
    if (eze) {
        console.log(`- FIR: ${eze.fir}, SITIO: ${eze.sitio}`);
        eze.equipos.forEach(e => console.log(`  * [${e.tipoEquipo}] ${e.marca} ${e.modelo}`));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
