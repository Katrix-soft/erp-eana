const { PrismaClient } = require('@prisma/client');
const XLSX = require('./node_modules/xlsx/xlsx.js');
const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Iniciando importación de Instrumental NAV...');

    try {
        const workbook = XLSX.readFile('..\\Instrumental NAV.xlsx');
        const sheetName = workbook.SheetNames[0];
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        console.log(`📊 Procesando ${data.length} registros...`);

        // Limpiar tabla actual para evitar basura (opcional, pero ayuda al rearmado solicitado)
        // await prisma.navegacion.deleteMany({}); 

        for (const row of data) {
            try {
                await prisma.navegacion.create({
                    data: {
                        ayuda: row['AYUDA']?.toString(),
                        asociadoA: row['Asociado a']?.toString(),
                        modelo: row['MODELO']?.toString(),
                        nombre: row['Title']?.toString() || 'Sin Nombre',
                        latitud: row['Latitud'] ? parseFloat(row['Latitud']) : null,
                        longitud: row['Longitud'] ? parseFloat(row['Longitud']) : null,
                        oaci: row['OACI']?.toString(),
                        anioInstalacion: row['AÑO DE INSTALACION']?.toString(),
                        monitorTorre: row['MonitorTorre'] === true || row['MonitorTorre'] === '1',
                        frecuencia: row['FRECUENCIA']?.toString(),
                        fir: row['FIR']?.toString(),
                        tipo: row['Tipo']?.toString(),
                        siglasLocal: row['Siglas Local']?.toString(),
                        estacion: row['Estación']?.toString()
                    }
                });
            } catch (e) {
                console.error(`❌ Error en fila ${JSON.stringify(row['Title'])}:`, e);
            }
        }

        console.log('✅ Importación finalizada con éxito.');
    } catch (error) {
        console.error('❌ Error crítico:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
