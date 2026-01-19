const axios = require('axios');

async function testEquiposEndpoint() {
    try {
        console.log('🔐 Login...');

        // Login
        const loginRes = await axios.post('http://localhost:3000/api/v1/auth/login', {
            email: 'admin@eana.com',
            password: 'admin1234'
        });

        const token = loginRes.data.access_token;
        console.log('✅ Token obtenido\n');

        // Get equipos
        console.log('📡 Obteniendo equipos...');
        const equiposRes = await axios.get('http://localhost:3000/api/v1/equipos', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const equipos = equiposRes.data;
        console.log(`✅ Total equipos: ${equipos.length}\n`);

        if (equipos.length > 0) {
            const eq = equipos[0];
            console.log('🔧 Primer Equipo (estructura completa):');
            console.log(JSON.stringify(eq, null, 2));
        } else {
            console.log('❌ NO HAY EQUIPOS');
        }

    } catch (error) {
        if (error.response) {
            console.error('❌ Error Response:', error.response.status, error.response.data);
        } else {
            console.error('❌ Error:', error.message);
        }
    }
}

testEquiposEndpoint();
