const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupDatabase() {
    try {
        console.log('🧹 Limpiando base de datos...\n');

        // 1. Eliminar FIR "Ezeiza" (sin "FIR" al inicio)
        const firEzeiza = await prisma.fir.findFirst({
            where: { nombre: 'Ezeiza' },
            include: { aeropuertos: true }
        });

        if (firEzeiza) {
            console.log(`📍 Encontrado FIR "Ezeiza" (ID: ${firEzeiza.id})`);
            console.log(`   Aeropuertos asociados: ${firEzeiza.aeropuertos.length}`);

            // Buscar FIR Ezeiza correcto
            const firEzeizaCorrect = await prisma.fir.findFirst({
                where: { nombre: 'FIR Ezeiza' }
            });

            if (firEzeizaCorrect) {
                console.log(`✅ Encontrado "FIR Ezeiza" correcto (ID: ${firEzeizaCorrect.id})`);

                // Mover aeropuertos al FIR correcto
                if (firEzeiza.aeropuertos.length > 0) {
                    console.log('🔄 Moviendo aeropuertos...');
                    for (const aero of firEzeiza.aeropuertos) {
                        await prisma.aeropuerto.update({
                            where: { id: aero.id },
                            data: { firId: firEzeizaCorrect.id }
                        });
                        console.log(`   ✅ ${aero.codigo} - ${aero.nombre}`);
                    }
                }

                // Eliminar FIR "Ezeiza" incorrecto
                await prisma.fir.delete({
                    where: { id: firEzeiza.id }
                });
                console.log('✅ FIR "Ezeiza" eliminado\n');
            }
        } else {
            console.log('ℹ️  No se encontró FIR "Ezeiza" para eliminar\n');
        }

        // 2. Verificar estructura de datos
        console.log('🔍 Verificando estructura de datos...\n');

        const totalEquipos = await prisma.equipo.count();
        const totalVhf = await prisma.vhf.count();
        const totalCanales = await prisma.canal.count();
        const totalFrecuencias = await prisma.frecuencia.count();

        console.log('📊 Totales:');
        console.log(`   Equipos: ${totalEquipos}`);
        console.log(`   VHF Sites: ${totalVhf}`);
        console.log(`   Canales: ${totalCanales}`);
        console.log(`   Frecuencias: ${totalFrecuencias}\n`);

        // 3. Verificar un equipo completo
        const equipoSample = await prisma.equipo.findFirst({
            include: {
                vhf: true,
                canales: {
                    include: {
                        frecuencias: true
                    }
                }
            }
        });

        if (equipoSample) {
            console.log('🔧 Ejemplo de Equipo:');
            console.log(`   ID: ${equipoSample.id}`);
            console.log(`   Marca: ${equipoSample.marca}`);
            console.log(`   Modelo: ${equipoSample.modelo}`);
            console.log(`   Tipo: ${equipoSample.tipoEquipo}`);
            console.log(`   VHF Site: ${equipoSample.vhf?.sitio}`);
            console.log(`   Canales: ${equipoSample.canales?.length || 0}`);
            if (equipoSample.canales?.[0]) {
                console.log(`   Canal: ${equipoSample.canales[0].canal}`);
                console.log(`   Frecuencias: ${equipoSample.canales[0].frecuencias?.length || 0}`);
                if (equipoSample.canales[0].frecuencias?.[0]) {
                    console.log(`   Frecuencia: ${equipoSample.canales[0].frecuencias[0].frecuencia} MHz`);
                }
            }
        }

        // 4. Listar FIRs finales
        console.log('\n📋 FIRs en la base de datos:\n');
        const allFirs = await prisma.fir.findMany({
            include: {
                aeropuertos: true
            },
            orderBy: {
                nombre: 'asc'
            }
        });

        allFirs.forEach(fir => {
            console.log(`🗺️  ${fir.nombre} (${fir.aeropuertos.length} aeropuertos)`);
        });

        console.log('\n✅ Limpieza completada!');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanupDatabase();
