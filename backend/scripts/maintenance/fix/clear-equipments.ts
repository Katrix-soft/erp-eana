


const prisma = new PrismaClient();

async function main() {
    console.log('🗑️  Limpiando datos de equipos ficticios...');

    try {
        // 1. ActivoComunicaciones (hijos de Comunicaciones)
        const activos = await prisma.activoComunicaciones.deleteMany({});
        console.log(`✅ Activos de Comunicaciones eliminados: ${activos.count}`);

        // 2. Comunicaciones
        const coms = await prisma.comunicaciones.deleteMany({});
        console.log(`✅ Comunicaciones eliminadas: ${coms.count}`);

        // 3. EquipoNavegacion (hijos de Navegacion)
        const navEquipos = await prisma.equipoNavegacion.deleteMany({});
        console.log(`✅ Equipos de Navegación eliminados: ${navEquipos.count}`);

        // 4. Navegacion
        const navs = await prisma.navegacion.deleteMany({});
        console.log(`✅ Sitios de Navegación eliminados: ${navs.count}`);

        // 5. Vigilancia
        const vig = await prisma.vigilancia.deleteMany({});
        console.log(`✅ Vigilancia eliminada: ${vig.count}`);

        // 6. Energia
        const ene = await prisma.energia.deleteMany({});
        console.log(`✅ Energía eliminada: ${ene.count}`);

        console.log('🎉 Limpieza completada exitosamente.');
    } catch (error) {
        console.error('❌ Error durante la limpieza:', error);
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
