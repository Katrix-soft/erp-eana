


const prisma = new PrismaClient();

async function diagnoseAncasti() {
    console.log('--- Diagnosing Ancasti Data ---');

    // 1. Find Airport
    const ancasti = await prisma.aeropuerto.findFirst({
        where: {
            OR: [
                { nombre: { contains: 'Ancasti', mode: 'insensitive' } },
                { codigo: 'ANC' } // Assuming code from previous output
            ]
        },
        include: { fir: true }
    });

    if (!ancasti) {
        console.log('❌ Airport "Ancasti" NOT FOUND in DB');
        return;
    }

    console.log(`✅ Airport Found: ${ancasti.nombre} (ID: ${ancasti.id})`);
    console.log(`   FIR: ${ancasti.fir.nombre} (ID: ${ancasti.firId})`);
    console.log(`   Code: ${ancasti.codigo}`);

    // 2. Count Equipments
    // 2. Count Equipments
    const commsCount = await prisma.comunicaciones.count({
        where: { aeropuertoId: ancasti.id }
    });

    console.log(`\n📊 Total Communications Equipments for ID ${ancasti.id}: ${commsCount}`);

    if (commsCount > 0) {
        const comms = await prisma.comunicaciones.findMany({
            where: { aeropuertoId: ancasti.id },
            take: 10
        });
        console.log('\n--- First 10 Equipments ---');
        console.table(comms.map(c => ({ id: c.id, nombre: c.nombre, tipo: c.tipo, estado: c.estado })));
    } else {
        console.log('⚠️ No equipments found for this airport.');
    }

    // 3. User Context Check (Admin)
    const admin = await prisma.user.findFirst({
        where: { email: 'admin@eana.com' },
        include: { personal: { include: { aeropuerto: true, fir: true } } }
    });

    if (admin && admin.personal) {
        console.log(`\n👤 Admin User Context:`);
        console.log(`   Personal ID: ${admin.personal.id}`);
        console.log(`   Assigned Airport: ${admin.personal.aeropuerto?.nombre}`);
        console.log(`   Assigned FIR: ${admin.personal.fir?.nombre}`);
    }

    await prisma.$disconnect();
}

diagnoseAncasti();
