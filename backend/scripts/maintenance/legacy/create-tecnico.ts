
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createTecnicoUser() {
    try {
        // Verificar si el usuario ya existe
        const existingUser = await prisma.user.findUnique({
            where: { email: 'tecnico@eana.com' }
        });

        const hashedPassword = await bcrypt.hash('tecnico1234', 10);

        if (existingUser) {
            // Actualizar la contraseña
            const updatedUser = await prisma.user.update({
                where: { email: 'tecnico@eana.com' },
                data: {
                    password: hashedPassword,
                    role: 'TECNICO'
                },
                include: {
                    personal: {
                        include: {
                            aeropuerto: true,
                            puesto: true
                        }
                    }
                }
            });
            console.log('✅ Usuario actualizado:', {
                email: updatedUser.email,
                role: updatedUser.role,
                personal: updatedUser.personal ? {
                    nombre: updatedUser.personal.nombre,
                    sector: updatedUser.personal.sector,
                    aeropuerto: updatedUser.personal.aeropuerto?.nombre
                } : 'Sin personal asignado'
            });
        } else {
            // Crear nuevo usuario
            const newUser = await prisma.user.create({
                data: {
                    email: 'tecnico@eana.com',
                    password: hashedPassword,
                    role: 'TECNICO'
                }
            });
            console.log('✅ Usuario creado:', {
                email: newUser.email,
                role: newUser.role
            });
            console.log('⚠️  NOTA: Este usuario no tiene Personal asignado. Debes asignarlo manualmente.');
        }

        // Verificar login
        const user = await prisma.user.findUnique({
            where: { email: 'tecnico@eana.com' }
        });

        if (user) {
            const isValid = await bcrypt.compare('tecnico1234', user.password);
            console.log('\n🔐 Verificación de contraseña:', isValid ? '✅ CORRECTA' : '❌ INCORRECTA');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createTecnicoUser();
