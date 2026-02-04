
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
    console.log('🔌 Re-intentando con modelo estándar (gemini-pro)...');

    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);

    // Intentamos con gemini-pro que es el más compatible
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    try {
        console.log('📡 Enviando ping...');
        const result = await model.generateContent("Hola");
        const response = await result.response;

        console.log('✅ ÉXITO CON GEMINI-PRO');
        console.log('Respuesta:', response.text());

    } catch (error) {
        console.error('❌ Error con gemini-pro:', error.message);

        // Intento fallback
        console.log('🔄 Probando fallback a gemini-1.0-pro...');
        try {
            const model2 = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
            const result2 = await model2.generateContent("Hola");
            console.log('✅ ÉXITO CON GEMINI-1.0-PRO');
        } catch (e) {
            console.error('❌ Falló todo:', e.message);
        }
    }
}

testGemini();
