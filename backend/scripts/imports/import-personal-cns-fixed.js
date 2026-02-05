const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Contraseña genérica para todos
const GENERIC_PASSWORD = 'Eana2025';

// Función para parsear CSV manualmente
function parseCSV(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

    const data = [];
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        const values = lines[i].split(',');
        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] ? values[index].replace(/"/g, '').trim() : '';
        });
        data.push(row);
    }

    return data;
}

async function loadPersonalCNS() {
    try {
        console.log('👥 Cargando Personal CNS desde CSV...\n');
        console.log(`🔐 Contraseña genérica: ${GENERIC_PASSWORD}\n`);

        const filePath = path.join(__dirname, '../../Personal CNSE Nacional.csv');
        const data = parseCSV(filePath);

        console.log(`📄 Total de filas: ${data.length}\n`);

        // Hash de la contraseña genérica (una sola vez)
        const hashedPassword = await bcrypt.hash(GENERIC_PASSWORD, 10);

        let createdUsers = 0;
        let createdPersonal = 0;
        let skipped = 0;
        let errors = 0;

        for (const row of data) {
            try {
                const email = row['Correo EANA'];
                const nombre = row['Nombres'] || row['Nombre'];
                const apellido = row['Apellidos'];
                const cargo = row['Cargo'];
                const departamento = row['Departamento'];
                const aeropuertoCodigo = row['id AP: OACI'];

                if (!email || !email.includes('@')) {
                    skipped++;
                    continue;
                }

                // Extraer username del email (parte antes del @)
                const username = email.split('@')[0].toLowerCase();

                // Determinar rol según cargo
                let role = 'TECNICO';
                if (cargo && (cargo.includes('Jefe') || cargo.includes('JEFE'))) {
                    role = 'CNS_NACIONAL';
                } else if (cargo && cargo.includes('Coordinador')) {
                    role = 'JEFE_COORDINADOR';
                }

                // Buscar aeropuerto
                let aeropuerto = null;
                if (aeropuertoCodigo) {
                    aeropuerto = await prisma.aeropuerto.findFirst({
                        where: { codigo: aeropuertoCodigo }
                    });
                }

                // Buscar o crear puesto
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

                // Buscar usuario existente por email
                let user = await prisma.user.findUnique({
                    where: { email: username }, // Usar username como email
                    include: { personal: true }
                });

                if (!user) {
                    // Crear usuario con username (sin @eana.com.ar)
                    user = await prisma.user.create({
                        data: {
                            email: username, // Solo el username
                            password: hashedPassword,
                            role
                        }
                    });
                    createdUsers++;
                }

                // Crear o actualizar personal
                if (!user.personal) {
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
                    createdPersonal++;
                    console.log(`✅ ${username} - ${nombre} ${apellido} (${sector})`);
                }

            } catch (error) {
                console.error(`❌ Error procesando: ${row['Correo EANA']}`, error.message);
                errors++;
            }
        }

        console.log(`\n📊 Resumen:`);
        console.log(`   ✅ Usuarios creados: ${createdUsers}`);
        console.log(`   ✅ Personal creado: ${createdPersonal}`);
        console.log(`   ⚠️  Omitidos (sin email): ${skipped}`);
        console.log(`   ❌ Errores: ${errors}`);
        console.log(`   📄 Total procesados: ${data.length}`);

        console.log(`\n✅ Importación completada!`);
        console.log(`\n🔐 CREDENCIALES:`);
        console.log(`   Usuario: [username sin @eana.com.ar]`);
        console.log(`   Ejemplo: ppayero`);
        console.log(`   Contraseña: ${GENERIC_PASSWORD}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

loadPersonalCNS();
