
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
    const key = process.env.GEMINI_API_KEY;
    console.log('Key:', key);

    if (!key) return;

    try {
        const genAI = new GoogleGenerativeAI(key);
        // Try listing models if possible, or just catch error
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        console.log('Sending prompt...');
        const result = await model.generateContent("Hola");
        console.log('Response:', result.response.text());
    } catch (e) {
        console.error('FULL ERROR:', e);
    }
}

testGemini();
