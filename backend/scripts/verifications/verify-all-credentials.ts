
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function verifyAllUsers() {
    try {
        console.log('🔐 VERIFICACIÓN DE TODAS LAS CREDENCIALES\n');
        console.log('='.repeat(80));

        const testUsers = [
            { email: 'tecnico@eana.com', password: 'tecnico1234', expectedSector: 'CNSE' },
            { email: 'comunicacion@eana.com', password: 'comunicacion1234', expectedSector: 'COMUNICACIONES' },
            { email: 'navegacion@eana.com', password: 'navegacion1234', expectedSector: 'NAVEGACION' },
            { email: 'energia@eana.com', password: 'energia1234', expectedSector: 'ENERGIA' },
            { email: 'vigilancia@eana.com', password: 'vigilancia1234', expectedSector: 'VIGILANCIA' },
            { email: 'cnse@eana.com', password: 'cnse1234', expectedSector: 'CNSE' }
        ];

        let allValid = true;

        for (const testUser of testUsers) {
            const user = await prisma.user.findUnique({
                where: { email: testUser.email },
                include: {
                    personal: {
                        include: {
                            aeropuerto: true
                        }
                    }
                }
            });

            if (!user) {
                console.log(`\n❌ ${testUser.email}`);
                console.log(`   ERROR: Usuario no existe en la base de datos`);
                allValid = false;
                continue;
            }

            const passwordValid = await bcrypt.compare(testUser.password, user.password);
            const sectorMatch = user.personal?.sector === testUser.expectedSector;

            console.log(`\n${passwordValid && sectorMatch ? '✅' : '❌'} ${testUser.email}`);
            console.log(`   Password: ${passwordValid ? '✅ VÁLIDA' : '❌ INVÁLIDA'}`);
            console.log(`   Sector esperado: ${testUser.expectedSector}`);
            console.log(`   Sector actual: ${user.personal?.sector || 'Sin asignar'} ${sectorMatch ? '✅' : '❌'}`);
            console.log(`   Rol: ${user.role}`);
            console.log(`   Aeropuerto: ${user.personal?.aeropuerto?.nombre || 'Sin asignar'}`);

            if (!passwordValid || !sectorMatch) {
                allValid = false;
            }
        }

        console.log('\n' + '='.repeat(80));

        if (allValid) {
            console.log('\n✅ TODAS LAS CREDENCIALES SON VÁLIDAS\n');
            console.log('📋 CREDENCIALES PARA COPIAR Y PEGAR:\n');
            console.log('CNSE:');
            console.log('  Email: tecnico@eana.com');
            console.log('  Password: tecnico1234\n');
            console.log('COMUNICACIONES:');
            console.log('  Email: comunicacion@eana.com');
            console.log('  Password: comunicacion1234\n');
            console.log('NAVEGACION:');
            console.log('  Email: navegacion@eana.com');
            console.log('  Password: navegacion1234\n');
            console.log('ENERGIA:');
            console.log('  Email: energia@eana.com');
            console.log('  Password: energia1234\n');
            console.log('VIGILANCIA:');
            console.log('  Email: vigilancia@eana.com');
            console.log('  Password: vigilancia1234\n');
        } else {
            console.log('\n❌ ALGUNAS CREDENCIALES TIENEN PROBLEMAS\n');
            console.log('Ejecuta el script de corrección:');
            console.log('  npx ts-node scripts/fix-all-passwords.ts\n');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyAllUsers();
