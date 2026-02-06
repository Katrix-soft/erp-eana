const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');

const prisma = new PrismaClient();

async function loadFirsAndAeropuertos() {
    try {
        console.log('📊 Cargando FIRs y Aeropuertos desde Excel...\n');

        // Leer el archivo Excel
        const filePath = path.join(__dirname, '../../Equipamiento VHF Nacional.xlsx');
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`📄 Total de filas: ${data.length}\n`);

        // Extraer FIRs únicos
        const firsSet = new Set();
        const aeropuertosMap = new Map();

        data.forEach(row => {
            const fir = row['FIR'];
            const aeropuertoCodigo = row['Desginador 3 Letras'] || row['FIR'];
            const sitio = row['Sitio'];

            if (fir) {
                firsSet.add(fir);
            }

            if (aeropuertoCodigo && sitio) {
                const key = `${fir}-${aeropuertoCodigo}`;
                if (!aeropuertosMap.has(key)) {
                    aeropuertosMap.set(key, {
                        fir: fir,
                        codigo: aeropuertoCodigo,
                        nombre: sitio
                    });
                }
            }
        });

        console.log(`📍 FIRs únicos encontrados: ${firsSet.size}`);
        console.log(`🏢 Aeropuertos únicos encontrados: ${aeropuertosMap.size}\n`);

        // Crear FIRs
        console.log('🔧 Creando FIRs...');
        const firMap = new Map();

        for (const firCode of firsSet) {
            let firNombre = '';
            switch (firCode) {
                case 'EZE':
                    firNombre = 'FIR Ezeiza';
                    break;
                case 'CBA':
                    firNombre = 'FIR Córdoba';
                    break;
                case 'CRV':
                    firNombre = 'FIR Comodoro Rivadavia';
                    break;
                case 'DOZ':
                    firNombre = 'FIR Mendoza';
                    break;
                case 'SIS':
                    firNombre = 'FIR Resistencia';
                    break;
                default:
                    firNombre = `FIR ${firCode}`;
            }

            let fir = await prisma.fir.findFirst({
                where: { nombre: firNombre }
            });

            if (!fir) {
                fir = await prisma.fir.create({
                    data: { nombre: firNombre }
                });
                console.log(`   ✅ ${firNombre}`);
            } else {
                console.log(`   ℹ️  ${firNombre} (ya existe)`);
            }

            firMap.set(firCode, fir);
        }

        // Crear Aeropuertos
        console.log('\n🔧 Creando Aeropuertos...');
        let createdCount = 0;
        let existingCount = 0;

        for (const [key, aeroData] of aeropuertosMap) {
            const fir = firMap.get(aeroData.fir);
            if (!fir) {
                console.log(`   ⚠️  FIR no encontrado para ${aeroData.codigo}`);
                continue;
            }

            let aeropuerto = await prisma.aeropuerto.findFirst({
                where: { codigo: aeroData.codigo }
            });

            if (!aeropuerto) {
                aeropuerto = await prisma.aeropuerto.create({
                    data: {
                        codigo: aeroData.codigo,
                        nombre: aeroData.nombre,
                        firId: fir.id
                    }
                });
                console.log(`   ✅ ${aeroData.codigo} - ${aeroData.nombre}`);
                createdCount++;
            } else {
                existingCount++;
            }
        }

        console.log(`\n📊 Resumen:`);
        console.log(`   FIRs totales: ${firsSet.size}`);
        console.log(`   Aeropuertos creados: ${createdCount}`);
        console.log(`   Aeropuertos existentes: ${existingCount}`);
        console.log(`   Total aeropuertos: ${createdCount + existingCount}`);

        // Listar todos los FIRs y sus aeropuertos
        console.log('\n📋 FIRs y Aeropuertos en la base de datos:\n');

        const allFirs = await prisma.fir.findMany({
            include: {
                aeropuertos: true
            },
            orderBy: {
                nombre: 'asc'
            }
        });

        allFirs.forEach(fir => {
            console.log(`🗺️  ${fir.nombre}`);
            fir.aeropuertos.forEach(aero => {
                console.log(`   └─ ${aero.codigo} - ${aero.nombre}`);
            });
            console.log('');
        });

        console.log('✅ Proceso completado!');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

loadFirsAndAeropuertos();
