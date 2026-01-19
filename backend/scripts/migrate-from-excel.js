const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
const GENERIC_PASSWORD = 'Eana2025';

async function migrateFromExcel() {
    try {
        console.log('📊 MIGRACIÓN COMPLETA DESDE EXCEL\n');
        console.log('═══════════════════════════════════════════════════════════════\n');

        // PASO 1: Leer Excel
        console.log('📄 PASO 1: Leyendo archivo Excel...\n');
        const filePath = path.join(__dirname, '../../Personal_CNSE_Nacional.xlsx');
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`   ✅ ${data.length} registros encontrados\n`);

        // Mostrar columnas disponibles
        if (data.length > 0) {
            console.log('📋 Columnas disponibles:');
            Object.keys(data[0]).forEach(col => console.log(`   - ${col}`));
            console.log();
        }

        // PASO 2: Limpiar datos existentes
        console.log('🗑️  PASO 2: Limpiando datos existentes...\n');
        await prisma.personal.deleteMany({});
        await prisma.user.deleteMany({ where: { NOT: { email: 'admin@eana.com.ar' } } });
        await prisma.puestoPersonal.deleteMany({});
        console.log('   ✅ Limpieza completada\n');

        // PASO 3: Hashear contraseña
        console.log('🔐 PASO 3: Generando hash de contraseña...\n');
        const hashedPassword = await bcrypt.hash(GENERIC_PASSWORD, 10);
        console.log(`   ✅ Contraseña: ${GENERIC_PASSWORD}\n`);

        // PASO 4: Obtener aeropuertos y FIRs
        const aeropuertos = await prisma.aeropuerto.findMany({ include: { fir: true } });
        const aeropuertoMap = {};
        aeropuertos.forEach(a => {
            aeropuertoMap[a.codigo] = a;
        });

        // Mapeo de códigos FIR a aeropuertos principales
        const firToAirport = {
            'EZE': aeropuertoMap['EZE'],
            'CBA': aeropuertoMap['CBA'],
            'CRV': aeropuertoMap['CRV'],
            'MDZ': aeropuertoMap['MDZ'],
            'RGL': aeropuertoMap['RGL'],
            'USH': aeropuertoMap['USH'],
            'RES': aeropuertoMap['RES'],
        };

        // Cache de puestos
        const puestosCache = {};

        // PASO 5: Importar datos
        console.log('📥 PASO 4: Importando personal...\n');

        let created = 0;
        let skipped = 0;
        let errors = 0;

        for (const row of data) {
            try {
                // Obtener campos del Excel
                const email = row['Correo EANA'];
                const nombre = row['Nombres'] || row['Nombre'];
                const apellido = row['Apellidos'];
                const cargo = row['Cargo'];
                const departamento = row['Departamento'];
                const sitio = row['Sitio'];
                const firCode = row['FIR'];

                // Validar email
                if (!email || !email.includes('@')) {
                    skipped++;
                    continue;
                }

                const username = email.split('@')[0].toLowerCase();

                // Determinar rol según cargo
                let role = 'TECNICO';
                if (cargo) {
                    if (cargo.includes('Jefe Regional')) {
                        role = 'CNS_NACIONAL';
                    } else if (cargo.includes('Coordinador') || cargo.includes('Jefe Departamento') || cargo.includes('Jefe')) {
                        role = 'JEFE_COORDINADOR';
                    }
                }

                // Buscar o crear puesto (usando CARGO exacto del Excel)
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

                // Determinar aeropuerto por FIR (usando Sitio del Excel)
                let aeropuertoId = null;
                if (firCode && firToAirport[firCode]) {
                    aeropuertoId = firToAirport[firCode].id;
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
                console.error(`   ❌ Error con ${row['Correo EANA']}: ${error.message}`);
                errors++;
            }
        }

        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('                    ✅ MIGRACIÓN COMPLETADA');
        console.log('═══════════════════════════════════════════════════════════════\n');
        console.log(`   Creados: ${created}`);
        console.log(`   Omitidos: ${skipped}`);
        console.log(`   Errores: ${errors}`);
        console.log(`   Total: ${data.length}\n`);
        console.log(`   Puestos únicos: ${Object.keys(puestosCache).length}\n`);

        // Verificación
        console.log('🔍 VERIFICACIÓN:\n');

        const testUsers = ['ppayero@eana.com.ar', 'mquatrano@eana.com.ar'];

        for (const email of testUsers) {
            const user = await prisma.user.findUnique({
                where: { email },
                include: {
                    personal: {
                        include: {
                            aeropuerto: { include: { fir: true } },
                            puesto: true
                        }
                    }
                }
            });

            if (user?.personal) {
                console.log(`   👤 ${user.personal.nombre} ${user.personal.apellido}`);
                console.log(`   📧 ${email}`);
                console.log(`   🏢 Cargo: ${user.personal.puesto?.nombre || 'N/A'}`);
                console.log(`   ✈️  Aeropuerto: ${user.personal.aeropuerto?.nombre || 'N/A'} (${user.personal.aeropuerto?.codigo || 'N/A'})`);
                console.log(`   🌍 FIR: ${user.personal.aeropuerto?.fir?.nombre || 'N/A'}`);
                console.log(`   🎭 Rol: ${user.role}\n`);
            }
        }

        console.log('═══════════════════════════════════════════════════════════════\n');
        console.log('🔐 CREDENCIALES:\n');
        console.log('   Usuario: [username]');
        console.log('   Ejemplo: ppayero');
        console.log(`   Contraseña: ${GENERIC_PASSWORD}\n`);
        console.log('═══════════════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Error fatal:', error);
    } finally {
        await prisma.$disconnect();
    }
}

migrateFromExcel();
