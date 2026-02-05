const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function seedBasicData() {
    try {
        console.log('🌱 Creando datos básicos...\n');

        // 1. Crear FIR
        let firEze = await prisma.fir.findFirst({
            where: { nombre: 'FIR Ezeiza' }
        });

        if (!firEze) {
            firEze = await prisma.fir.create({
                data: {
                    nombre: 'FIR Ezeiza',
                }
            });
            console.log('✅ FIR creado:', firEze.nombre);
        } else {
            console.log('ℹ️  FIR ya existe:', firEze.nombre);
        }

        // 2. Crear Aeropuerto
        let aeropuerto = await prisma.aeropuerto.findFirst({
            where: { codigo: 'EZE' }
        });

        if (!aeropuerto) {
            aeropuerto = await prisma.aeropuerto.create({
                data: {
                    codigo: 'EZE',
                    nombre: 'Aeropuerto Internacional Ezeiza',
                    firId: firEze.id,
                }
            });
            console.log('✅ Aeropuerto creado:', aeropuerto.nombre);
        } else {
            console.log('ℹ️  Aeropuerto ya existe:', aeropuerto.nombre);
        }

        // 3. Crear Puesto
        let puesto = await prisma.puestoPersonal.findFirst({
            where: { nombre: 'Técnico' }
        });

        if (!puesto) {
            puesto = await prisma.puestoPersonal.create({
                data: {
                    nombre: 'Técnico',
                }
            });
            console.log('✅ Puesto creado:', puesto.nombre);
        } else {
            console.log('ℹ️  Puesto ya existe:', puesto.nombre);
        }

        console.log('\n✅ Datos básicos verificados/creados exitosamente');
        console.log('\n📊 Resumen:');
        console.log(`   FIR: ${firEze.nombre}`);
        console.log(`   Aeropuerto: ${aeropuerto.nombre}`);
        console.log(`   Puesto: ${puesto.nombre}`);

        console.log('\n🔄 Ahora recarga la página en el navegador');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedBasicData();
