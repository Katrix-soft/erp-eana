

import * as xlsx from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

async function importVigilancia() {
    try {
        console.log('--- Iniciando Importación de Vigilancia (Legacy Support) ---');

        await prisma.vigilancia.deleteMany({});
        console.log('Tabla Vigilancia limpiada.');

        const filePath = path.join(__dirname, '../../Instrumental VIG.xlsx');
        const workbook = xlsx.readFile(filePath);
        const sheet = workbook.Sheets['query'];
        const data = xlsx.utils.sheet_to_json(sheet);

        console.log(`Encontrados ${data.length} registros en Excel.`);

        const aeropuertos = await prisma.aeropuerto.findMany({ include: { fir: true } });
        const firs = await prisma.fir.findMany();

        let count = 0;

        for (const row of data as any) {
            const siglasLocal = row['Siglas Local'] ? row['Siglas Local'].trim().toUpperCase() : null;
            const firText = row['FIR'] ? row['FIR'].trim().toUpperCase() : null;

            let aero = aeropuertos.find(a => a.codigo === siglasLocal);

            const firRel = firs.find(f =>
                (firText && firText.includes(f.nombre.toUpperCase())) ||
                (firText && f.nombre.toUpperCase().includes(firText))
            );

            if (!aero && row['Ubicación EANA'] && row['Ubicación EANA'].length === 3) {
                aero = aeropuertos.find(a => a.codigo === row['Ubicación EANA'].toUpperCase());
            }

            await prisma.vigilancia.create({
                data: {
                    referencia: row['Referencia']?.toString(),
                    definicion: row['Definición']?.toString(),
                    modelo: row['Modelo']?.toString(),
                    certificadores: row['Entes Certificadores']?.toString(),
                    sistema: row['Sistema']?.toString(),
                    fir: row['FIR']?.toString(),
                    siglasLocal: siglasLocal,
                    ubicacion: row['Ubicación EANA']?.toString(),
                    idApSig: row['ID']?.toString(),
                    aeropuertoId: aero?.id || null,
                    firId: firRel?.id || null,
                    estado: 'OK',
                    // Legacy fields for project compatibility
                    nombre: row['Ubicación EANA']?.toString() || row['Referencia']?.toString() || 'Equipo Vigilancia',
                    tipo: row['Definición']?.toString(),
                    marca: row['Entes Certificadores']?.toString() || 'S/D'
                }
            });
            count++;
        }

        console.log(`✅ Importación completada: ${count} equipos creados.`);

    } catch (error) {
        console.error('❌ Error en la importación:', error);
    } finally {
        await prisma.$disconnect();
    }
}

importVigilancia();
