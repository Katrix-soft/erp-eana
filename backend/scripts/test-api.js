
const axios = require('axios');

async function testVigilancia() {
    try {
        console.log('Logging in...');
        const loginRes = await axios.post('http://localhost:3000/api/v1/auth/login', {
            email: 'asanchez@eana.com.ar',
            password: 'Eana2024!'
        });

        const token = loginRes.data.access_token;
        console.log('Login successful. Token acquired.');
        console.log('User Context:', JSON.stringify(loginRes.data.user.context, null, 2));

        console.log('\nFetching Vigilancia...');
        const vigRes = await axios.get('http://localhost:3000/api/v1/vigilancia', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Vigilancia Results count:', vigRes.data.length);
        if (vigRes.data.length > 0) {
            vigRes.data.forEach(v => {
                console.log(`- ID: ${v.id}, Ubicacion: ${v.ubicacion}, AeroId: ${v.aeropuertoId}`);
            });
        } else {
            console.log('No results returned from API.');
        }
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

testVigilancia();
