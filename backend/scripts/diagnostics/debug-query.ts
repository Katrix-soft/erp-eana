


const prisma = new PrismaClient();

async function main() {
    console.log('Debugging Query Logic...');

    const filterValue = 'MLG';

    const whereClause = {
        aeropuerto: {
            OR: [
                { nombre: filterValue },
                { codigo: filterValue },
            ]
        }
    };

    console.log('Where Clause:', JSON.stringify(whereClause, null, 2));

    try {
        const coms = await prisma.comunicaciones.findMany({
            where: whereClause,
            include: {
                aeropuerto: {
                    include: { fir: true }
                }
            }
        });

        console.log(`Found ${coms.length} records matching filter "${filterValue}"`);
        if (coms.length > 0) {
            console.log('Sample:', coms[0].nombre, coms[0].aeropuerto.nombre);
        } else {
            console.log('No records found with OR logic.');

            // Try exact match on code
            const exactCode = await prisma.comunicaciones.findMany({
                where: { aeropuerto: { codigo: filterValue } }
            });
            console.log(`Found ${exactCode.length} records with exact CODE match.`);

            // Try exact match on name
            const exactName = await prisma.comunicaciones.findMany({
                where: { aeropuerto: { nombre: filterValue } }
            });
            console.log(`Found ${exactName.length} records with exact NAME match.`);
        }

    } catch (error) {
        console.error('Error executing query:', error);
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
