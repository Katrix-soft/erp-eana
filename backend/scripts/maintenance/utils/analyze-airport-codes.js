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

async function analyzeAirportCodes() {
    try {
        console.log('🔍 ANÁLISIS DE CÓDIGOS OACI\n');
        console.log('═══════════════════════════════════════════════════════════════\n');

        // Leer CSV
        const filePath = path.join(__dirname, '../../Personal CNSE Nacional.csv');
        const data = parseCSV(filePath);

        // Obtener aeropuertos de BD
        const aeropuertos = await prisma.aeropuerto.findMany({ include: { fir: true } });

        // Códigos únicos en CSV
        const csvCodes = new Set();
        const csvFirs = new Set();

        data.forEach(row => {
            const code = row['id AP: OACI'];
            const fir = row['FIR'];
            if (code && code !== 'N/A' && code.length > 0) {
                csvCodes.add(code);
            }
            if (fir && fir !== 'N/A') {
                csvFirs.add(fir);
            }
        });

        console.log('📄 CÓDIGOS EN CSV:\n');
        console.log(`   Total códigos únicos: ${csvCodes.size}`);
        console.log(`   Códigos: ${Array.from(csvCodes).sort().join(', ')}\n`);

        console.log('🌍 FIRs EN CSV:\n');
        console.log(`   Total FIRs únicos: ${csvFirs.size}`);
        Array.from(csvFirs).sort().forEach(fir => {
            console.log(`   - ${fir}`);
        });
        console.log();

        console.log('✈️  AEROPUERTOS EN BD:\n');
        console.log(`   Total: ${aeropuertos.length}`);
        aeropuertos.slice(0, 10).forEach(a => {
            console.log(`   - ${a.codigo} (${a.nombre}) - FIR: ${a.fir?.nombre || 'N/A'}`);
        });
        if (aeropuertos.length > 10) {
            console.log(`   ... y ${aeropuertos.length - 10} más`);
        }
        console.log();

        // Códigos en BD
        const bdCodes = new Set(aeropuertos.map(a => a.codigo));

        // Códigos que faltan
        const missing = Array.from(csvCodes).filter(code => !bdCodes.has(code));

        console.log('❌ CÓDIGOS QUE FALTAN EN BD:\n');
        if (missing.length > 0) {
            console.log(`   Total: ${missing.length}`);
            missing.forEach(code => {
                const count = data.filter(r => r['id AP: OACI'] === code).length;
                console.log(`   - ${code} (${count} personas)`);
            });
        } else {
            console.log('   ✅ Todos los códigos existen en BD');
        }
        console.log();

        // Mostrar algunos ejemplos del CSV
        console.log('📋 EJEMPLOS DEL CSV:\n');
        data.slice(0, 5).forEach(row => {
            console.log(`   ${row['Nombres']} ${row['Apellidos']}`);
            console.log(`   Código OACI: ${row['id AP: OACI']}`);
            console.log(`   FIR: ${row['FIR']}\n`);
        });

        console.log('═══════════════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

analyzeAirportCodes();
