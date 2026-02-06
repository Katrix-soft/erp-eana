
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createSectorUsers() {
    try {
        const users = [
            {
                email: 'navegacion@eana.com',
                password: 'navegacion1234',
                role: 'TECNICO',
                sector: 'NAVEGACION',
                nombre: 'Carlos',
                apellido: 'Navegante'
            },
            {
                email: 'energia@eana.com',
                password: 'energia1234',
                role: 'TECNICO',
                sector: 'ENERGIA',
                nombre: 'María',
                apellido: 'Energética'
            },
            {
                email: 'vigilancia@eana.com',
                password: 'vigilancia1234',
                role: 'TECNICO',
                sector: 'VIGILANCIA',
                nombre: 'Pedro',
                apellido: 'Vigilante'
            },
            {
                email: 'cnse@eana.com',
                password: 'cnse1234',
                role: 'TECNICO',
                sector: 'CNSE',
                nombre: 'Ana',
                apellido: 'CNSE'
            }
        ];

        console.log('🚀 Creando usuarios técnicos por sector...\n');

        // Buscar un aeropuerto y puesto existente
        const aeropuerto = await prisma.aeropuerto.findFirst();
        const puesto = await prisma.puestoPersonal.findFirst();

        if (!aeropuerto) {
            console.log('⚠️  No hay aeropuertos en la base de datos. Los usuarios se crearán sin aeropuerto asignado.');
        }

        if (!puesto) {
            console.log('⚠️  No hay puestos en la base de datos. Los usuarios se crearán sin puesto asignado.');
        }

        for (const userData of users) {
            const hashedPassword = await bcrypt.hash(userData.password, 10);

            // Verificar si el usuario ya existe
            const existingUser = await prisma.user.findUnique({
                where: { email: userData.email }
            });

            if (existingUser) {
                // Actualizar usuario existente
                const updatedUser = await prisma.user.update({
                    where: { email: userData.email },
                    data: {
                        password: hashedPassword,
                        role: userData.role as any
                    },
                    include: {
                        personal: true
                    }
                });

                // Si no tiene personal, crearlo
                if (!updatedUser.personal && aeropuerto && puesto) {
                    await prisma.personal.create({
                        data: {
                            nombre: userData.nombre,
                            apellido: userData.apellido,
                            sector: userData.sector as any,
                            puestoId: puesto.id,
                            aeropuertoId: aeropuerto.id,
                            userId: updatedUser.id
                        }
                    });
                    console.log(`✅ Usuario actualizado y personal creado: ${userData.email}`);
                } else if (updatedUser.personal) {
                    // Actualizar el sector del personal existente
                    await prisma.personal.update({
                        where: { id: updatedUser.personal.id },
                        data: {
                            sector: userData.sector as any,
                            nombre: userData.nombre,
                            apellido: userData.apellido
                        }
                    });
                    console.log(`✅ Usuario y personal actualizados: ${userData.email}`);
                } else {
                    console.log(`✅ Usuario actualizado: ${userData.email} (sin personal)`);
                }
            } else {
                // Crear nuevo usuario
                const newUser = await prisma.user.create({
                    data: {
                        email: userData.email,
                        password: hashedPassword,
                        role: userData.role as any
                    }
                });

                // Crear personal si hay aeropuerto y puesto
                if (aeropuerto && puesto) {
                    await prisma.personal.create({
                        data: {
                            nombre: userData.nombre,
                            apellido: userData.apellido,
                            sector: userData.sector as any,
                            puestoId: puesto.id,
                            aeropuertoId: aeropuerto.id,
                            userId: newUser.id
                        }
                    });
                    console.log(`✅ Usuario y personal creados: ${userData.email}`);
                } else {
                    console.log(`✅ Usuario creado: ${userData.email} (sin personal)`);
                }
            }

            // Verificar login
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
                console.log(`   🔐 Password: ${isValid ? '✅' : '❌'} | Sector: ${user.personal?.sector || 'Sin asignar'} | Aeropuerto: ${user.personal?.aeropuerto?.nombre || 'Sin asignar'}\n`);
            }
        }

        console.log('\n📋 RESUMEN DE CREDENCIALES:\n');
        console.log('┌─────────────────────────────┬──────────────────────┬────────────────┐');
        console.log('│ Email                       │ Password             │ Sector         │');
        console.log('├─────────────────────────────┼──────────────────────┼────────────────┤');
        console.log('│ navegacion@eana.com         │ navegacion1234       │ NAVEGACION     │');
        console.log('│ energia@eana.com            │ energia1234          │ ENERGIA        │');
        console.log('│ vigilancia@eana.com         │ vigilancia1234       │ VIGILANCIA     │');
        console.log('│ cnse@eana.com               │ cnse1234             │ CNSE           │');
        console.log('└─────────────────────────────┴──────────────────────┴────────────────┘');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createSectorUsers();
