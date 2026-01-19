

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Verificando equipos VHF actualizados...\n');

    // Contar equipos con frecuencia
    const conFrecuencia = await prisma.comunicaciones.count({
        where: {
            frecuencia: {
                not: null
            }
        }
    });

    // Contar equipos sin frecuencia
    const sinFrecuencia = await prisma.comunicaciones.count({
        where: {
            frecuencia: null
        }
    });

    // Total de equipos
    const total = await prisma.comunicaciones.count();

    console.log('📊 RESUMEN:');
    console.log(`  Total de equipos: ${total}`);
    console.log(`  ✅ Con frecuencia: ${conFrecuencia}`);
    console.log(`  ⚠️  Sin frecuencia: ${sinFrecuencia}\n`);

    // Mostrar algunos ejemplos
    const ejemplos = await prisma.comunicaciones.findMany({
        where: {
            frecuencia: {
                not: null
            }
        },
        take: 5,
        include: {
            aeropuerto: {
                include: {
                    fir: true
                }
            }
        }
    });

    console.log('📻 Ejemplos de equipos con frecuencia:');
    ejemplos.forEach(eq => {
        console.log(`  - ${eq.nombre} | ${eq.frecuencia} MHz | ${eq.canal || 'Sin canal'} | ${eq.aeropuerto.nombre} (${eq.aeropuerto.fir.nombre})`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
