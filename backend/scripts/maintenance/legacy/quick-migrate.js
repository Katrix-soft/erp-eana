const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
const GENERIC_PASSWORD = 'Eana2025';

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

async function quickMigrate() {
    try {
        console.log('🚀 MIGRACIÓN RÁPIDA DE PERSONAL CNS\n');

        // Limpiar
        console.log('🗑️  Limpiando...');
        await prisma.personal.deleteMany({});
        await prisma.user.deleteMany({ where: { NOT: { email: 'admin@eana.com.ar' } } });
        await prisma.puestoPersonal.deleteMany({});
        console.log('   ✅ Limpieza completada\n');

        // Leer CSV
        const filePath = path.join(__dirname, '../../Personal CNSE Nacional.csv');
        const data = parseCSV(filePath);
        console.log(`📄 ${data.length} registros en CSV\n`);

        // Hash contraseña
        const hashedPassword = await bcrypt.hash(GENERIC_PASSWORD, 10);

        // Cache de puestos y aeropuertos
        const puestosCache = {};
        const aeropuertosCache = {};

        let created = 0;
        let skipped = 0;

        console.log('📥 Importando...\n');

        for (const row of data) {
            try {
                const email = row['Correo EANA'];
                if (!email || !email.includes('@')) {
                    skipped++;
                    continue;
                }

                const username = email.split('@')[0].toLowerCase();
                const nombre = row['Nombres'] || row['Nombre'];
                const apellido = row['Apellidos'];
                const cargo = row['Cargo'];
                const departamento = row['Departamento'];
                const aeropuertoCodigo = row['id AP: OACI'];

                // Rol
                let role = 'TECNICO';
                if (cargo) {
                    if (cargo.includes('Jefe Regional')) role = 'CNS_NACIONAL';
                    else if (cargo.includes('Coordinador') || cargo.includes('Jefe')) role = 'JEFE_COORDINADOR';
                }

                // Puesto (con cache)
                let puestoId = null;
                if (cargo) {
                    if (!puestosCache[cargo]) {
                        let puesto = await prisma.puestoPersonal.findFirst({ where: { nombre: cargo } });
                        if (!puesto) {
                            puesto = await prisma.puestoPersonal.create({ data: { nombre: cargo } });
                        }
                        puestosCache[cargo] = puesto.id;
                    }
                    puestoId = puestosCache[cargo];
                }

                // Aeropuerto (con cache)
                let aeropuertoId = null;
                if (aeropuertoCodigo && aeropuertoCodigo !== 'N/A') {
                    if (!aeropuertosCache[aeropuertoCodigo]) {
                        const aeropuerto = await prisma.aeropuerto.findFirst({ where: { codigo: aeropuertoCodigo } });
                        aeropuertosCache[aeropuertoCodigo] = aeropuerto?.id || null;
                    }
                    aeropuertoId = aeropuertosCache[aeropuertoCodigo];
                }

                // Sector
                let sector = 'CNSE';
                if (departamento) {
                    if (departamento.includes('Comunicaciones')) sector = 'COMUNICACIONES';
                    else if (departamento.includes('Navegación')) sector = 'NAVEGACION';
                    else if (departamento.includes('Vigilancia')) sector = 'VIGILANCIA';
                    else if (departamento.includes('Energía')) sector = 'ENERGIA';
                }

                // Crear usuario
                const user = await prisma.user.create({
                    data: {
                        email: `${username}@eana.com.ar`,
                        password: hashedPassword,
                        role
                    }
                });

                // Crear personal
                await prisma.personal.create({
                    data: {
                        nombre,
                        apellido,
                        sector,
                        puestoId,
                        aeropuertoId,
                        userId: user.id
                    }
                });

                created++;
                if (created % 50 === 0) {
                    console.log(`   ✅ ${created}/${data.length}`);
                }

            } catch (error) {
                console.error(`   ❌ ${row['Correo EANA']}: ${error.message}`);
            }
        }

        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('                    ✅ MIGRACIÓN COMPLETADA');
        console.log('═══════════════════════════════════════════════════════════════\n');
        console.log(`   Creados: ${created}`);
        console.log(`   Omitidos: ${skipped}`);
        console.log(`   Total: ${data.length}\n`);
        console.log(`   Puestos únicos: ${Object.keys(puestosCache).length}\n`);
        console.log('🔐 CREDENCIALES:\n');
        console.log('   Usuario: [username]@eana.com.ar');
        console.log(`   Contraseña: ${GENERIC_PASSWORD}\n`);
        console.log('═══════════════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

quickMigrate();
