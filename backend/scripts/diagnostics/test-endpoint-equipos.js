const axios = require('axios');

async function testEndpoint() {
    try {
        // 1. Login para obtener token
        console.log('🔐 Haciendo login...');
        const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
            email: 'comunicacion@eana.com',
            password: 'comunicacion1234'
        });

        const token = loginResponse.data.access_token;
        console.log('✅ Token obtenido\n');

        // 2. Obtener equipos
        console.log('📡 Obteniendo equipos...');
        const equiposResponse = await axios.get('http://localhost:3000/api/v1/equipos', {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            params: {
                aeropuerto: 'EZE'
            }
        });

        const equipos = equiposResponse.data;
        console.log(`✅ Total equipos: ${equipos.length}\n`);

        if (equipos.length > 0) {
            const equipo = equipos[0];
            console.log('🔧 Primer Equipo:');
            console.log(JSON.stringify(equipo, null, 2));

            console.log('\n📊 Análisis:');
            console.log(`   ID: ${equipo.id}`);
            console.log(`   Marca: ${equipo.marca}`);
            console.log(`   Modelo: ${equipo.modelo}`);
            console.log(`   Canales: ${equipo.canales?.length || 0}`);

            if (equipo.canales && equipo.canales.length > 0) {
                const canal = equipo.canales[0];
                console.log(`\n   📻 Primer Canal:`);
                console.log(`      ID: ${canal.id}`);
                console.log(`      Nombre: ${canal.canal}`);
                console.log(`      Frecuencias: ${canal.frecuencias?.length || 0}`);

                if (canal.frecuencias && canal.frecuencias.length > 0) {
                    const freq = canal.frecuencias[0];
                    console.log(`\n      📡 Primera Frecuencia:`);
                    console.log(`         ID: ${freq.id}`);
                    console.log(`         Valor: ${freq.frecuencia} MHz`);
                } else {
                    console.log('\n      ❌ NO HAY FRECUENCIAS EN EL CANAL');
                }
            } else {
                console.log('\n   ❌ NO HAY CANALES EN EL EQUIPO');
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testEndpoint();
