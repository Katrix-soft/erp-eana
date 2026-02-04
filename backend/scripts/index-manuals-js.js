
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const MANUALS_DIR = path.join(process.cwd(), 'manuals');
const OUTPUT_FILE = path.join(process.cwd(), 'data', 'knowledge.json');

async function indexManuals() {
    console.log('🚀 Iniciando indexación de manuales...');

    if (!fs.existsSync(MANUALS_DIR)) {
        console.error(`❌ Directorio no encontrado: ${MANUALS_DIR}`);
        return;
    }

    const files = fs.readdirSync(MANUALS_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));

    if (files.length === 0) {
        console.warn('⚠️ No hay PDFs en la carpeta manuals.');
        return;
    }

    const knowledgeBase = [];

    for (const file of files) {
        console.log(`📄 Procesando: ${file}...`);
        const filePath = path.join(MANUALS_DIR, file);
        const dataBuffer = fs.readFileSync(filePath);

        try {
            const data = await pdf(dataBuffer);

            if (!data || !data.text) {
                console.warn(`⚠️ No se pudo extraer texto de ${file}`);
                continue;
            }

            const text = data.text;

            // Normalizar saltos de línea
            const cleanText = text.replace(/\n\s*\n/g, '\n\n');
            const paragraphs = cleanText.split('\n\n');

            let pageEstimate = 1;

            for (const para of paragraphs) {
                if (para.trim().length < 50) continue; // Ignorar líneas muy cortas

                knowledgeBase.push({
                    source: file,
                    page: pageEstimate,
                    content: para.trim()
                });

                if (para.includes('Page') || para.includes('Página')) pageEstimate++;
            }

        } catch (error) {
            console.error(`❌ Error leyendo ${file}:`, error);
        }
    }

    // Ensure output directory exists
    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(knowledgeBase, null, 2));
    console.log(`✅ Indexación completada. ${knowledgeBase.length} fragmentos guardados en ${OUTPUT_FILE}`);
}

indexManuals();
