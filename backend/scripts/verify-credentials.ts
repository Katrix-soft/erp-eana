

import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function diagnose() {
    const testEmail = 'admin@eana.com';
    const testPass = 'admin1234';

    console.log(`--- Diagnostic for ${testEmail} ---`);
    const user = await prisma.user.findUnique({
        where: { email: testEmail }
    });

    if (!user) {
        console.log('User NOT found');
    } else {
        console.log('User found:', user.email);
        console.log('Role:', user.role);
        const match = await bcrypt.compare(testPass, user.password);
        console.log('Password match:', match);
    }

    const technicalEmail = 'aaltafini@eana.com.ar';
    const technicalPass = 'Eana2025';
    console.log(`\n--- Diagnostic for ${technicalEmail} ---`);
    const techUser = await prisma.user.findUnique({
        where: { email: technicalEmail }
    });

    if (!techUser) {
        console.log('User NOT found');
    } else {
        console.log('User found:', techUser.email);
        console.log('Role:', techUser.role);
        const match = await bcrypt.compare(technicalPass, techUser.password);
        console.log('Password match:', match);
    }

    await prisma.$disconnect();
}

diagnose();
