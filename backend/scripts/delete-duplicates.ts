

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Buscando y eliminando equipos duplicados...\n');

    // Obtener todos los equipos
    const equipos = await prisma.comunicaciones.findMany({
        orderBy: [
            { numeroSerie: 'asc' },
            { id: 'asc' }
        ]
    });

    console.log(`📊 Total de equipos: ${equipos.length}\n`);

    // Agrupar por número de serie
    const gruposPorSerie = new Map<string, typeof equipos>();

    equipos.forEach(equipo => {
        const serie = equipo.numeroSerie || 'SIN_SERIE';
        if (!gruposPorSerie.has(serie)) {
            gruposPorSerie.set(serie, []);
        }
        gruposPorSerie.get(serie)!.push(equipo);
    });

    // Identificar duplicados
    let totalDuplicados = 0;
    let eliminados = 0;

    for (const [serie, grupo] of gruposPorSerie.entries()) {
        if (grupo.length > 1) {
            totalDuplicados += grupo.length - 1;
            console.log(`🔄 Serie "${serie}" tiene ${grupo.length} duplicados`);

            // Mantener el primero (ID más bajo), eliminar el resto
            const [mantener, ...eliminar] = grupo;

            console.log(`  ✅ Manteniendo ID: ${mantener.id} - ${mantener.nombre}`);

            for (const equipo of eliminar) {
                console.log(`  ❌ Eliminando ID: ${equipo.id} - ${equipo.nombre}`);
                await prisma.comunicaciones.delete({
                    where: { id: equipo.id }
                });
                eliminados++;
            }
        }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMEN');
    console.log('='.repeat(80));
    console.log(`📦 Total de equipos originales: ${equipos.length}`);
    console.log(`🔄 Duplicados encontrados: ${totalDuplicados}`);
    console.log(`❌ Equipos eliminados: ${eliminados}`);
    console.log(`✅ Equipos restantes: ${equipos.length - eliminados}`);
    console.log('='.repeat(80));
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
