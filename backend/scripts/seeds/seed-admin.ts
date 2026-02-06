
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('Eana2024!', 10);

    const user = await prisma.user.upsert({
        where: { email: 'admin@eana.com.ar' },
        update: {},
        create: {
            email: 'admin@eana.com.ar',
            password: hashedPassword,
            role: 'CNS_NACIONAL',
            passwordChanged: true
        }
    });

    console.log('Admin user created:', user.email);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
