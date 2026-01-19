


const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Debugging VHF Data for Malargue...');

    // 1. Check what is in the table generally
    const sample = await prisma.vhf.findMany({ take: 5 });
    console.log('Sample records:', sample);

    // 2. Check explicitly for Malargue with various queries
    const byName = await prisma.vhf.findMany({
        where: {
            aeropuerto: { contains: 'Malarg', mode: 'insensitive' }
        }
    });
    console.log(`ByName 'Malarg': Found ${byName.length} records.`);
    if (byName.length > 0) console.log('Sample ByName:', byName[0]);

    // 3. Check Airport definition
    const apt = await prisma.aeropuerto.findFirst({ where: { codigo: 'MLG' } });
    console.log('Airport MLG in DB:', apt);

    // 4. Simulate the Service Logic
    const filter = 'MLG';
    let vhfWhere: any = {};
    vhfWhere.OR = [
        { aeropuerto: { contains: filter, mode: 'insensitive' } },
        { sitio: { contains: filter, mode: 'insensitive' } }
    ];

    if (filter.length === 3) {
        if (apt) {
            console.log(`Resolved Code ${filter} to Name '${apt.nombre}'`);
            vhfWhere.OR.push({ aeropuerto: { contains: apt.nombre, mode: 'insensitive' } });
        }
    }

    console.log('Constructed Where:', JSON.stringify(vhfWhere, null, 2));

    const results = await prisma.vhf.findMany({
        where: vhfWhere,
        include: { equipos: true }
    });
    console.log(`Service Logic Result: ${results.length} records.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
