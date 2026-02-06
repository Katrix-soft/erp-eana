
require('dotenv').config();
// No podemos usar genAI.listModels directamente porque la librería wrapper quizás no lo expone fácil en la versión instalada.
// Haremos un fetch directo REST para ver qué devuelve Google.

async function checkModels() {
    const key = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

    console.log('🔍 Consultando modelos disponibles...');

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log('✅ Modelos Disponibles:');
            data.models.forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')) {
                    console.log(` - ${m.name}`);
                }
            });
        } else {
            console.log('⚠️ Error en respuesta:', JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error('❌ Error de red:', e);
    }
}

checkModels();
