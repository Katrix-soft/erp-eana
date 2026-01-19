


const prisma = new PrismaClient();

async function main() {
    const count = await prisma.aeropuerto.count();
    console.log(`Total Aeropuertos: ${count}`);

    const sample = await prisma.aeropuerto.findMany({ take: 5 });
    console.log('Sample Aeropuertos:');
    console.dir(sample, { depth: null });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
