
const axios = require('axios');

async function testRoutes() {
    // 1. Check Users (expect 401)
    try {
        console.log('Testing Users Route (expect 401)...');
        await axios.get('http://localhost:3000/api/v1/users');
        console.log('Users: 200 (Unexpected without auth)');
    } catch (e) {
        console.log('Users Status:', e.response ? e.response.status : e.message);
    }

    // 2. Check AI Assistant (expect 401 if present, 404 if missing)
    try {
        console.log('Testing AI Chat Route...');
        await axios.post('http://localhost:3000/api/v1/ai-assistant/chat', {});
    } catch (e) {
        console.log('AI Chat Status:', e.response ? e.response.status : e.message);
    }
}

testRoutes();
