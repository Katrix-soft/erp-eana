import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiService {
    private readonly logger = new Logger(GeminiService.name);
    private genAI: GoogleGenerativeAI;

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
        } else {
            this.logger.warn('GEMINI_API_KEY not found in configuration');
        }
    }

    async analyzeVorCurve(data: any[]): Promise<string> {
        if (!this.genAI) {
            return 'Servicio de IA no configurado. Verifique la clave API.';
        }

        try {
            const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

            const prompt = `
        Actúa como un experto en Radioayudas (CNS) y Sistemas de Navegación Aérea de EANA.
        Analiza los siguientes datos de una Curva de Error de VOR Distribuida.
        
        Datos de medición (Azimut vs Error Medido):
        ${JSON.stringify(data, null, 2)}

        Instrucciones:
        1. Tu objetivo es ANALIZAR y APOYAR al técnico, NO decidir por él.
        2. Identifica tendencias (errores cuadrantales, octantales, o sistemáticos).
        3. Sugiere posibles causas si el error supera los límites estándar (tipicamente +/- 2.0 grados para VOR).
        4. Recomienda puntos de verificación o ajustes de fase si es necesario.
        5. Mantén un tono profesional, técnico y colaborativo.
        6. Responde en español de forma concisa.
        
        Formato de respuesta:
        - Resumen de situación
        - Análisis de tendencia
        - Sugerencias Técnicas (Support only)
      `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            this.logger.error('Error calling Gemini API:', error);
            return 'Ocurrió un error al procesar el análisis con IA.';
        }
    }
}
