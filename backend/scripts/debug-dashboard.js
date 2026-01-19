
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStats() {
    console.log('Checking Dashboard Stats...');

    const aeropuertos = await prisma.aeropuerto.findMany({
        include: { fir: true }
    });

    console.log(`Found ${aeropuertos.length} airports.`);

    // Sample a few
    if (aeropuertos.length > 0) {
        console.log('Sample Airport 1:', JSON.stringify(aeropuertos[0], null, 2));
    }

    const mendozaAirports = aeropuertos.filter(a => a.fir && a.fir.nombre.toLowerCase().includes('mendoza'));
    console.log(`Airports in Mendoza FIR: ${mendozaAirports.length}`);
    if (mendozaAirports.length > 0) {
        console.log('Sample Mendoza Airport:', mendozaAirports[0].nombre);
    } else {
        console.log('WARNING: No airports found for Mendoza FIR!');
        // List all FIR names found
        const firNames = [...new Set(aeropuertos.map(a => a.fir ? a.fir.nombre : 'None'))];
        console.log('Available FIRs:', firNames);
    }

    const stats = await prisma.comunicaciones.groupBy({ by: ['aeropuertoId', 'estado'], _count: { id: true } });
    console.log(`Total grouped stats records: ${stats.length}`);
}

checkStats()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
