


const prisma = new PrismaClient();

async function main() {
    const userId = 141; // Alfredo German Sanchez
    const user = { userId: userId, role: 'TECNICO', email: 'asanchez@eana.com.ar' };

    console.log('Simulating VigilanciaService.findAll for user 141...');

    const personal = await prisma.personal.findFirst({
        where: { userId: userId },
        include: {
            aeropuerto: { include: { fir: true } },
            fir: true
        }
    });

    if (!personal) {
        console.log('Personal record not found for user 141');
        return;
    }

    console.log(`Contexto Personal: ${personal.nombre} ${personal.apellido}, Aero: ${personal.aeropuertoId}, Code: ${personal.aeropuerto?.codigo}`);

    const where: any = {};
    if (personal.aeropuertoId) {
        where.OR = [
            { aeropuertoId: personal.aeropuertoId },
            { siglasLocal: { equals: personal.aeropuerto?.codigo, mode: 'insensitive' } }
        ];
    }

    console.log('Final Query Where:', JSON.stringify(where, null, 2));

    const results = await prisma.vigilancia.findMany({
        where,
        include: {
            aeropuerto: true,
            firRel: true,
        }
    });

    console.log('Results count:', results.length);
    results.forEach(r => console.log(`ID: ${r.id}, Ubicacion: ${r.ubicacion}, AeroId: ${r.aeropuertoId}`));
}

main().finally(() => prisma.$disconnect());
