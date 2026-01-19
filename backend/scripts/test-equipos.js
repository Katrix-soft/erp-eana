const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testEquipos() {
    try {
        console.log('🔍 Verificando estructura de datos...\n');

        // 1. Contar registros
        const totalEquipos = await prisma.equipo.count();
        const totalCanales = await prisma.canal.count();
        const totalFrecuencias = await prisma.frecuencia.count();

        console.log('📊 Totales:');
        console.log(`   Equipos: ${totalEquipos}`);
        console.log(`   Canales: ${totalCanales}`);
        console.log(`   Frecuencias: ${totalFrecuencias}\n`);

        // 2. Obtener un equipo con todas sus relaciones
        const equipo = await prisma.equipo.findFirst({
            include: {
                canales: {
                    include: {
                        frecuencias: true
                    }
                },
                vhf: true
            }
        });

        if (equipo) {
            console.log('🔧 Primer Equipo:');
            console.log(`   ID: ${equipo.id}`);
            console.log(`   Marca: ${equipo.marca}`);
            console.log(`   Modelo: ${equipo.modelo}`);
            console.log(`   Número Serie: ${equipo.numeroSerie}`);
            console.log(`   Tipo: ${equipo.tipoEquipo}\n`);

            console.log('📍 VHF/Sitio:');
            console.log(`   FIR: ${equipo.vhf?.fir}`);
            console.log(`   Aeropuerto: ${equipo.vhf?.aeropuerto}`);
            console.log(`   Sitio: ${equipo.vhf?.sitio}\n`);

            console.log(`📻 Canales (${equipo.canales?.length || 0}):`);
            equipo.canales?.forEach((canal, i) => {
                console.log(`   ${i + 1}. Canal: ${canal.canal} (Tipo: ${canal.tipo})`);
                console.log(`      Frecuencias: ${canal.frecuencias?.length || 0}`);
                canal.frecuencias?.forEach((freq, j) => {
                    console.log(`         ${j + 1}. ${freq.frecuencia} MHz`);
                });
            });

            console.log('\n✅ Estructura de datos correcta!');
        } else {
            console.log('❌ No se encontraron equipos');
        }

        // 3. Test con filtro por FIR
        console.log('\n🔍 Test con filtro FIR="EZE":');
        const equiposEze = await prisma.equipo.findMany({
            where: {
                vhf: {
                    fir: 'EZE'
                }
            },
            include: {
                canales: {
                    include: {
                        frecuencias: true
                    }
                },
                vhf: true
            },
            take: 3
        });

        console.log(`   Encontrados: ${equiposEze.length} equipos`);
        equiposEze.forEach((eq, i) => {
            console.log(`   ${i + 1}. ${eq.marca} ${eq.modelo} - ${eq.canales?.length || 0} canales`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testEquipos();
