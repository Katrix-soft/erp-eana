


const prisma = new PrismaClient();

async function main() {
    console.log('Checking Aeropuertos...');
    const allAirports = await prisma.aeropuerto.findMany();
    console.log(`Total Airports: ${allAirports.length}`);

    const malargue = allAirports.find(a => a.nombre.toLowerCase().includes('malar') || a.codigo === 'MLG');
    console.log('Malargue data:', malargue);

    if (malargue) {
        console.log(`Checking equipments for airport ID ${malargue.id}...`);
        const coms = await prisma.comunicaciones.count({ where: { aeropuertoId: malargue.id } });
        const navs = await prisma.equipoNavegacion.count({ where: { navegacion: { aeropuertoId: malargue.id } } });
        const vigs = await prisma.vigilancia.count({ where: { aeropuertoId: malargue.id } });
        const energias = await prisma.energia.count({ where: { aeropuertoId: malargue.id } });

        console.log('Counts:', { coms, navs, vigs, energias });
    } else {
        console.log('Malargue not found in DB');
        // List top 10 airports
        console.log('First 10 airports:', allAirports.slice(0, 10));
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
