const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const fs = require('fs');

const prisma = new PrismaClient();

async function verifyAndExportCredentials() {
    try {
        console.log('🔍 Verificando credenciales en la base de datos...\n');

        // Obtener todos los usuarios
        const users = await prisma.user.findMany({
            include: {
                personal: {
                    include: {
                        puesto: true,
                        aeropuerto: true
                    }
                }
            },
            orderBy: {
                email: 'asc'
            }
        });

        console.log(`📄 Total de usuarios encontrados: ${users.length}\n`);

        // Verificar contraseña para cada usuario
        const PASSWORD = 'Eana2025';
        const validUsers = [];
        const invalidUsers = [];

        for (const user of users) {
            const isValid = await bcrypt.compare(PASSWORD, user.password);

            if (isValid) {
                validUsers.push({
                    email: user.email,
                    username: user.email.split('@')[0],
                    password: PASSWORD,
                    role: user.role,
                    nombre: user.personal?.nombre || 'N/A',
                    apellido: user.personal?.apellido || 'N/A',
                    sector: user.personal?.sector || 'N/A',
                    puesto: user.personal?.puesto?.nombre || 'N/A',
                    aeropuerto: user.personal?.aeropuerto?.nombre || 'N/A'
                });
            } else {
                invalidUsers.push(user.email);
            }
        }

        console.log(`✅ Usuarios con contraseña válida: ${validUsers.length}`);
        console.log(`❌ Usuarios con contraseña inválida: ${invalidUsers.length}\n`);

        // Generar archivo de texto
        let txtContent = '═══════════════════════════════════════════════════════════════\n';
        txtContent += '           CREDENCIALES VÁLIDAS - SISTEMA CNS/EANA\n';
        txtContent += '═══════════════════════════════════════════════════════════════\n\n';
        txtContent += `Total de usuarios: ${validUsers.length}\n`;
        txtContent += `Contraseña genérica: ${PASSWORD}\n\n`;
        txtContent += '───────────────────────────────────────────────────────────────\n\n';

        // Agrupar por rol
        const byRole = {};
        validUsers.forEach(u => {
            if (!byRole[u.role]) byRole[u.role] = [];
            byRole[u.role].push(u);
        });

        Object.keys(byRole).forEach(role => {
            txtContent += `\n━━━ ${role} (${byRole[role].length} usuarios) ━━━\n\n`;

            byRole[role].forEach((u, i) => {
                txtContent += `${i + 1}. ${u.nombre} ${u.apellido}\n`;
                txtContent += `   Usuario: ${u.username}\n`;
                txtContent += `   Email: ${u.email}\n`;
                txtContent += `   Contraseña: ${u.password}\n`;
                txtContent += `   Sector: ${u.sector}\n`;
                txtContent += `   Puesto: ${u.puesto}\n`;
                txtContent += `   Aeropuerto: ${u.aeropuerto}\n`;
                txtContent += `   ───────────────────────────────────────\n`;
            });
        });

        txtContent += '\n\n═══════════════════════════════════════════════════════════════\n';
        txtContent += '                    INSTRUCCIONES DE USO\n';
        txtContent += '═══════════════════════════════════════════════════════════════\n\n';
        txtContent += '1. Ir a: http://localhost:3001/login\n\n';
        txtContent += '2. Ingresar credenciales de dos formas:\n\n';
        txtContent += '   OPCIÓN A - Solo username:\n';
        txtContent += '   Usuario: ppayero\n';
        txtContent += '   Contraseña: Eana2025\n\n';
        txtContent += '   OPCIÓN B - Email completo:\n';
        txtContent += '   Usuario: ppayero@eana.com.ar\n';
        txtContent += '   Contraseña: Eana2025\n\n';
        txtContent += '3. Click en "Ingresar"\n\n';
        txtContent += '═══════════════════════════════════════════════════════════════\n';

        // Guardar archivo de texto
        const txtPath = 'CREDENCIALES_VALIDAS.txt';
        fs.writeFileSync(txtPath, txtContent, 'utf-8');
        console.log(`✅ Archivo de texto creado: ${txtPath}\n`);

        // Generar CSV para Excel
        let csvContent = 'Usuario,Email,Contraseña,Nombre,Apellido,Rol,Sector,Puesto,Aeropuerto\n';
        validUsers.forEach(u => {
            csvContent += `${u.username},${u.email},${u.password},"${u.nombre}","${u.apellido}",${u.role},${u.sector},"${u.puesto}","${u.aeropuerto}"\n`;
        });

        const csvPath = 'CREDENCIALES_VALIDAS.csv';
        fs.writeFileSync(csvPath, csvContent, 'utf-8');
        console.log(`✅ Archivo CSV creado: ${csvPath}\n`);

        // Mostrar algunos ejemplos
        console.log('📋 EJEMPLOS DE CREDENCIALES VÁLIDAS:\n');
        validUsers.slice(0, 10).forEach((u, i) => {
            console.log(`${i + 1}. Usuario: ${u.username} | Contraseña: ${u.password}`);
            console.log(`   Nombre: ${u.nombre} ${u.apellido} (${u.role})\n`);
        });

        console.log('\n🎯 PRUEBA ESTAS CREDENCIALES:\n');
        console.log('   Usuario: admin@eana.com.ar');
        console.log('   Contraseña: admin1234\n');
        console.log('   Usuario: ppayero@eana.com.ar');
        console.log('   Contraseña: Eana2025\n');

        if (invalidUsers.length > 0) {
            console.log(`\n⚠️  USUARIOS CON CONTRASEÑA DIFERENTE (${invalidUsers.length}):`);
            invalidUsers.slice(0, 5).forEach(email => console.log(`   - ${email}`));
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyAndExportCredentials();
