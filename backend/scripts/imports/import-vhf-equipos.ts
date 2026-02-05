
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('📡 Importando equipos VHF desde Excel...\n');

    // Leer el archivo Excel
    const filePath = path.join(__dirname, '..', '..', 'Equipamiento VHF Nacional.xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`📊 Total de registros en Excel: ${data.length}\n`);

    // Obtener todos los aeropuertos con sus FIRs
    const aeropuertos = await prisma.aeropuerto.findMany({
        include: {
            fir: true
        }
    });

    console.log(`📍 Aeropuertos en DB: ${aeropuertos.length}\n`);

    // Crear un mapa de aeropuertos por nombre y FIR
    const aeropuertoMap = new Map();
    aeropuertos.forEach(aero => {
        const key = `${aero.nombre.toLowerCase()}-${aero.fir.nombre.toLowerCase()}`;
        aeropuertoMap.set(key, aero);
        // También por código OACI si existe
        if (aero.codigo) {
            aeropuertoMap.set(aero.codigo.toLowerCase(), aero);
        }
    });

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const row of data as any[]) {
        try {
            const sitio = row['Sitio'] || row['Ubicacion: Nombre '] || '';
            const firNombre = row['FIR'] || row['Ubicacion: FIR'] || '';
            const designador = row['Desginador 3 Letras'] || '';

            if (!sitio && !designador) {
                console.log(`⚠️  Saltando fila sin sitio: ${JSON.stringify(row).substring(0, 100)}`);
                skipped++;
                continue;
            }

            // Buscar aeropuerto
            let aeropuerto = null;

            // Intentar por código OACI
            if (designador) {
                aeropuerto = aeropuertoMap.get(designador.toLowerCase());
            }

            // Intentar por nombre + FIR
            if (!aeropuerto && sitio && firNombre) {
                const key = `${sitio.toLowerCase()}-fir ${firNombre.toLowerCase()}`;
                aeropuerto = aeropuertoMap.get(key);
            }

            // Intentar solo por nombre
            if (!aeropuerto && sitio) {
                for (const [key, aero] of aeropuertoMap.entries()) {
                    if (key.includes(sitio.toLowerCase())) {
                        aeropuerto = aero;
                        break;
                    }
                }
            }

            if (!aeropuerto) {
                console.log(`❌ No se encontró aeropuerto para: ${sitio} (${designador}) - FIR: ${firNombre}`);
                errors++;
                continue;
            }

            // Crear equipo de comunicaciones
            await prisma.comunicaciones.create({
                data: {
                    nombre: row['Title'] || row['Canal'] || 'VHF',
                    tipo: row['Tipo'] || 'VHF',
                    marca: row['Marca'] || 'N/A',
                    modelo: row['Modelo'] || 'N/A',
                    numeroSerie: row['Nro de Serie'] || row['Activo Fijo'] || 'N/A',
                    aeropuertoId: aeropuerto.id
                }
            });

            created++;

            if (created % 50 === 0) {
                console.log(`✅ Creados: ${created}...`);
            }

        } catch (error) {
            console.error(`❌ Error procesando fila:`, error);
            errors++;
        }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMEN DE IMPORTACIÓN');
    console.log('='.repeat(80));
    console.log(`✅ Equipos creados: ${created}`);
    console.log(`⚠️  Saltados: ${skipped}`);
    console.log(`❌ Errores: ${errors}`);
    console.log(`📈 Total procesados: ${data.length}`);
    console.log('='.repeat(80));
}

main()
    .catch((e) => {
        console.error('❌ Error fatal:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
