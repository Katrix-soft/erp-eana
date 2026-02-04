
import * as dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function testGemini() {
    console.log('--- Testing Gemini API Integration (Prefix Check) ---');
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return;

    const genAI = new GoogleGenerativeAI(apiKey);

    const modelsToTry = [
        'models/gemini-1.5-flash',
        'gemini-1.5-flash'
    ];

    for (const modelName of modelsToTry) {
        console.log(`\n🤖 Testing: ${modelName}`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello");
            console.log(`✅ SUCCESS: ${modelName}`);
        } catch (error: any) {
            console.error(`❌ FAILED: ${modelName} -> ${error.message}`);
        }
    }
}

testGemini();
