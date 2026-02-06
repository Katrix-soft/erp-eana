
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
    console.log('🔌 Iniciando prueba de conexión con Gemini AI...');

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error('❌ ERROR: No se encontró GEMINI_API_KEY en el archivo .env');
        return;
    }

    console.log(`🔑 API Key detectada: ${apiKey.substring(0, 8)}...`);

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = "Responde solo con: '¡Conexión Exitosa con EANA!' si me lees.";

        console.log('📡 Enviando mensaje de prueba a Google...');
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('\n✅ RESPUESTA RECIBIDA DE LA IA:');
        console.log('-----------------------------');
        console.log(text);
        console.log('-----------------------------');
        console.log('✨ La API funciona perfectamente.');

    } catch (error) {
        console.error('\n❌ FALLÓ LA CONEXIÓN:');
        console.error(error.message);
        if (error.message.includes('API key not valid')) {
            console.error('⚠️  Tu API Key parece incorrecta o expirada.');
        }
    }
}

testGemini();
