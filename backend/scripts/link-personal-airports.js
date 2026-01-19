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

async function linkPersonalToAirports() {
    try {
        console.log('🔗 VINCULANDO PERSONAL CON AEROPUERTOS Y FIRs\n');
        console.log('═══════════════════════════════════════════════════════════════\n');

        // Leer CSV
        const filePath = path.join(__dirname, '../../Personal CNSE Nacional.csv');
        const data = parseCSV(filePath);
        console.log(`📄 ${data.length} registros en CSV\n`);

        // Obtener aeropuertos existentes
        const aeropuertos = await prisma.aeropuerto.findMany({ include: { fir: true } });
        console.log(`✈️ Aeropuertos en BD: ${aeropuertos.length}\n`);

        // Crear mapa de aeropuertos por código
        const aeropuertoMap = {};
        aeropuertos.forEach(a => {
            aeropuertoMap[a.codigo] = a;
        });

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
                const aeropuertoCodigo = row['id AP: OACI'];

                // Buscar usuario
                const user = await prisma.user.findUnique({
                    where: { email: `${username}@eana.com.ar` },
                    include: { personal: true }
                });

                if (!user || !user.personal) {
                    skipped++;
                    continue;
                }

                // Buscar aeropuerto
                let aeropuertoId = null;
                if (aeropuertoCodigo && aeropuertoCodigo !== 'N/A' && aeropuertoCodigo.length > 0) {
                    const aeropuerto = aeropuertoMap[aeropuertoCodigo];
                    if (aeropuerto) {
                        aeropuertoId = aeropuerto.id;
                    }
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
        console.log('                    ✅ VINCULACIÓN COMPLETADA');
        console.log('═══════════════════════════════════════════════════════════════\n');
        console.log(`   Actualizados: ${updated}`);
        console.log(`   Omitidos: ${skipped}`);
        console.log(`   Errores: ${errors}\n`);

        // Verificar casos de prueba
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
        console.log('✅ Ahora cada usuario solo verá equipos de su FIR/Aeropuerto\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

linkPersonalToAirports();
