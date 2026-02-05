
import axios from 'axios';
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3000/api/v1';

// Contraseñas comunes a probar
const commonPasswords = [
    'Eana2024!',
    'Test2024!',
    'Admin2024!',
    'Password123!',
    'Eana123!'
];

async function testLogin(email: string, password: string) {
    try {
        const response = await axios.post(`${API_URL}/auth/login`, {
            email,
            password
        });

        const { access_token, user: userData } = response.data;

        return {
            success: true,
            email,
            password,
            role: userData.role,
            hasToken: !!access_token,
            context: userData.context
        };
    } catch (error: any) {
        return {
            success: false,
            email,
            password,
            error: error.response?.data?.message || error.message
        };
    }
}

async function main() {
    console.log('🔍 Obteniendo todos los usuarios de la base de datos...\n');

    // Get all users with their personal data
    const users = await prisma.user.findMany({
        include: {
            personal: {
                include: {
                    aeropuerto: { include: { fir: true } },
                    fir: true,
                    puesto: true
                }
            }
        },
        orderBy: {
            email: 'asc'
        }
    });

    console.log(`📊 Total de usuarios encontrados: ${users.length}\n`);

    const results = [];

    for (const user of users) {
        console.log(`\n🧪 Probando usuario: ${user.email}`);
        console.log(`   Rol: ${user.role}`);

        if (user.personal) {
            console.log(`   Personal: ${user.personal.nombre} ${user.personal.apellido}`);
            console.log(`   Sector: ${user.personal.sector}`);
            console.log(`   Aeropuerto: ${user.personal.aeropuerto?.nombre || 'N/A'}`);
            console.log(`   FIR: ${user.personal.fir?.nombre || user.personal.aeropuerto?.fir?.nombre || 'N/A'}`);
        }

        let loginSuccess = false;
        let workingPassword = '';

        // Try each common password
        for (const password of commonPasswords) {
            const result = await testLogin(user.email, password);

            if (result.success) {
                loginSuccess = true;
                workingPassword = password;
                console.log(`   ✅ Login exitoso con password: ${password}`);

                results.push({
                    estado: 'OK',
                    email: user.email,
                    password: password,
                    rol: user.role,
                    nombre: user.personal?.nombre || 'N/A',
                    apellido: user.personal?.apellido || 'N/A',
                    sector: user.personal?.sector || 'N/A',
                    puesto: user.personal?.puesto?.nombre || 'N/A',
                    aeropuerto: user.personal?.aeropuerto?.nombre || 'N/A',
                    firDirecto: user.personal?.fir?.nombre || 'N/A',
                    firHeredado: user.personal?.aeropuerto?.fir?.nombre || 'N/A',
                    firFinal: user.personal?.fir?.nombre || user.personal?.aeropuerto?.fir?.nombre || 'N/A',
                    hasToken: 'SI',
                    error: ''
                });

                break;
            }
        }

        if (!loginSuccess) {
            console.log(`   ❌ No se pudo hacer login con ninguna contraseña común`);
            results.push({
                estado: 'ERROR',
                email: user.email,
                password: 'DESCONOCIDA',
                rol: user.role,
                nombre: user.personal?.nombre || 'N/A',
                apellido: user.personal?.apellido || 'N/A',
                sector: user.personal?.sector || 'N/A',
                puesto: user.personal?.puesto?.nombre || 'N/A',
                aeropuerto: user.personal?.aeropuerto?.nombre || 'N/A',
                firDirecto: user.personal?.fir?.nombre || 'N/A',
                firHeredado: user.personal?.aeropuerto?.fir?.nombre || 'N/A',
                firFinal: user.personal?.fir?.nombre || user.personal?.aeropuerto?.fir?.nombre || 'N/A',
                hasToken: 'NO',
                error: 'Contraseña no encontrada en las comunes'
            });
        }
    }

    console.log('\n\n📊 Generando archivo Excel con todos los resultados...\n');

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Prepare data for Excel
    const excelData = results.map(r => ({
        'Estado': r.estado,
        'Email': r.email,
        'Password': r.password,
        'Rol': r.rol,
        'Nombre': r.nombre,
        'Apellido': r.apellido,
        'Sector': r.sector,
        'Puesto': r.puesto,
        'Aeropuerto': r.aeropuerto,
        'FIR Directo': r.firDirecto,
        'FIR Heredado': r.firHeredado,
        'FIR Final': r.firFinal,
        'Token Generado': r.hasToken,
        'Error': r.error
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    ws['!cols'] = [
        { wch: 10 },  // Estado
        { wch: 35 },  // Email
        { wch: 15 },  // Password
        { wch: 20 },  // Rol
        { wch: 15 },  // Nombre
        { wch: 15 },  // Apellido
        { wch: 20 },  // Sector
        { wch: 30 },  // Puesto
        { wch: 40 },  // Aeropuerto
        { wch: 20 },  // FIR Directo
        { wch: 20 },  // FIR Heredado
        { wch: 20 },  // FIR Final
        { wch: 15 },  // Token Generado
        { wch: 40 }   // Error
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Todos los Usuarios');

    // Save to file
    const outputPath = path.join(__dirname, '..', 'pruebas-todos-usuarios.xlsx');
    XLSX.writeFile(wb, outputPath);

    console.log(`✅ Archivo Excel generado: ${outputPath}\n`);

    // Print summary
    const okCount = results.filter(r => r.estado === 'OK').length;
    const errorCount = results.filter(r => r.estado === 'ERROR').length;

    console.log('='.repeat(80));
    console.log('📈 RESUMEN FINAL:');
    console.log('='.repeat(80));
    console.log(`   Total de usuarios: ${results.length}`);
    console.log(`   ✅ Login exitoso: ${okCount}`);
    console.log(`   ❌ Login fallido: ${errorCount}`);
    console.log(`   📊 Tasa de éxito: ${((okCount / results.length) * 100).toFixed(1)}%`);
    console.log('='.repeat(80));

    if (okCount === results.length) {
        console.log('\n🎉 ¡Todos los usuarios pueden hacer login!');
    } else {
        console.log(`\n⚠️  ${errorCount} usuario(s) no pudieron hacer login.`);
        console.log('   Revisa el archivo Excel para ver cuáles.');
    }

    // Print users by role
    console.log('\n📋 USUARIOS POR ROL:');
    console.log('='.repeat(80));

    const roleGroups = results.reduce((acc: any, r) => {
        if (!acc[r.rol]) acc[r.rol] = [];
        acc[r.rol].push(r);
        return acc;
    }, {});

    for (const [role, users] of Object.entries(roleGroups) as [string, any[]][]) {
        const okUsers = users.filter(u => u.estado === 'OK').length;
        console.log(`\n${role}: ${users.length} usuarios (${okUsers} OK, ${users.length - okUsers} ERROR)`);
        users.forEach(u => {
            const status = u.estado === 'OK' ? '✅' : '❌';
            console.log(`   ${status} ${u.email} - ${u.nombre} ${u.apellido}`);
        });
    }

    console.log('\n');
}

main()
    .catch((e) => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
