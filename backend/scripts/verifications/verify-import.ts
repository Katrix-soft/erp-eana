


const prisma = new PrismaClient();

async function main() {
    const vhfSites = await prisma.vhf.findMany({
        include: {
            _count: {
                select: { equipos: true }
            },
            equipos: {
                take: 2,
                select: {
                    tipoEquipo: true,
                    marca: true,
                    modelo: true,
                    numeroSerie: true
                }
            }
        }
    });

    console.log('=== VERIFICACIÓN DE IMPORTACIÓN VHF ===');
    vhfSites.forEach(s => {
        if (s._count.equipos > 0) {
            console.log(`\n📍 FIR: ${s.fir} | Aeropuerto: ${s.aeropuerto} | Sitio: ${s.sitio}`);
            console.log(`   Total Equipos: ${s._count.equipos}`);
            s.equipos.forEach(e => {
                console.log(`   - [${e.tipoEquipo}] ${e.marca} ${e.modelo} (S/N: ${e.numeroSerie})`);
            });
            if (s._count.equipos > 2) console.log(`   - ... y ${s._count.equipos - 2} más`);
        }
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
