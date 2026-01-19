const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUser() {
    try {
        const user = await prisma.user.findUnique({
            where: { email: 'comunicacion@eana.com' },
            include: {
                personal: {
                    include: {
                        aeropuerto: {
                            include: {
                                fir: true
                            }
                        }
                    }
                }
            }
        });

        if (user) {
            console.log('👤 Usuario: comunicacion@eana.com');
            console.log(`   Role: ${user.role}`);
            console.log(`\n📋 Personal:`);
            console.log(`   Nombre: ${user.personal?.nombre} ${user.personal?.apellido}`);
            console.log(`   Sector: ${user.personal?.sector}`);
            console.log(`\n📍 Aeropuerto:`);
            console.log(`   Nombre: ${user.personal?.aeropuerto?.nombre}`);
            console.log(`   Código: ${user.personal?.aeropuerto?.codigo}`);
            console.log(`\n🗺️  FIR:`);
            console.log(`   Nombre: ${user.personal?.aeropuerto?.fir?.nombre}`);

            // Buscar equipos para este aeropuerto
            if (user.personal?.aeropuerto?.codigo) {
                const equipos = await prisma.equipo.findMany({
                    where: {
                        vhf: {
                            aeropuerto: user.personal.aeropuerto.codigo
                        }
                    },
                    include: {
                        canales: {
                            include: {
                                frecuencias: true
                            }
                        }
                    },
                    take: 5
                });

                console.log(`\n📡 Equipos para aeropuerto ${user.personal.aeropuerto.codigo}:`);
                console.log(`   Total: ${equipos.length}`);
                equipos.forEach((eq, i) => {
                    const freq = eq.canales?.[0]?.frecuencias?.[0]?.frecuencia || 0;
                    console.log(`   ${i + 1}. ${eq.marca} ${eq.modelo} - ${freq} MHz`);
                });
            }
        } else {
            console.log('❌ Usuario no encontrado');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUser();
