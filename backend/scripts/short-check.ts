


const prisma = new PrismaClient();

async function main() {
    const p = await prisma.personal.findFirst({
        where: {
            nombre: { contains: 'Alfredo', mode: 'insensitive' }
        },
        include: {
            aeropuerto: true,
            fir: true
        }
    });

    if (p) {
        console.log(`ID: ${p.id}, Nombre: ${p.nombre} ${p.apellido}, AeroId: ${p.aeropuertoId}, FIRId: ${p.firId}, UserID: ${p.userId}`);
    } else {
        console.log('User not found');
    }
}

main().finally(() => prisma.$disconnect());
