
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGeminiPro() {
    const key = process.env.GEMINI_API_KEY;
    console.log('Testing key with gemini-pro...');

    if (!key) {
        console.log('No key found');
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        console.log('Sending prompt to gemini-pro...');
        const result = await model.generateContent("Hola");
        const response = await result.response;
        console.log('Response:', response.text());
        console.log('SUCCESS');
    } catch (e) {
        console.error('ERROR:', e.message);
        if (e.response) {
            console.error('Status:', e.response.status);
            console.error('StatusText:', e.response.statusText);
        }
    }
}

testGeminiPro();
