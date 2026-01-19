const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
const PASSWORD = 'Eana2025';

async function resetAllPasswords() {
    try {
        console.log('🔐 RESETEANDO TODAS LAS CONTRASEÑAS\n');
        console.log('═══════════════════════════════════════════════════════════════\n');

        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash(PASSWORD, 10);
        console.log(`   Contraseña: ${PASSWORD}`);
        console.log(`   Hash generado correctamente\n`);

        // Obtener todos los usuarios
        const users = await prisma.user.findMany();
        console.log(`   Total usuarios: ${users.length}\n`);

        // Actualizar todos
        let updated = 0;
        for (const user of users) {
            await prisma.user.update({
                where: { id: user.id },
                data: { password: hashedPassword }
            });
            updated++;

            if (updated % 50 === 0) {
                console.log(`   ✅ ${updated}/${users.length}`);
            }
        }

        console.log(`\n   ✅ ${updated} contraseñas actualizadas\n`);

        // Verificar algunos usuarios
        console.log('🔍 VERIFICACIÓN:\n');

        const testEmails = ['admin@eana.com.ar', 'ppayero@eana.com.ar', 'mquatrano@eana.com.ar'];

        for (const email of testEmails) {
            const user = await prisma.user.findUnique({ where: { email } });
            if (user) {
                const isValid = await bcrypt.compare(PASSWORD, user.password);
                console.log(`   ${isValid ? '✅' : '❌'} ${email} - ${isValid ? 'VÁLIDA' : 'INVÁLIDA'}`);
            }
        }

        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('                    ✅ CONTRASEÑAS RESETEADAS');
        console.log('═══════════════════════════════════════════════════════════════\n');
        console.log(`   Contraseña para TODOS: ${PASSWORD}\n`);
        console.log('   Ejemplos de login:\n');
        console.log('   Usuario: admin');
        console.log(`   Contraseña: ${PASSWORD === 'Eana2025' ? 'admin1234' : PASSWORD}\n`);
        console.log('   Usuario: ppayero');
        console.log(`   Contraseña: ${PASSWORD}\n`);
        console.log('   Usuario: mquatrano');
        console.log(`   Contraseña: ${PASSWORD}\n`);
        console.log('═══════════════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetAllPasswords();
