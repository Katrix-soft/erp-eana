


const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst({
        where: { email: { contains: 'alfredo', mode: 'insensitive' } },
        include: {
            personal: {
                include: {
                    aeropuerto: true,
                    fir: true
                }
            }
        }
    });

    if (!user) {
        console.log('User not found');
        return;
    }

    console.log('User info:');
    console.dir(user, { depth: null });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
