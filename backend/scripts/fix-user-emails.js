const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixUserEmails() {
    try {
        console.log('🔧 Corrigiendo emails de usuarios...\n');

        // Obtener todos los usuarios
        const users = await prisma.user.findMany();

        console.log(`📄 Total de usuarios: ${users.length}\n`);

        let updated = 0;
        let skipped = 0;
        let errors = 0;

        for (const user of users) {
            try {
                // Si el email no tiene @, agregarlo
                if (!user.email.includes('@')) {
                    const newEmail = `${user.email}@eana.com.ar`;

                    // Verificar si ya existe un usuario con ese email
                    const existing = await prisma.user.findUnique({
                        where: { email: newEmail }
                    });

                    if (existing) {
                        console.log(`⚠️  ${user.email} → ${newEmail} (ya existe, eliminando duplicado)`);
                        // Eliminar el usuario sin @
                        await prisma.user.delete({
                            where: { id: user.id }
                        });
                        skipped++;
                    } else {
                        await prisma.user.update({
                            where: { id: user.id },
                            data: { email: newEmail }
                        });

                        console.log(`✅ ${user.email} → ${newEmail}`);
                        updated++;
                    }
                } else {
                    skipped++;
                }
            } catch (error) {
                console.error(`❌ Error con ${user.email}:`, error.message);
                errors++;
            }
        }

        console.log(`\n📊 Resumen:`);
        console.log(`   ✅ Actualizados: ${updated}`);
        console.log(`   ⚠️  Omitidos/Duplicados: ${skipped}`);
        console.log(`   ❌ Errores: ${errors}`);
        console.log(`   📄 Total: ${users.length}`);

        console.log('\n✅ Corrección completada!');
        console.log('\n🔐 Ahora puedes hacer login con:');
        console.log('   Email: ppayero@eana.com.ar');
        console.log('   Contraseña: Eana2025');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixUserEmails();
