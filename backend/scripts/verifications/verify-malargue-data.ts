


const prisma = new PrismaClient();

async function main() {
    console.log('🕵️‍♂️ Investigating Malargue...');

    // 1. Raw Dump
    const all = await prisma.vhf.findMany({
        where: {
            OR: [
                { aeropuerto: { contains: 'Mal', mode: 'insensitive' } },
                { sitio: { contains: 'Mal', mode: 'insensitive' } }
            ]
        }
    });

    console.log(`Found ${all.length} generic matches for 'Mal'`);
    all.forEach(r => console.log(`[${r.id}] Apt: '${r.aeropuerto}' | Sitio: '${r.sitio}' | FIR: '${r.fir}'`));

    // 2. Exact Logic test
    const aptName = "Malargue";
    const where: any = {
        OR: [
            { aeropuerto: { contains: 'MLG', mode: 'insensitive' } },
            { sitio: { contains: 'MLG', mode: 'insensitive' } },
            { aeropuerto: { contains: aptName, mode: 'insensitive' } },
            { sitio: { contains: aptName, mode: 'insensitive' } }
        ]
    };

    console.log('Testing specific WHERE:', JSON.stringify(where, null, 2));

    const specific = await prisma.vhf.findMany({
        where,
        include: { equipos: true }
    });
    console.log(`Specific match count: ${specific.length}`);
    specific.forEach(s => {
        console.log(`VHF ID ${s.id} has ${s.equipos.length} equipments.`);
        if (s.equipos.length > 0) console.log('Sample Eq:', s.equipos[0]);
    });

}

main()
    .finally(async () => await prisma.$disconnect());
