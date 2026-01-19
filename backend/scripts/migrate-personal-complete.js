const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const GENERIC_PASSWORD = 'Eana2025';

// Función para parsear CSV manualmente
function parseCSV(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

    const data = [];
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        // Parsear CSV respetando comillas
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

async function migratePersonalCNS() {
    try {
        console.log('🔄 MIGRACIÓN COMPLETA DE PERSONAL CNS\n');
        console.log('═══════════════════════════════════════════════════════════════\n');

        // PASO 1: Limpiar datos existentes (excepto admin)
        console.log('🗑️  PASO 1: Limpiando datos existentes...\n');

        // Eliminar personal
        const deletedPersonal = await prisma.personal.deleteMany({});
        console.log(`   ✅ ${deletedPersonal.count} registros de personal eliminados`);

        // Eliminar usuarios (excepto admin)
        const deletedUsers = await prisma.user.deleteMany({
            where: {
                NOT: {
                    email: 'admin@eana.com.ar'
                }
            }
        });
        console.log(`   ✅ ${deletedUsers.count} usuarios eliminados (admin preservado)`);

        // Eliminar puestos
        const deletedPuestos = await prisma.puestoPersonal.deleteMany({});
        console.log(`   ✅ ${deletedPuestos.count} puestos eliminados\n`);

        // PASO 2: Leer CSV
        console.log('📄 PASO 2: Leyendo archivo CSV...\n');
        const filePath = path.join(__dirname, '../../Personal CNSE Nacional.csv');
        const data = parseCSV(filePath);
        console.log(`   ✅ ${data.length} registros encontrados en CSV\n`);

        // PASO 3: Hashear contraseña una sola vez
        console.log('🔐 PASO 3: Generando hash de contraseña...\n');
        const hashedPassword = await bcrypt.hash(GENERIC_PASSWORD, 10);
        console.log(`   ✅ Contraseña hasheada: ${GENERIC_PASSWORD}\n`);

        // PASO 4: Importar datos
        console.log('📥 PASO 4: Importando personal...\n');

        let created = 0;
        let skipped = 0;
        let errors = 0;

        for (const row of data) {
            try {
                const email = row['Correo EANA'];
                const nombre = row['Nombres'] || row['Nombre'];
                const apellido = row['Apellidos'];
                const cargo = row['Cargo']; // CARGO = PUESTO
                const departamento = row['Departamento'];
                const aeropuertoCodigo = row['id AP: OACI'];
                const firNombre = row['FIR'];

                // Validar email
                if (!email || !email.includes('@')) {
                    skipped++;
                    continue;
                }

                // Extraer username del email
                const username = email.split('@')[0].toLowerCase();

                // Determinar rol según cargo
                let role = 'TECNICO';
                if (cargo) {
                    if (cargo.includes('Jefe Regional') || cargo.includes('JEFE')) {
                        role = 'CNS_NACIONAL';
                    } else if (cargo.includes('Coordinador') || cargo.includes('Jefe Departamento')) {
                        role = 'JEFE_COORDINADOR';
                    }
                }

                // Buscar o crear FIR
                let fir = null;
                if (firNombre && firNombre !== 'N/A') {
                    fir = await prisma.fir.findFirst({
                        where: { nombre: { contains: firNombre, mode: 'insensitive' } }
                    });

                    if (!fir) {
                        fir = await prisma.fir.create({
                            data: { nombre: firNombre }
                        });
                    }
                }

                // Buscar aeropuerto
                let aeropuerto = null;
                if (aeropuertoCodigo && aeropuertoCodigo !== 'N/A') {
                    aeropuerto = await prisma.aeropuerto.findFirst({
                        where: { codigo: aeropuertoCodigo }
                    });
                }

                // Buscar o crear puesto (usando CARGO)
                let puesto = null;
                if (cargo) {
                    puesto = await prisma.puestoPersonal.findFirst({
                        where: { nombre: cargo }
                    });

                    if (!puesto) {
                        puesto = await prisma.puestoPersonal.create({
                            data: { nombre: cargo }
                        });
                    }
                }

                // Determinar sector según departamento
                let sector = 'CNSE';
                if (departamento) {
                    if (departamento.includes('Comunicaciones') || departamento.includes('DCOM')) {
                        sector = 'COMUNICACIONES';
                    } else if (departamento.includes('Navegación') || departamento.includes('DNAV')) {
                        sector = 'NAVEGACION';
                    } else if (departamento.includes('Vigilancia') || departamento.includes('DVIG')) {
                        sector = 'VIGILANCIA';
                    } else if (departamento.includes('Energía') || departamento.includes('DENE')) {
                        sector = 'ENERGIA';
                    }
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
                        puestoId: puesto?.id,
                        aeropuertoId: aeropuerto?.id,
                        userId: user.id
                    }
                });

                created++;

                if (created % 50 === 0) {
                    console.log(`   Procesados: ${created}/${data.length}`);
                }

            } catch (error) {
                console.error(`   ❌ Error con ${row['Correo EANA']}:`, error.message);
                errors++;
            }
        }

        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('                    MIGRACIÓN COMPLETADA');
        console.log('═══════════════════════════════════════════════════════════════\n');

        console.log('📊 RESUMEN:\n');
        console.log(`   ✅ Usuarios creados: ${created}`);
        console.log(`   ✅ Personal creado: ${created}`);
        console.log(`   ⚠️  Omitidos (sin email): ${skipped}`);
        console.log(`   ❌ Errores: ${errors}`);
        console.log(`   📄 Total procesados: ${data.length}\n`);

        // Verificar puestos creados
        const totalPuestos = await prisma.puestoPersonal.count();
        console.log(`   📋 Total de puestos (cargos) creados: ${totalPuestos}\n`);

        // Verificar FIRs
        const totalFirs = await prisma.fir.count();
        console.log(`   🌍 Total de FIRs: ${totalFirs}\n`);

        console.log('═══════════════════════════════════════════════════════════════\n');
        console.log('🔐 CREDENCIALES:\n');
        console.log('   Usuario: [username]@eana.com.ar');
        console.log('   Ejemplo: ppayero@eana.com.ar');
        console.log(`   Contraseña: ${GENERIC_PASSWORD}\n`);
        console.log('   Usuario admin preservado:');
        console.log('   admin@eana.com.ar / admin1234\n');
        console.log('═══════════════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Error fatal:', error);
    } finally {
        await prisma.$disconnect();
    }
}

migratePersonalCNS();
