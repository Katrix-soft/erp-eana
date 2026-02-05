

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Verificando equipos de Mendoza...\n');

    // Buscar aeropuerto de Mendoza
    const mendoza = await prisma.aeropuerto.findFirst({
        where: {
            nombre: { contains: 'Mendoza', mode: 'insensitive' }
        },
        include: {
            fir: true
        }
    });

    if (!mendoza) {
        console.log('❌ No se encontró aeropuerto de Mendoza');
        return;
    }

    console.log(`📍 Aeropuerto: ${mendoza.nombre} (ID: ${mendoza.id})`);
    console.log(`🌍 FIR: ${mendoza.fir.nombre}`);
    console.log(`📋 Código: ${mendoza.codigo}\n`);

    // Contar equipos de comunicaciones
    const count = await prisma.comunicaciones.count({
        where: {
            aeropuertoId: mendoza.id
        }
    });

    console.log(`📊 Total equipos de COMUNICACIONES en Mendoza: ${count}\n`);

    // Obtener primeros 5 equipos
    const equipos = await prisma.comunicaciones.findMany({
        where: {
            aeropuertoId: mendoza.id
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

    console.log('🔧 Primeros 5 equipos:');
    equipos.forEach(eq => {
        console.log(`  - ${eq.nombre} (${eq.marca} ${eq.modelo}) - S/N: ${eq.numeroSerie}`);
    });

    // Verificar usuario igsanchez
    console.log('\n👤 Verificando usuario igsanchez...');
    const personal = await prisma.personal.findFirst({
        where: {
            user: {
                email: 'igsanchez@eana.com.ar'
            }
        },
        include: {
            aeropuerto: {
                include: {
                    fir: true
                }
            },
            fir: true,
            user: true
        }
    });

    if (personal) {
        console.log(`  ✅ Nombre: ${personal.nombre} ${personal.apellido}`);
        console.log(`  ✅ Sector: ${personal.sector}`);
        console.log(`  ✅ Aeropuerto: ${personal.aeropuerto?.nombre || 'NO ASIGNADO'}`);
        console.log(`  ✅ FIR: ${personal.fir?.nombre || personal.aeropuerto?.fir?.nombre || 'NO ASIGNADO'}`);
    } else {
        console.log('  ❌ No se encontró personal');
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
