const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function loadPersonalCNS() {
    try {
        console.log('👥 Cargando Personal CNS desde Excel...\n');

        // Leer el archivo Excel
        const filePath = path.join(__dirname, '../../Personal CNS Nacional.xlsx');
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`📄 Total de filas: ${data.length}\n`);

        let createdCount = 0;
        let updatedCount = 0;
        let errorCount = 0;

        for (const row of data) {
            try {
                // Extraer datos (ajusta los nombres de columnas según tu Excel)
                const email = row['Email'] || row['Correo'] || row['email'];
                const nombre = row['Nombre'] || row['nombre'];
                const apellido = row['Apellido'] || row['apellido'];
                const sector = row['Sector'] || row['sector'];
                const puestoNombre = row['Puesto'] || row['puesto'];
                const aeropuertoCodigo = row['Aeropuerto'] || row['aeropuerto'];

                if (!email) {
                    console.log('⚠️  Fila sin email, omitiendo...');
                    continue;
                }

                // Buscar o crear puesto
                let puesto = await prisma.puestoPersonal.findFirst({
                    where: { nombre: puestoNombre }
                });

                if (!puesto && puestoNombre) {
                    puesto = await prisma.puestoPersonal.create({
                        data: { nombre: puestoNombre }
                    });
                }

                // Buscar aeropuerto
                let aeropuerto = null;
                if (aeropuertoCodigo) {
                    aeropuerto = await prisma.aeropuerto.findFirst({
                        where: { codigo: aeropuertoCodigo }
                    });
                }

                // Buscar o crear usuario
                let user = await prisma.user.findUnique({
                    where: { email },
                    include: { personal: true }
                });

                if (!user) {
                    // Crear usuario nuevo
                    const password = await bcrypt.hash('eana1234', 10);
                    user = await prisma.user.create({
                        data: {
                            email,
                            password,
                            role: sector === 'ADMIN' ? 'ADMIN' : 'TECNICO'
                        }
                    });
                    createdCount++;
                }

                // Crear o actualizar personal
                if (user.personal) {
                    await prisma.personal.update({
                        where: { id: user.personal.id },
                        data: {
                            nombre,
                            apellido,
                            sector,
                            puestoId: puesto?.id,
                            aeropuertoId: aeropuerto?.id
                        }
                    });
                    updatedCount++;
                } else {
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
                    createdCount++;
                }

                console.log(`✅ ${nombre} ${apellido} - ${email}`);

            } catch (error) {
                console.error(`❌ Error procesando fila:`, error.message);
                errorCount++;
            }
        }

        console.log(`\n📊 Resumen:`);
        console.log(`   ✅ Creados: ${createdCount}`);
        console.log(`   🔄 Actualizados: ${updatedCount}`);
        console.log(`   ❌ Errores: ${errorCount}`);
        console.log(`   📄 Total procesados: ${data.length}`);

        console.log('\n✅ Importación completada!');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

loadPersonalCNS();
