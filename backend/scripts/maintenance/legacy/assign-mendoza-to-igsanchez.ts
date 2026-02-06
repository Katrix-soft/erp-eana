import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Buscar aeropuertos de Mendoza
    const aeropuertos = await prisma.aeropuerto.findMany({
        where: {
            OR: [
                { nombre: { contains: 'Mendoza', mode: 'insensitive' } },
                { fir: { nombre: { contains: 'Mendoza', mode: 'insensitive' } } }
            ]
        },
        include: {
            fir: true
        }
    });

    console.log('📍 Aeropuertos de Mendoza:');
    aeropuertos.forEach(a => {
        console.log(`  - ID: ${a.id}, Nombre: ${a.nombre}, FIR: ${a.fir.nombre}, Código: ${a.codigo}`);
    });

    if (aeropuertos.length > 0) {
        const mendozaAeropuerto = aeropuertos[0];

        // Actualizar usuario igsanchez
        const personal = await prisma.personal.findFirst({
            where: {
                user: {
                    email: 'igsanchez@eana.com.ar'
                }
            }
        });

        if (personal) {
            await prisma.personal.update({
                where: { id: personal.id },
                data: {
                    aeropuertoId: mendozaAeropuerto.id,
                    firId: mendozaAeropuerto.firId
                }
            });
            console.log(`\n✅ Usuario igsanchez actualizado con aeropuerto: ${mendozaAeropuerto.nombre}`);
        } else {
            console.log('\n❌ No se encontró el registro de personal para igsanchez');
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
