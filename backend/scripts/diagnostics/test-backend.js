
const axios = require('axios');

async function testBackend() {
    try {
        console.log('Testing Backend Health...');
        const health = await axios.get('http://localhost:3000/health');
        console.log('Health:', health.status);
    } catch (e) {
        console.log('Health Check Failed:', e.message);
    }

    // Try to hit the chat endpoint (will likely fail auth, but we want to see IF it replies)
    try {
        console.log('Testing Chat Endpoint (expecting 401 or response)...');
        await axios.post('http://localhost:3000/api/v1/ai-assistant/chat', {
            messages: [{ role: 'user', content: 'hola' }]
        });
    } catch (e) {
        console.log('Chat Status:', e.response ? e.response.status : e.message);
        if (e.response && e.response.data) console.log('Data:', e.response.data);
    }
}

testBackend();
