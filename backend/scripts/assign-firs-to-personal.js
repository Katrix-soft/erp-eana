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

async function assignFIRsToPersonal() {
    try {
        console.log('🔗 ASIGNANDO FIRs Y AEROPUERTOS AL PERSONAL\n');
        console.log('═══════════════════════════════════════════════════════════════\n');

        // Leer CSV
        const filePath = path.join(__dirname, '../../Personal CNSE Nacional.csv');
        const data = parseCSV(filePath);
        console.log(`📄 ${data.length} registros en CSV\n`);

        // Obtener todos los FIRs y Aeropuertos
        const firs = await prisma.fir.findMany({ include: { aeropuertos: true } });
        const aeropuertos = await prisma.aeropuerto.findMany();

        console.log(`🌍 FIRs en BD: ${firs.length}`);
        console.log(`✈️ Aeropuertos en BD: ${aeropuertos.length}\n`);

        let updated = 0;
        let notFound = 0;
        let errors = 0;

        console.log('🔄 Actualizando personal...\n');

        for (const row of data) {
            try {
                const email = row['Correo EANA'];
                if (!email || !email.includes('@')) continue;

                const username = email.split('@')[0].toLowerCase();
                const firNombre = row['FIR'];
                const aeropuertoCodigo = row['id AP: OACI'];

                // Buscar usuario
                const user = await prisma.user.findUnique({
                    where: { email: `${username}@eana.com.ar` },
                    include: { personal: true }
                });

                if (!user || !user.personal) {
                    notFound++;
                    continue;
                }

                // Buscar FIR
                let firId = null;
                if (firNombre && firNombre !== 'N/A') {
                    const fir = firs.find(f =>
                        f.nombre.toLowerCase().includes(firNombre.toLowerCase().replace('FIR ', ''))
                    );
                    firId = fir?.id;
                }

                // Buscar Aeropuerto
                let aeropuertoId = null;
                if (aeropuertoCodigo && aeropuertoCodigo !== 'N/A') {
                    const aeropuerto = aeropuertos.find(a => a.codigo === aeropuertoCodigo);
                    aeropuertoId = aeropuerto?.id;
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
                console.error(`   ❌ Error con ${row['Correo EANA']}: ${error.message}`);
                errors++;
            }
        }

        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('                    ✅ ASIGNACIÓN COMPLETADA');
        console.log('═══════════════════════════════════════════════════════════════\n');
        console.log(`   Actualizados: ${updated}`);
        console.log(`   No encontrados: ${notFound}`);
        console.log(`   Errores: ${errors}\n`);

        // Verificar algunos casos
        console.log('🔍 VERIFICACIÓN:\n');

        const ppayero = await prisma.user.findUnique({
            where: { email: 'ppayero@eana.com.ar' },
            include: {
                personal: {
                    include: {
                        aeropuerto: {
                            include: {
                                fir: true
                            }
                        }
                    }
                }
            }
        });

        if (ppayero?.personal) {
            console.log('   Usuario: ppayero@eana.com.ar');
            console.log(`   Aeropuerto: ${ppayero.personal.aeropuerto?.nombre || 'N/A'}`);
            console.log(`   FIR: ${ppayero.personal.aeropuerto?.fir?.nombre || 'N/A'}\n');
        }

        console.log('═══════════════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

assignFIRsToPersonal();
