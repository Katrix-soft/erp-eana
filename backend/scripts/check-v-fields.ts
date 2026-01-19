


const prisma = new PrismaClient();

async function main() {
    const v = await prisma.vigilancia.findFirst({
        where: { ubicacion: { contains: 'Malarg', mode: 'insensitive' } }
    });

    if (v) {
        console.log('Vigilancia Malargue:');
        console.dir(v, { depth: null });
    } else {
        console.log('Not found');
    }
}

main().finally(() => prisma.$disconnect());
