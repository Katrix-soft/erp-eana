


const prisma = new PrismaClient();

async function main() {
    try {
        const email = 'nmaddalena@eana.com.ar';

        const user = await prisma.user.update({
            where: { email },
            data: {
                role: 'CNS_NACIONAL',
            },
            include: {
                personal: true
            }
        });

        console.log(`Usuario actualizado con éxito:`);
        console.log(`ID: ${user.id}`);
        console.log(`Email: ${user.email}`);
        console.log(`Nuevo Rol: ${user.role}`);
        console.log(`Nombre: ${user.personal?.nombre} ${user.personal?.apellido}`);

    } catch (error) {
        console.error('Error al actualizar el usuario:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
