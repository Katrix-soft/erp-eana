

import * as xlsx from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
    const filePath = path.join(process.cwd(), '../Equipamiento VHF Nacional.xlsx');
    console.log(`📖 Leyendo archivo: ${filePath}`);

    let data: any[] = [];
    try {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        data = xlsx.utils.sheet_to_json(sheet);
        console.log(`📊 Filas encontradas: ${data.length}`);
    } catch (error) {
        console.error('❌ Error leyendo Excel:', error);
        return;
    }

    console.log('🗑️  Limpiando tablas de VHF antiguas...');
    // Orden importante por foreign keys
    await prisma.frecuencia.deleteMany({});
    await prisma.canal.deleteMany({});
    await prisma.equipo.deleteMany({}); // Tabla 'equipos'
    await prisma.vhf.deleteMany({});    // Tabla 'vhf'

    // Opcional: Limpiar 'comunicaciones' si queremos que sea reemplazada totalmente
    // Pero 'comunicaciones' es el modelo viejo. Lo dejaremos vacio si vamos a migrar la logica.
    await prisma.activoComunicaciones.deleteMany({});
    await prisma.comunicaciones.deleteMany({});

    console.log('🚀 Iniciando importación...');

    let processedIdx = 0;
    const sitioMap = new Map<string, number>(); // Key: "FIR|Aeropuerto|Sitio" -> VhfID

    for (const row of data) {
        processedIdx++;
        if (processedIdx % 100 === 0) console.log(`   Procesando ${processedIdx}/${data.length}...`);

        try {
            // Mapeo de campos
            const fir = (row['FIR'] || row['Ubicacion: FIR'] || 'Desconocido').toString().trim();
            // Aeropuerto: Preferimos 'Ubicacion: Nombre ' o 'Sitio'
            let aeropuerto = (row['Ubicacion: Nombre '] || row['Sitio'] || 'Desconocido').toString().trim();
            const sitio = (row['Sitio'] || aeropuerto).toString().trim();

            // Normalizar aeropuerto si es necesario (ej: Mendoza -> Mendoza)
            // Aquí podríamos buscar en DB Aeropuertos para obtener el nombre oficial, 
            // pero el modelo VHF usa string.

            const vhfKey = `${fir}|${aeropuerto}|${sitio}`.toUpperCase();

            let vhfId = sitioMap.get(vhfKey);

            if (!vhfId) {
                // Buscar si existe en BD (por si corremos script incremental, aunque borramos todo antes)
                // Como borramos todo, creamos nuevo.
                const newVhf = await prisma.vhf.create({
                    data: {
                        fir: fir,
                        aeropuerto: aeropuerto, // Guardamos nombre tal cual viene
                        sitio: sitio
                    }
                });
                vhfId = newVhf.id;
                sitioMap.set(vhfKey, vhfId);
            }

            // Crear Equipo
            const marca = (row['Marca'] || 'N/A').toString();
            const modelo = (row['Modelo'] || 'N/A').toString();
            const serie = (row['Nro de Serie'] || 'S/N').toString();
            const tipo = (row['Tipo'] || 'Genérico').toString(); // Main, Standby
            const tecnologia = row['Tecnologia']?.toString();
            const activoFijo = row['Activo Fijo']?.toString();

            // Frecuencia
            const freqVal = parseFloat(row['Frecuencia [MHz]']);
            const frecuencia = isNaN(freqVal) ? null : freqVal;

            const canalNombre = (row['Canal'] || '').toString();

            const equipo = await prisma.equipo.create({
                data: {
                    vhfId: vhfId,
                    tipoEquipo: tipo,
                    marca: marca,
                    modelo: modelo,
                    numeroSerie: serie,
                    tecnologia: tecnologia,
                    activoFijo: activoFijo,
                    estado: 'OK',
                }
            });

            if (canalNombre) {
                const canal = await prisma.canal.create({
                    data: {
                        equipoVhfId: equipo.id,
                        canal: canalNombre,
                        tipo: tipo
                    }
                });

                if (frecuencia !== null) {
                    await prisma.frecuencia.create({
                        data: {
                            canalId: canal.id,
                            equipoVhfId: equipo.id,
                            frecuencia: frecuencia
                        }
                    });
                }
            } else if (frecuencia !== null) {
                // Caso raro: Frecuencia sin nombre de canal. Creamos canal genérico?
                // O lo asignamos directo si el modelo permitiera (Frecuencia tiene equipoVhfId)
                // Pero Frecuencia requiere canalId (relation fields: [canalId]).

                // Creamos canal default
                const canal = await prisma.canal.create({
                    data: {
                        equipoVhfId: equipo.id,
                        canal: 'DEFAULT',
                        tipo: tipo
                    }
                });

                await prisma.frecuencia.create({
                    data: {
                        canalId: canal.id,
                        equipoVhfId: equipo.id,
                        frecuencia: frecuencia
                    }
                });
            }

        } catch (err) {
            console.error(`❌ Error importando fila ${processedIdx}:`, err);
        }
    }

    console.log('✅ Importación VHF finalizada.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
