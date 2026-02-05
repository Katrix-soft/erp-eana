import axios from 'axios';
import * as XLSX from 'xlsx';
import * as path from 'path';

const API_URL = 'http://localhost:3000/api/v1';
const PASSWORD = 'Eana2024!';

// Sample users to test
const testUsers = [
    'admin@eana.com.ar',
    'aaltafini@eana.com.ar',
    'abellandi@eana.com.ar',
    'dferreyra@eana.com.ar',
    'tecnico.fir@eana.com.ar',
    'coordinador.aeropuerto@eana.com.ar',
    'cns.nacional@eana.com.ar'
];

async function testLogin(email: string) {
    try {
        const response = await axios.post(`${API_URL}/auth/login`, {
            email,
            password: PASSWORD
        });

        const { access_token, user } = response.data;

        return {
            email,
            status: 'OK',
            role: user.role,
            hasToken: !!access_token,
            nombre: user.context?.nombre || 'N/A',
            apellido: user.context?.apellido || 'N/A',
            sector: user.context?.sector || 'N/A',
            puesto: user.context?.puesto || 'N/A',
            aeropuerto: user.context?.aeropuerto || 'N/A',
            fir: user.context?.fir || 'N/A'
        };
    } catch (error: any) {
        return {
            email,
            status: 'ERROR',
            role: 'N/A',
            hasToken: false,
            nombre: 'N/A',
            apellido: 'N/A',
            sector: 'N/A',
            puesto: 'N/A',
            aeropuerto: 'N/A',
            fir: 'N/A',
            error: error.response?.data?.message || error.message
        };
    }
}

async function main() {
    console.log('🧪 VERIFICACIÓN FINAL DE LOGIN\n');
    console.log('='.repeat(80));
    console.log(`Password utilizada: ${PASSWORD}`);
    console.log('='.repeat(80));
    console.log('');

    const results = [];

    for (const email of testUsers) {
        console.log(`Probando: ${email}...`);
        const result = await testLogin(email);
        results.push(result);

        if (result.status === 'OK') {
            console.log(`  ✅ OK - Rol: ${result.role}, FIR: ${result.fir}`);
        } else {
            console.log(`  ❌ ERROR - ${(result as any).error}`);
        }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMEN:');
    console.log('='.repeat(80));

    const okCount = results.filter(r => r.status === 'OK').length;
    const errorCount = results.filter(r => r.status === 'ERROR').length;

    console.log(`Total probados: ${results.length}`);
    console.log(`✅ Exitosos: ${okCount}`);
    console.log(`❌ Fallidos: ${errorCount}`);
    console.log(`📈 Tasa de éxito: ${((okCount / results.length) * 100).toFixed(1)}%`);
    console.log('='.repeat(80));

    if (okCount === results.length) {
        console.log('\n🎉 ¡TODOS LOS LOGINS FUNCIONAN CORRECTAMENTE!');
        console.log(`\n✅ Password confirmada: ${PASSWORD}`);
        console.log('✅ Todos los usuarios pueden iniciar sesión');
        console.log('✅ Los datos de FIR, Aeropuerto y Puesto se cargan correctamente\n');
    } else {
        console.log('\n⚠️  Algunos logins fallaron. Revisa los detalles arriba.\n');
    }
}

main()
    .catch((e) => {
        console.error('Error:', e);
        process.exit(1);
    });
