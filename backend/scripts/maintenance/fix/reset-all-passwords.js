const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const NEW_PASSWORD = 'Eana2025';

async function resetAllPasswords() {
    try {
        console.log('🔄 Reseteando TODAS las contraseñas...\n');
        console.log(`🔐 Nueva contraseña: ${NEW_PASSWORD}\n`);

        // Hash de la nueva contraseña
        const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);

        // Obtener todos los usuarios
        const users = await prisma.user.findMany();

        console.log(`📄 Total de usuarios: ${users.length}\n`);
        console.log('Actualizando...\n');

        let updated = 0;

        for (const user of users) {
            await prisma.user.update({
                where: { id: user.id },
                data: { password: hashedPassword }
            });
            updated++;

            if (updated % 50 === 0) {
                console.log(`   Procesados: ${updated}/${users.length}`);
            }
        }

        console.log(`\n✅ ${updated} contraseñas actualizadas!\n`);
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('                  TODAS LAS CONTRASEÑAS RESETEADAS');
        console.log('═══════════════════════════════════════════════════════════════\n');
        console.log(`   Nueva contraseña para TODOS: ${NEW_PASSWORD}\n`);
        console.log('Ejemplos de login:\n');
        console.log('   Usuario: admin@eana.com.ar');
        console.log(`   Contraseña: ${NEW_PASSWORD}\n`);
        console.log('   Usuario: ppayero@eana.com.ar');
        console.log(`   Contraseña: ${NEW_PASSWORD}\n`);
        console.log('   Usuario: comunicacion@eana.com.ar');
        console.log(`   Contraseña: ${NEW_PASSWORD}\n`);
        console.log('═══════════════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetAllPasswords();
