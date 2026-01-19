


const prisma = new PrismaClient();

async function main() {
    console.log('Checking Vigilancia records...');
    const count = await prisma.vigilancia.count();
    console.log(`Total Vigilancia records: ${count}`);

    const all = await prisma.vigilancia.findMany({
        take: 10,
        include: {
            aeropuerto: true,
            firRel: true
        }
    });

    console.log('Sample records:');
    console.dir(all, { depth: null });

    // Specifically check for records related to Malargüe or DOZ
    const malargue = await prisma.vigilancia.findMany({
        where: {
            OR: [
                { ubicacion: { contains: 'Malargüe', mode: 'insensitive' } },
                { siglasLocal: { equals: 'SAMM', mode: 'insensitive' } },
                { fir: { contains: 'DOZ', mode: 'insensitive' } }
            ]
        }
    });

    console.log(`\nRecords matching 'Malargüe' or 'SAMM' or 'DOZ': ${malargue.length}`);
    console.dir(malargue, { depth: null });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
