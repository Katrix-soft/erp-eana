
const prisma = new PrismaClient();

async function main() {
    try {
        const counts = {
            users: await prisma.user.count(),
            aeropuertos: await prisma.aeropuerto.count(),
            equipos: await prisma.equipo.count(),
            workOrders: await prisma.workOrder.count(),
            auditLogs: await prisma.auditLog.count(),
        };
        console.log(JSON.stringify(counts, null, 2));

        if (counts.users > 0) {
            const firstUser = await prisma.user.findFirst({ select: { email: true, role: true } });
            console.log('Sample User:', firstUser);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
