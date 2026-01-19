


const prisma = new PrismaClient();

async function main() {
    try {
        const searchTerm = 'maddalena'; // Case insensitive search usually better done with checking both fields or using contains with mode insensitive if supported, but here we can try broad search.

        // Search in User (email) and Personal (nombre/apellido)
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { email: { contains: 'maddalena', mode: 'insensitive' } },
                    { email: { contains: 'nicolas', mode: 'insensitive' } },
                    {
                        personal: {
                            OR: [
                                { nombre: { contains: 'nicolas', mode: 'insensitive' } },
                                { apellido: { contains: 'maddalena', mode: 'insensitive' } },
                            ]
                        }
                    }
                ]
            },
            include: {
                personal: {
                    include: {
                        puesto: true,
                        aeropuerto: true,
                        fir: true
                    }
                }
            }
        });

        console.log(`Buscando usuarios con "nicolas" o "maddalena"... Encontrados: ${users.length}`);

        for (const user of users) {
            console.log('-------------------------------------------------------');
            console.log(`ID: ${user.id}`);
            console.log(`Email: ${user.email}`);
            console.log(`Rol: ${user.role}`);
            if (user.personal) {
                console.log(`Nombre: ${user.personal.nombre} ${user.personal.apellido}`);
                console.log(`Puesto: ${user.personal.puesto?.nombre || 'SIN PUESTO'}`);
                console.log(`Sector: ${user.personal.sector || 'N/A'}`);
                console.log(`Aeropuerto: ${user.personal.aeropuerto?.nombre || 'N/A'}`);
                console.log(`FIR: ${user.personal.fir?.nombre || 'N/A'}`);
            } else {
                console.log('Datos Personales: NO ASIGNADO');
            }
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
