
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdmin() {
    try {
        console.log('🔧 Creando usuario ADMIN...\n');

        const email = 'admin@eana.com';
        const password = 'admin1234';
        const hashedPassword = await bcrypt.hash(password, 10);

        // Buscar si existe
        const existingUser = await prisma.user.findUnique({
            where: { email },
            include: { personal: true }
        });

        if (existingUser) {
            // Actualizar password
            await prisma.user.update({
                where: { email },
                data: {
                    password: hashedPassword,
                    role: 'ADMIN'
                }
            });
            console.log('✅ Usuario admin actualizado');
        } else {
            // Crear nuevo
            const user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    role: 'ADMIN'
                }
            });

            // Buscar aeropuerto y puesto
            const aeropuerto = await prisma.aeropuerto.findFirst();
            const puesto = await prisma.puestoPersonal.findFirst();

            if (aeropuerto && puesto) {
                await prisma.personal.create({
                    data: {
                        nombre: 'Admin',
                        apellido: 'Sistema',
                        sector: 'CNSE',
                        puestoId: puesto.id,
                        aeropuertoId: aeropuerto.id,
                        userId: user.id
                    }
                });
            }
            console.log('✅ Usuario admin creado');
        }

        // Verificar credenciales
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (user) {
            const isValid = await bcrypt.compare(password, user.password);
            console.log(`\n🔐 Verificación de credenciales:`);
            console.log(`   Email: ${email}`);
            console.log(`   Password: ${password}`);
            console.log(`   Válida: ${isValid ? '✅ SÍ' : '❌ NO'}`);
            console.log(`   Rol: ${user.role}`);
        }

        console.log('\n📋 CREDENCIALES DE ADMIN:');
        console.log('┌─────────────────────────┬──────────────┐');
        console.log('│ Email                   │ Password     │');
        console.log('├─────────────────────────┼──────────────┤');
        console.log('│ admin@eana.com          │ admin1234    │');
        console.log('└─────────────────────────┴──────────────┘');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
