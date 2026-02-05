import axios from 'axios';

async function testLogin() {
    try {
        const response = await axios.post('http://localhost:3000/api/v1/auth/login', {
            email: 'igsanchez@eana.com.ar',
            password: '37521544'
        });
        console.log('✅ LOGIN EXITOSO:', response.data.user.email);
        console.log('Token:', response.data.access_token.substring(0, 20) + '...');
    } catch (error: any) {
        console.error('❌ ERROR DE LOGIN:', error.response?.data || error.message);
    }
}

testLogin();
