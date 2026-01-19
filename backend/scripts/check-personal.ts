


const prisma = new PrismaClient();

async function main() {
    const personal = await prisma.personal.findFirst({
        where: {
            OR: [
                { nombre: { contains: 'Alfredo', mode: 'insensitive' } },
                { apellido: { contains: 'Sanchez', mode: 'insensitive' } }
            ]
        },
        include: {
            user: true,
            aeropuerto: true,
            fir: true
        }
    });

    if (!personal) {
        console.log('Personal record not found');
        return;
    }

    console.log('Personal info:');
    console.dir(personal, { depth: null });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
