


const prisma = new PrismaClient();

async function main() {
    const airports = await prisma.aeropuerto.findMany({
        where: { fir: { nombre: { contains: 'DOZ', mode: 'insensitive' } } },
        include: { fir: true }
    });

    console.log('Airports in FIR DOZ:');
    airports.forEach(a => console.log(`ID: ${a.id}, Nombre: ${a.nombre}, Codigo: ${a.codigo}, FIR: ${a.fir.nombre}`));

    const vigilancia = await prisma.vigilancia.findMany({
        where: { fir: 'DOZ' }
    });

    console.log('\nVigilancia records in DOZ:');
    vigilancia.forEach(v => console.log(`ID: ${v.id}, Ubicacion: ${v.ubicacion}, Siglas: ${v.siglasLocal}, AeroId: ${v.aeropuertoId}`));
}

main().finally(() => prisma.$disconnect());
