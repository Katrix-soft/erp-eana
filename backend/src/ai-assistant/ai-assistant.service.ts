import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, Part, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { GoogleAIFileManager, FileState } from '@google/generative-ai/server';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

import { AiConversation } from './entities/ai-conversation.entity';
import { AiMessage } from './entities/ai-message.entity';
import { CacheService } from '../cache/cache.service';

export interface ChatAttachment {
  mimeType: string;
  data?: string;
  filename?: string;
  path?: string;
}

export interface ChatMessageDto {
  role: 'user' | 'assistant';
  content: string;
  attachment?: ChatAttachment;
}

interface ManualChunk {
  source: string;
  page: number;
  content: string;
}

@Injectable()
export class AiAssistantService implements OnModuleInit {
  private readonly logger = new Logger(AiAssistantService.name);
  private genAI: GoogleGenerativeAI;
  private fileManager: GoogleAIFileManager;

  private readonly UPLOAD_DIR = 'uploads/ai';
  private readonly KNOWLEDGE_FILE = path.join(process.cwd(), 'data', 'knowledge.json');
  private readonly MODEL_NAME = 'gemini-2.0-flash'; // Modelo 2.0 (Preview/Flash) según API Key del usuario

  // 🧠 Base de conocimiento en memoria (RAG Liviano)
  private knowledgeBase: ManualChunk[] = [];

  // ⚙️ Configuración
  private readonly MAX_RETRIES = 3;
  private readonly INITIAL_BACKOFF_MS = 2000;
  private readonly MAX_HISTORY_MESSAGES = 10;

  private readonly SYSTEM_PROMPT = `
Eres el ASISTENTE TÉCNICO VIRTUAL EXPERTO de EANA S.E.
Tu objetivo es ayudar a técnicos ATSEP.

DIRECTRICES:
1. Usa el CONTEXTO TÉCNICO proporcionado (RAG) para responder.
2. Si la respuesta no está en el contexto, indícalo claramente y sugiere qué manual subir.
3. OPCIONES: Si la consulta es vaga (ej: "no anda"), ofrece 3 opciones probables:
   - "1. ¿Te refieres a una falla de energía?"
   - "2. ¿Es un error de comunicación?"
   - "3. ¿Necesitas un procedimiento de reinicio?"
4. Sé conciso y profesional.
`;

  constructor(
    private configService: ConfigService,
    @InjectRepository(AiConversation)
    private conversationRepo: Repository<AiConversation>,
    @InjectRepository(AiMessage)
    private messageRepo: Repository<AiMessage>,
    private cacheService: CacheService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (!apiKey) {
      this.logger.warn('⚠️ GEMINI_API_KEY no configurada');
      return;
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.fileManager = new GoogleAIFileManager(apiKey);

    if (!fs.existsSync(this.UPLOAD_DIR)) {
      fs.mkdirSync(this.UPLOAD_DIR, { recursive: true });
    }
  }

  onModuleInit() {
    this.loadKnowledgeBase();
  }

  private loadKnowledgeBase() {
    if (fs.existsSync(this.KNOWLEDGE_FILE)) {
      try {
        const data = fs.readFileSync(this.KNOWLEDGE_FILE, 'utf-8');
        this.knowledgeBase = JSON.parse(data);
        this.logger.log(`📚 Base de conocimiento cargada: ${this.knowledgeBase.length} fragmentos.`);
      } catch (error) {
        this.logger.error('❌ Error cargando knowledge.json', error);
      }
    } else {
      this.logger.warn(`⚠️ No se encontró la base de conocimientos en ${this.KNOWLEDGE_FILE}`);
    }
  }

  // ===================== LOGIC =====================

  private isTechnicalQuery(query: string): boolean {
    const keywords = ['radar', 'falla', 'mantenimiento', 'procedimiento', 'vor', 'ils', 'dme', 'vhf', 'frecuencia', 'manual', 'error', 'alarma', 'inspeccion', 'drf', 'ups', 'tension'];
    const normalized = query.toLowerCase();
    // Si tiene adjunto, asumimos es técnico
    return keywords.some(k => normalized.includes(k));
  }

  private findRelevantContext(query: string): string {
    if (this.knowledgeBase.length === 0) return '';

    const terms = query.toLowerCase().split(' ').filter(t => t.length > 3);
    if (terms.length === 0) return '';

    // Búsqueda simple por coincidencia de términos (scoring básico)
    const cachedResults = this.knowledgeBase
      .map(chunk => {
        let score = 0;
        const contentLower = chunk.content.toLowerCase();
        terms.forEach(term => {
          if (contentLower.includes(term)) score += 1;
        });
        return { chunk, score };
      })
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5) // Top 5 fragmentos más relevantes
      .map(r => `[Fuente: ${r.chunk.source}] ${r.chunk.content}`)
      .join('\n\n');

    return cachedResults;
  }

  // ===================== CHAT FLOW =====================

  async chat(
    userIdStr: string,
    messages: ChatMessageDto[],
    conversationId?: string,
  ): Promise<{ response: string; conversationId: string }> {
    const userId = Number(userIdStr);
    const lastUserMsg = messages.at(-1);
    const userQuery = lastUserMsg?.content || '';

    // 1️⃣ CACHE & GREETING CHECK (Fast Path)
    // Si no es técnico y es saludo corto, responder rápido
    if (!this.isTechnicalQuery(userQuery) && !lastUserMsg?.attachment) {
      const saludos = ['hola', 'buenos dias', 'buenas tardes', 'gracias'];
      if (saludos.some(s => userQuery.toLowerCase().includes(s))) {
        return this.handleSimpleResponse(userId, conversationId, userQuery, '¡Hola! Soy el asistente técnico de EANA. ¿En qué sistema o procedimiento puedo ayudarte hoy?');
      }
    }

    // Check Redis Cache para preguntas frecuentes exactas
    const cacheKey = `ai:response:${userQuery.trim().toLowerCase()}`;
    const cachedResponse = await this.cacheService.get<string>(cacheKey);
    if (cachedResponse) {
      this.logger.log(`⚡ Respuesta desde Cache Redis: ${userQuery}`);
      return this.handleSimpleResponse(userId, conversationId, userQuery, cachedResponse);
    }

    // 2️⃣ PREPARAR CONTEXTO (RAG)
    let context = '';
    if (this.isTechnicalQuery(userQuery)) {
      context = this.findRelevantContext(userQuery);
      if (context) {
        this.logger.log(`🧠 Contexto encontrado (${context.length} chars)`);
      }
    }

    // 3️⃣ GESTIÓN DE CONVERSACIÓN & ADJUNTOS
    let conversation: AiConversation;
    if (conversationId) {
      conversation = await this.conversationRepo.findOne({ where: { id: conversationId }, relations: ['messages'] });
      if (!conversation) throw new NotFoundException('Conversación no encontrada');
    } else {
      conversation = await this.conversationRepo.save(this.conversationRepo.create({ userId, title: 'Consulta técnica' }));
    }

    // Guardar mensaje usuario
    const msg = this.messageRepo.create({ conversation, role: 'user', content: userQuery });

    // Manejo de Adjunto (Hybrid: File API)
    if (lastUserMsg?.attachment?.data) {
      // ... (Logica de adjuntos igual que antes)
      const filename = `${uuidv4()}_${lastUserMsg.attachment.filename || 'file'} `;
      const filePath = path.join(this.UPLOAD_DIR, filename);
      fs.writeFileSync(filePath, Buffer.from(lastUserMsg.attachment.data, 'base64'));

      try {
        const fileUri = await this.uploadToGemini(filePath, lastUserMsg.attachment.mimeType, lastUserMsg.attachment.filename);
        msg.attachmentFileUri = fileUri;
      } catch (e) { /* Fallback handled later */ }

      msg.hasAttachment = true;
      msg.attachmentPath = filePath.replace(/\\/g, '/');
      msg.attachmentType = lastUserMsg.attachment.mimeType;
      msg.attachmentName = lastUserMsg.attachment.filename;
    }
    await this.messageRepo.save(msg);

    // 4️⃣ LLAMADA A GEMINI
    // Construir historial reducido
    const dbMessages = await this.messageRepo.find({
      where: { conversationId: conversation.id },
      order: { createdAt: 'DESC' },
      take: this.MAX_HISTORY_MESSAGES
    });

    const history = await this.buildGeminiHistory(dbMessages.reverse()); // Helper separado

    // Inyectar contexto RAG en el último mensaje si existe
    if (context) {
      const lastPart = history[history.length - 1].parts.find(p => p.text);
      if (lastPart) {
        lastPart.text = `CONTEXTO TÉCNICO (RAG Local):\n${context}\n\nPREGUNTA USUARIO:\n${lastPart.text}`;
      }
    }

    try {
      const model = this.createModel(this.MODEL_NAME);
      const result = await this.generateContentWithBackoff(model, history);
      const responseText = result.response.text();

      // Guardar respuesta
      await this.messageRepo.save(this.messageRepo.create({ conversation, role: 'assistant', content: responseText }));

      // 5️⃣ CACHE RESULT
      if (this.isTechnicalQuery(userQuery) && responseText.length > 20) {
        await this.cacheService.set(cacheKey, responseText, 3600); // 1 hora
      }

      return { response: responseText, conversationId: conversation.id };

    } catch (error: any) {
      // LOGGING DETALLADO PARA DIAGNÓSTICO
      const errorDetails = {
        message: error.message,
        status: error.status,
        statusText: error.statusText,
        model: this.MODEL_NAME,
        response: error.response ? JSON.stringify(error.response) : 'No response body'
      };
      this.logger.error(`❌ CRITICAL GEMINI ERROR:`, errorDetails);

      // MENSAJE AL USUARIO
      let msg = `⚠️ Error IA: ${error.message} (Status: ${error.status})`;

      if (error.status === 404) msg = `⚠️ Error 404: El modelo ${this.MODEL_NAME} no se encontró o la API Key no es válida.`;
      if (error.status === 429) msg = '⚠️ Error 429: Cuota excedida. Por favor espera un momento.';
      if (error.status === 503) msg = '⚠️ Error 503: Servicio de Google temporalmente no disponible.';

      return { response: msg, conversationId: conversation.id };
    }
  }

  // ===================== PRIVATE HELPERS =====================

  private async handleSimpleResponse(userId: number, conversationId: string | undefined, userQuery: string, responseText: string) {
    // Helper para guardar rápido en DB y devolver
    let conversation: AiConversation;
    if (conversationId) {
      conversation = await this.conversationRepo.findOne({ where: { id: conversationId } });
    } else {
      conversation = await this.conversationRepo.save(this.conversationRepo.create({ userId, title: 'Chat Rápido' }));
    }
    await this.messageRepo.save(this.messageRepo.create({ conversation, role: 'user', content: userQuery }));
    await this.messageRepo.save(this.messageRepo.create({ conversation, role: 'assistant', content: responseText }));
    return { response: responseText, conversationId: conversation.id };
  }

  private async buildGeminiHistory(messages: AiMessage[]): Promise<any[]> {
    // Reconstruye el historial convirtiendo adjuntos a URI o Base64
    return Promise.all(messages.map(async (msg) => {
      const parts: Part[] = [];

      if (msg.hasAttachment) {
        if (msg.attachmentFileUri) {
          parts.push({ fileData: { mimeType: msg.attachmentType, fileUri: msg.attachmentFileUri } });
        } else if (msg.attachmentPath && fs.existsSync(msg.attachmentPath)) {
          // Auto-healing logic (simplified for brevity)
          try {
            const uri = await this.uploadToGemini(msg.attachmentPath, msg.attachmentType, msg.attachmentName || 'legacy');
            msg.attachmentFileUri = uri;
            await this.messageRepo.save(msg);
            parts.push({ fileData: { mimeType: msg.attachmentType, fileUri: uri } });
          } catch {
            const buf = fs.readFileSync(msg.attachmentPath);
            parts.push({ inlineData: { mimeType: msg.attachmentType, data: buf.toString('base64') } });
          }
        }
      }
      if (msg.content) parts.push({ text: msg.content });
      return { role: msg.role === 'assistant' ? 'model' : 'user', parts };
    }));
  }

  private createModel(modelName: string) {
    return this.genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: this.SYSTEM_PROMPT,
      generationConfig: { temperature: 0.2, maxOutputTokens: 8192 }, // Bajar temperatura para RAG
    });
  }

  private async generateContentWithBackoff(model: any, contents: any[]): Promise<any> {
    let delay = 2000;
    for (let i = 0; i < 3; i++) {
      try { return await model.generateContent({ contents }); }
      catch (e: any) {
        if (e.status === 429) {
          await new Promise(r => setTimeout(r, delay));
          delay *= 2;
        } else throw e;
      }
    }
  }

  private async uploadToGemini(filePath: string, mimeType: string, displayName: string): Promise<string> {
    const uploadResponse = await this.fileManager.uploadFile(filePath, { mimeType, displayName });
    let file = await this.fileManager.getFile(uploadResponse.file.name);
    while (file.state === FileState.PROCESSING) {
      await new Promise(r => setTimeout(r, 1000));
      file = await this.fileManager.getFile(file.name);
    }
    return file.uri;
  }

  async getHistory(userId: number): Promise<ChatMessageDto[]> {
    const lastConversation = await this.conversationRepo.findOne({
      where: { userId },
      order: { updatedAt: 'DESC' },
      relations: ['messages'],
    });

    if (!lastConversation || !lastConversation.messages) {
      return [];
    }

    return lastConversation.messages
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((msg) => ({
        role: msg.role,
        content: msg.content,
        attachment: msg.hasAttachment
          ? { mimeType: msg.attachmentType, filename: msg.attachmentName }
          : undefined,
      }));
  }

  async quickAnalysis(equipmentType: string, issue: string): Promise<string> {
    if (!this.genAI) return 'Servicio IA no disponible';

    // Check Cache first for quick analysis
    const cacheKey = `ai:quick:${equipmentType}:${issue}`;
    const cached = await this.cacheService.get<string>(cacheKey);
    if (cached) return cached;

    const model = this.createModel(this.MODEL_NAME);
    const prompt = `Analiza rápidamente el siguiente problema en un equipo CNS(${equipmentType}): \nProblema: ${issue} \n\nProporciona una guía rápida de solución o diagnóstico inicial.`;

    try {
      // Use backoff here too just in case
      let result;
      try {
        result = await model.generateContent(prompt);
      } catch (e: any) {
        if (e.status === 429) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          result = await model.generateContent(prompt);
        } else throw e;
      }

      const responseText = result.response.text();

      // Cache result for 1 hour
      await this.cacheService.set(cacheKey, responseText, 3600);

      return responseText;
    } catch (error) {
      this.logger.error('Error in quickAnalysis', error);
      return 'Error procesando el análisis rápido.';
    }
  }
}
