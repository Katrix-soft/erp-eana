const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function fixComunicacionUser() {
    try {
        console.log('🔧 Configurando usuario comunicacion@eana.com...\n');

        // 1. Buscar o crear FIR Ezeiza
        let fir = await prisma.fir.findFirst({
            where: { nombre: 'FIR Ezeiza' }
        });

        if (!fir) {
            fir = await prisma.fir.create({
                data: { nombre: 'FIR Ezeiza' }
            });
            console.log('✅ FIR Ezeiza creado');
        }

        // 2. Buscar o crear Aeropuerto Ezeiza
        let aeropuerto = await prisma.aeropuerto.findFirst({
            where: { codigo: 'EZE' }
        });

        if (!aeropuerto) {
            aeropuerto = await prisma.aeropuerto.create({
                data: {
                    codigo: 'EZE',
                    nombre: 'Aeropuerto Internacional Ezeiza',
                    firId: fir.id
                }
            });
            console.log('✅ Aeropuerto Ezeiza creado');
        }

        // 3. Buscar o crear Puesto
        let puesto = await prisma.puestoPersonal.findFirst({
            where: { nombre: 'Técnico' }
        });

        if (!puesto) {
            puesto = await prisma.puestoPersonal.create({
                data: { nombre: 'Técnico' }
            });
            console.log('✅ Puesto Técnico creado');
        }

        // 4. Buscar o crear usuario
        const hashedPassword = await bcrypt.hash('comunicacion1234', 10);

        let user = await prisma.user.findUnique({
            where: { email: 'comunicacion@eana.com' },
            include: { personal: true }
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: 'comunicacion@eana.com',
                    password: hashedPassword,
                    role: 'TECNICO'
                }
            });
            console.log('✅ Usuario creado');
        } else {
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    password: hashedPassword,
                    role: 'TECNICO'
                }
            });
            console.log('✅ Usuario actualizado');
        }

        // 5. Crear o actualizar personal
        if (user.personal) {
            await prisma.personal.update({
                where: { id: user.personal.id },
                data: {
                    nombre: 'María',
                    apellido: 'Comunicaciones',
                    sector: 'COMUNICACIONES',
                    puestoId: puesto.id,
                    aeropuertoId: aeropuerto.id
                }
            });
            console.log('✅ Personal actualizado');
        } else {
            await prisma.personal.create({
                data: {
                    nombre: 'María',
                    apellido: 'Comunicaciones',
                    sector: 'COMUNICACIONES',
                    puestoId: puesto.id,
                    aeropuertoId: aeropuerto.id,
                    userId: user.id
                }
            });
            console.log('✅ Personal creado');
        }

        // 6. Verificar equipos disponibles
        const equipos = await prisma.equipo.findMany({
            where: {
                vhf: {
                    aeropuerto: 'EZE'
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

        console.log(`\n📡 Equipos disponibles para EZE: ${equipos.length}`);
        equipos.forEach((eq, i) => {
            const freq = eq.canales?.[0]?.frecuencias?.[0]?.frecuencia || 0;
            console.log(`   ${i + 1}. ${eq.marca} ${eq.modelo} - ${freq} MHz`);
        });

        console.log('\n✅ Usuario comunicacion@eana.com configurado correctamente!');
        console.log('\n📋 CREDENCIALES:');
        console.log('   Email: comunicacion@eana.com');
        console.log('   Password: comunicacion1234');
        console.log('   Aeropuerto: Aeropuerto Internacional Ezeiza (EZE)');
        console.log('   FIR: FIR Ezeiza');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixComunicacionUser();
