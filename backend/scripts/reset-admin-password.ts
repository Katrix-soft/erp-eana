
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@eana.com.ar';
    const password = 'Admin2024!';

    const hashedPassword = await bcrypt.hash(password, 10);

    // Try to update existing admin
    const existingUser = await prisma.user.findUnique({
        where: { email }
    });

    if (existingUser) {
        await prisma.user.update({
            where: { email },
            data: { password: hashedPassword }
        });
        console.log(`✅ Password updated for ${email}`);
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);
    } else {
        // Create new admin user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role: 'ADMIN'
            }
        });
        console.log(`✅ Admin user created!`);
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
