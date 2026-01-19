


const prisma = new PrismaClient();

async function inspectCommunications() {
    console.log('--- Inspecting Communications Data ---');

    const count = await prisma.comunicaciones.count();
    console.log(`Total Communications Equipment: ${count}`);

    const sample = await prisma.comunicaciones.findMany({
        take: 5,
        orderBy: { id: 'desc' },
        include: {
            aeropuerto: true
        }
    });

    console.log('\n--- Sample Data (Last 5) ---');
    sample.forEach(item => {
        console.log(`[ID: ${item.id}] ${item.nombre} (${item.tipo})`);
        console.log(`   Airport: ${item.aeropuerto?.nombre}`);
        console.log(`   Marca/Modelo: ${item.marca} / ${item.modelo}`);
        console.log(`   Serial: ${item.numeroSerie}`);
        console.log('-----------------------------------');
    });

    // Check for specific import markers or patterns if possible
    // The import script defaults type to 'VHF' if not found.

    const vhfCount = await prisma.comunicaciones.count({
        where: { tipo: 'VHF' }
    });
    console.log(`\nItems with type 'VHF': ${vhfCount}`);

    await prisma.$disconnect();
}

inspectCommunications();
