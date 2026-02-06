
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function updateUsers() {
    try {
        console.log('🔄 Actualizando usuarios...\n');

        // 1. Cambiar tecnico@eana.com a CNSE
        const tecnicoUser = await prisma.user.findUnique({
            where: { email: 'tecnico@eana.com' },
            include: { personal: true }
        });

        if (tecnicoUser && tecnicoUser.personal) {
            await prisma.personal.update({
                where: { id: tecnicoUser.personal.id },
                data: {
                    sector: 'CNSE',
                    nombre: 'Juan',
                    apellido: 'CNSE'
                }
            });
            console.log('✅ tecnico@eana.com actualizado a sector CNSE');
        }

        // 2. Crear/actualizar comunicacion@eana.com para COMUNICACIONES
        const hashedPassword = await bcrypt.hash('comunicacion1234', 10);

        const existingComUser = await prisma.user.findUnique({
            where: { email: 'comunicacion@eana.com' },
            include: { personal: true }
        });

        const aeropuerto = await prisma.aeropuerto.findFirst();
        const puesto = await prisma.puestoPersonal.findFirst();

        if (existingComUser) {
            // Actualizar usuario existente
            await prisma.user.update({
                where: { email: 'comunicacion@eana.com' },
                data: {
                    password: hashedPassword,
                    role: 'TECNICO'
                },
                include: { personal: true }
            });

            const updatedUser = await prisma.user.findUnique({
                where: { email: 'comunicacion@eana.com' },
                include: { personal: true }
            });

            if (updatedUser?.personal) {
                await prisma.personal.update({
                    where: { id: updatedUser.personal.id },
                    data: {
                        sector: 'COMUNICACIONES',
                        nombre: 'María',
                        apellido: 'Comunicaciones'
                    }
                });
            } else if (aeropuerto && puesto) {
                await prisma.personal.create({
                    data: {
                        nombre: 'María',
                        apellido: 'Comunicaciones',
                        sector: 'COMUNICACIONES',
                        puestoId: puesto.id,
                        aeropuertoId: aeropuerto.id,
                        userId: existingComUser.id
                    }
                });
            }
            console.log('✅ comunicacion@eana.com actualizado');
        } else {
            // Crear nuevo usuario
            const newUser = await prisma.user.create({
                data: {
                    email: 'comunicacion@eana.com',
                    password: hashedPassword,
                    role: 'TECNICO'
                }
            });

            if (aeropuerto && puesto) {
                await prisma.personal.create({
                    data: {
                        nombre: 'María',
                        apellido: 'Comunicaciones',
                        sector: 'COMUNICACIONES',
                        puestoId: puesto.id,
                        aeropuertoId: aeropuerto.id,
                        userId: newUser.id
                    }
                });
            }
            console.log('✅ comunicacion@eana.com creado');
        }

        // Verificar ambos usuarios
        console.log('\n🔐 Verificación de credenciales:\n');

        const users = [
            { email: 'tecnico@eana.com', password: 'tecnico1234', expectedSector: 'CNSE' },
            { email: 'comunicacion@eana.com', password: 'comunicacion1234', expectedSector: 'COMUNICACIONES' }
        ];

        for (const userData of users) {
            const user = await prisma.user.findUnique({
                where: { email: userData.email },
                include: {
                    personal: {
                        include: {
                            aeropuerto: true
                        }
                    }
                }
            });

            if (user) {
                const isValid = await bcrypt.compare(userData.password, user.password);
                const sectorMatch = user.personal?.sector === userData.expectedSector;

                console.log(`📧 ${userData.email}`);
                console.log(`   Password: ${isValid ? '✅' : '❌'}`);
                console.log(`   Sector: ${user.personal?.sector || 'Sin asignar'} ${sectorMatch ? '✅' : '❌'}`);
                console.log(`   Aeropuerto: ${user.personal?.aeropuerto?.nombre || 'Sin asignar'}\n`);
            }
        }

        console.log('\n📋 RESUMEN DE CREDENCIALES ACTUALIZADAS:\n');
        console.log('┌─────────────────────────────┬──────────────────────┬────────────────┐');
        console.log('│ Email                       │ Password             │ Sector         │');
        console.log('├─────────────────────────────┼──────────────────────┼────────────────┤');
        console.log('│ tecnico@eana.com            │ tecnico1234          │ CNSE           │');
        console.log('│ comunicacion@eana.com       │ comunicacion1234     │ COMUNICACIONES │');
        console.log('└─────────────────────────────┴──────────────────────┴────────────────┘');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updateUsers();
