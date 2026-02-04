
const axios = require('axios');

async function checkPing() {
    try {
        console.log('Checking /api/v1/ai-assistant/ping...');
        const res = await axios.get('http://localhost:3000/api/v1/ai-assistant/ping');
        console.log('Ping:', res.data);
    } catch (e) {
        console.log('Ping Status:', e.response ? e.response.status : e.message);
    }
}
checkPing();
