

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding initial data for Forum and Chat...');

    // 1. Create General Chat Room
    const generalRoom = await prisma.chatRoom.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            nombre: 'Chat General CNS',
            descripcion: 'Sala de chat para comunicación general entre técnicos de todo el país.',
            tipo: 'GENERAL',
            activa: true,
        },
    });
    console.log('Created general chat room:', generalRoom.nombre);

    // 2. Create Sector Rooms
    const sectors = ['COMUNICACIONES', 'NAVEGACION', 'VIGILANCIA', 'ENERGIA'];
    for (const sector of sectors) {
        await prisma.chatRoom.create({
            data: {
                nombre: `Chat Sector ${sector}`,
                descripcion: `Sala específica para técnicos de ${sector.toLowerCase()}.`,
                tipo: 'SECTOR',
                sector: sector as any,
                activa: true,
            },
        }).catch(e => console.log(`Room for ${sector} already exists or error:`, e.message));
    }

    console.log('Seeding completed!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
