

const prisma = new PrismaClient();

async function checkData() {
    try {
        const vhfCount = await prisma.vhf.count();
        const equipoCount = await prisma.equipo.count();
        const comunicacionesCount = await prisma.comunicaciones.count();
        const navegacionCount = await prisma.navegacion.count();
        const vigilanciaCount = await prisma.vigilancia.count();
        const energiaCount = await prisma.energia.count();
        const aeropuertosCount = await prisma.aeropuerto.count();

        console.log('=== CONTEO DE DATOS ===');
        console.log('VHF:', vhfCount);
        console.log('Equipo:', equipoCount);
        console.log('Comunicaciones:', comunicacionesCount);
        console.log('Navegacion:', navegacionCount);
        console.log('Vigilancia:', vigilanciaCount);
        console.log('Energia:', energiaCount);
        console.log('Aeropuertos:', aeropuertosCount);

        // Mostrar algunos registros de VHF y Equipo
        if (vhfCount > 0) {
            const vhfSample = await prisma.vhf.findMany({ take: 3 });
            console.log('\n=== MUESTRA DE VHF ===');
            console.log(JSON.stringify(vhfSample, null, 2));
        }

        if (equipoCount > 0) {
            const equipoSample = await prisma.equipo.findMany({ take: 3, include: { vhf: true } });
            console.log('\n=== MUESTRA DE EQUIPOS ===');
            console.log(JSON.stringify(equipoSample, null, 2));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkData();
