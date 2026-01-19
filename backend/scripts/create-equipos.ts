

const prisma = new PrismaClient();

async function main() {
    console.log('🔧 Creando equipos de ejemplo...\n');

    // Obtener aeropuertos existentes
    const aeropuertos = await prisma.aeropuerto.findMany({
        include: {
            fir: true
        }
    });

    if (aeropuertos.length === 0) {
        console.log('❌ No hay aeropuertos en la base de datos. Crea aeropuertos primero.');
        return;
    }

    console.log(`📍 Encontrados ${aeropuertos.length} aeropuertos\n`);

    // Equipos de COMUNICACIONES
    const comunicacionesData = [
        {
            nombre: 'Radio VHF Torre',
            tipo: 'VHF',
            marca: 'Rohde & Schwarz',
            modelo: 'XU4200',
            numeroSerie: 'RS-VHF-001'
        },
        {
            nombre: 'Radio HF Principal',
            tipo: 'HF',
            marca: 'Rohde & Schwarz',
            modelo: 'XD4200',
            numeroSerie: 'RS-HF-001'
        },
        {
            nombre: 'Sistema AFTN',
            tipo: 'AFTN',
            marca: 'Indra',
            modelo: 'AFTN-2000',
            numeroSerie: 'AFTN-001'
        }
    ];

    // Equipos de NAVEGACION
    const navegacionData = [
        {
            nombre: 'VOR/DME',
            tipo: 'VOR',
            marca: 'Thales',
            modelo: 'VOR-432',
            numeroSerie: 'VOR-001'
        },
        {
            nombre: 'ILS Localizer',
            tipo: 'ILS',
            marca: 'Thales',
            modelo: 'ILS-2100',
            numeroSerie: 'ILS-001'
        },
        {
            nombre: 'NDB',
            tipo: 'NDB',
            marca: 'Selex',
            modelo: 'NDB-300',
            numeroSerie: 'NDB-001'
        }
    ];

    // Equipos de VIGILANCIA
    const vigilanciaData = [
        {
            nombre: 'Radar Primario',
            tipo: 'PSR',
            marca: 'Indra',
            modelo: 'PSR-2500',
            numeroSerie: 'PSR-001'
        },
        {
            nombre: 'Radar Secundario',
            tipo: 'SSR',
            marca: 'Indra',
            modelo: 'SSR-3000',
            numeroSerie: 'SSR-001'
        },
        {
            nombre: 'ADS-B',
            tipo: 'ADS-B',
            marca: 'Frequentis',
            modelo: 'ADS-B-100',
            numeroSerie: 'ADS-001'
        }
    ];

    // Equipos de ENERGIA
    const energiaData = [
        {
            nombre: 'UPS Principal',
            tipo: 'UPS',
            marca: 'APC',
            modelo: 'Smart-UPS 10000',
            numeroSerie: 'UPS-001'
        },
        {
            nombre: 'Generador Diesel',
            tipo: 'GENERADOR',
            marca: 'Caterpillar',
            modelo: 'CAT-500',
            numeroSerie: 'GEN-001'
        },
        {
            nombre: 'Banco de Baterías',
            tipo: 'BATERIAS',
            marca: 'Enersys',
            modelo: 'PowerSafe',
            numeroSerie: 'BAT-001'
        }
    ];

    let totalCreated = 0;

    // Crear equipos para cada aeropuerto
    for (const aeropuerto of aeropuertos) {
        console.log(`\n📍 Creando equipos para: ${aeropuerto.nombre} (${aeropuerto.fir.nombre})`);

        // COMUNICACIONES
        for (const equipo of comunicacionesData) {
            await prisma.comunicaciones.create({
                data: {
                    ...equipo,
                    numeroSerie: `${equipo.numeroSerie}-${aeropuerto.codigo || aeropuerto.id}`,
                    aeropuertoId: aeropuerto.id
                }
            });
            totalCreated++;
        }
        console.log(`  ✅ ${comunicacionesData.length} equipos de COMUNICACIONES`);

        // NAVEGACION
        for (const equipo of navegacionData) {
            await prisma.navegacion.create({
                data: {
                    nombre: equipo.nombre,
                    tipo: equipo.tipo,
                    aeropuertoId: aeropuerto.id,
                    equipos: {
                        create: {
                            tipoEquipo: 'PRINCIPAL',
                            marca: equipo.marca,
                            modelo: equipo.modelo,
                            numeroSerie: `${equipo.numeroSerie}-${aeropuerto.codigo || aeropuerto.id}`,
                        }
                    }
                }
            });
            totalCreated++;
        }
        console.log(`  ✅ ${navegacionData.length} equipos de NAVEGACION`);

        // VIGILANCIA
        for (const equipo of vigilanciaData) {
            await prisma.vigilancia.create({
                data: {
                    ...equipo,
                    numeroSerie: `${equipo.numeroSerie}-${aeropuerto.codigo || aeropuerto.id}`,
                    aeropuertoId: aeropuerto.id
                }
            });
            totalCreated++;
        }
        console.log(`  ✅ ${vigilanciaData.length} equipos de VIGILANCIA`);

        // ENERGIA
        for (const equipo of energiaData) {
            await prisma.energia.create({
                data: {
                    ...equipo,
                    numeroSerie: `${equipo.numeroSerie}-${aeropuerto.codigo || aeropuerto.id}`,
                    aeropuertoId: aeropuerto.id
                }
            });
            totalCreated++;
        }
        console.log(`  ✅ ${energiaData.length} equipos de ENERGIA`);
    }

    console.log('\n' + '='.repeat(80));
    console.log(`🎉 ¡Proceso completado!`);
    console.log('='.repeat(80));
    console.log(`📊 Total de equipos creados: ${totalCreated}`);
    console.log(`📍 Aeropuertos procesados: ${aeropuertos.length}`);
    console.log(`📦 Equipos por aeropuerto: ${totalCreated / aeropuertos.length}`);
    console.log('='.repeat(80));
    console.log('\n✅ Ahora puedes ver los equipos en Prisma Studio y en la aplicación\n');
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
