

const prisma = new PrismaClient();

async function main() {
    const total = await prisma.comunicaciones.count();
    const conFrecuencia = await prisma.comunicaciones.count({
        where: { frecuencia: { not: null } }
    });

    console.log('📊 ESTADO ACTUAL DE LA BASE DE DATOS');
    console.log('='.repeat(50));
    console.log(`Total de equipos: ${total}`);
    console.log(`Con frecuencia: ${conFrecuencia}`);
    console.log(`Sin frecuencia: ${total - conFrecuencia}`);
    console.log('='.repeat(50));

    const firs = await prisma.fir.findMany();
    console.log('\n🗺️ FIRs en DB:');
    console.log(firs.map(f => f.nombre));

    const airports = await prisma.aeropuerto.findMany({
        take: 5,
        include: { fir: true }
    });
    console.log('\n✈️ Aeropuertos (primeros 5):');
    airports.forEach(a => console.log(`  - ${a.nombre} (FIR: ${a.fir.nombre})`));

    // Mostrar algunos ejemplos
    const ejemplos = await prisma.comunicaciones.findMany({
        take: 5,
        include: {
            aeropuerto: {
                include: {
                    fir: true
                }
            }
        }
    });

    console.log('\n📻 Ejemplos de equipos:');
    ejemplos.forEach(eq => {
        console.log(`  - ${eq.nombre} | ${eq.frecuencia || 0} MHz | ${eq.estado} | ${eq.aeropuerto.nombre}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
