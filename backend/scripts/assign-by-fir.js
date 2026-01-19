const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

function parseCSV(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

    const data = [];
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        const values = [];
        let currentValue = '';
        let insideQuotes = false;

        for (let char of lines[i]) {
            if (char === '"') {
                insideQuotes = !insideQuotes;
            } else if (char === ',' && !insideQuotes) {
                values.push(currentValue.trim());
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        values.push(currentValue.trim());

        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] ? values[index].replace(/"/g, '').trim() : '';
        });
        data.push(row);
    }

    return data;
}

async function assignFIRsByCode() {
    try {
        console.log('🔗 ASIGNANDO AEROPUERTOS POR FIR\n');
        console.log('═══════════════════════════════════════════════════════════════\n');

        // Leer CSV
        const filePath = path.join(__dirname, '../../Personal CNSE Nacional.csv');
        const data = parseCSV(filePath);
        console.log(`📄 ${data.length} registros en CSV\n`);

        // Obtener aeropuertos
        const aeropuertos = await prisma.aeropuerto.findMany({ include: { fir: true } });
        console.log(`✈️ Aeropuertos en BD: ${aeropuertos.length}\n`);

        // Crear mapa FIR código → Aeropuerto principal
        const firToAirport = {
            'EZE': aeropuertos.find(a => a.codigo === 'EZE'),
            'CBA': aeropuertos.find(a => a.codigo === 'CBA'),
            'CRV': aeropuertos.find(a => a.codigo === 'CRV'),
            'MDZ': aeropuertos.find(a => a.codigo === 'MDZ'),
            'RGL': aeropuertos.find(a => a.codigo === 'RGL'),
            'USH': aeropuertos.find(a => a.codigo === 'USH'),
            'RES': aeropuertos.find(a => a.codigo === 'RES'),
        };

        console.log('🗺️  MAPEO FIR → AEROPUERTO:\n');
        Object.entries(firToAirport).forEach(([fir, airport]) => {
            if (airport) {
                console.log(`   ${fir} → ${airport.nombre} (${airport.codigo})`);
            }
        });
        console.log();

        let updated = 0;
        let skipped = 0;
        let errors = 0;

        console.log('🔄 Actualizando personal...\n');

        for (const row of data) {
            try {
                const email = row['Correo EANA'];
                if (!email || !email.includes('@')) {
                    skipped++;
                    continue;
                }

                const username = email.split('@')[0].toLowerCase();
                const firCode = row['FIR'];

                // Buscar usuario
                const user = await prisma.user.findUnique({
                    where: { email: `${username}@eana.com.ar` },
                    include: { personal: true }
                });

                if (!user || !user.personal) {
                    skipped++;
                    continue;
                }

                // Buscar aeropuerto por FIR
                let aeropuertoId = null;
                if (firCode && firToAirport[firCode]) {
                    aeropuertoId = firToAirport[firCode].id;
                }

                // Actualizar personal
                await prisma.personal.update({
                    where: { id: user.personal.id },
                    data: {
                        aeropuertoId: aeropuertoId
                    }
                });

                updated++;

                if (updated % 50 === 0) {
                    console.log(`   ✅ ${updated}/${data.length}`);
                }

            } catch (error) {
                console.error(`   ❌ ${row['Correo EANA']}: ${error.message}`);
                errors++;
            }
        }

        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('                    ✅ ASIGNACIÓN COMPLETADA');
        console.log('═══════════════════════════════════════════════════════════════\n');
        console.log(`   Actualizados: ${updated}`);
        console.log(`   Omitidos: ${skipped}`);
        console.log(`   Errores: ${errors}\n`);

        // Verificar
        console.log('🔍 VERIFICACIÓN:\n');

        const testUsers = ['ppayero@eana.com.ar', 'mquatrano@eana.com.ar'];

        for (const email of testUsers) {
            const user = await prisma.user.findUnique({
                where: { email },
                include: {
                    personal: {
                        include: {
                            aeropuerto: {
                                include: { fir: true }
                            },
                            puesto: true
                        }
                    }
                }
            });

            if (user?.personal) {
                console.log(`   👤 ${user.personal.nombre} ${user.personal.apellido}`);
                console.log(`   📧 ${email}`);
                console.log(`   🏢 Puesto: ${user.personal.puesto?.nombre || 'N/A'}`);
                console.log(`   ✈️  Aeropuerto: ${user.personal.aeropuerto?.nombre || 'N/A'} (${user.personal.aeropuerto?.codigo || 'N/A'})`);
                console.log(`   🌍 FIR: ${user.personal.aeropuerto?.fir?.nombre || 'N/A'}`);
                console.log(`   🎭 Rol: ${user.role}\n`);
            }
        }

        console.log('═══════════════════════════════════════════════════════════════\n');
        console.log('✅ Personal vinculado con FIRs correctamente\n');
        console.log('💡 Ahora cada usuario verá solo equipos de su FIR:\n');
        console.log('   - ppayero (EZE) → Solo equipos de FIR Ezeiza');
        console.log('   - Usuario de CBA → Solo equipos de FIR Córdoba\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

assignFIRsByCode();
