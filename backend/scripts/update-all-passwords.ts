

import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Actualizando contraseñas de TODOS los usuarios...');

    const newPassword = 'Eana2024!';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await prisma.user.updateMany({
        data: {
            password: hashedPassword
        }
    });

    console.log(`✅ Contraseña actualizada para ${result.count} usuarios.`);
    console.log(`🔑 Nueva contraseña para todos: ${newPassword}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
