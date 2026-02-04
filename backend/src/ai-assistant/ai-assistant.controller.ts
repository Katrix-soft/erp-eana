
import { Controller, Post, Get, Body, UseGuards, Logger, Req } from '@nestjs/common';
import { AiAssistantService, ChatAttachment, ChatMessageDto } from './ai-assistant.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface ChatRequest {
    messages: ChatMessageDto[];
    conversationId?: string;
}

interface QuickAnalysisRequest {
    equipmentType: string;
    issue: string;
}

@Controller('ai-assistant')
export class AiAssistantController {
    private readonly logger = new Logger(AiAssistantController.name);

    constructor(private readonly aiAssistantService: AiAssistantService) { }

    @Get('ping')
    ping() { return { status: 'ok', msg: 'pong' }; }

    @Post('chat')
    @UseGuards(JwtAuthGuard)
    async chat(@Body() request: ChatRequest, @Req() req: any) {
        const userId = req.user.userId;
        const msgCount = request.messages?.length || 0;

        this.logger.log(`💬 Chat request from User ${userId}: ${msgCount} msgs`);

        if (!request.messages || request.messages.length === 0) {
            return {
                success: false,
                message: 'No se proporcionaron mensajes'
            };
        }

        try {
            // Pasamos userId y messages al servicio con persistencia
            const result = await this.aiAssistantService.chat(userId, request.messages, request.conversationId);

            return {
                success: true,
                response: result.response,
                conversationId: result.conversationId,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            this.logger.error('❌ Error in chat endpoint:', error);
            return {
                success: false,
                message: 'Error al procesar la consulta',
                error: error.message
            };
        }
    }

    @Get('history')
    @UseGuards(JwtAuthGuard)
    async getHistory(@Req() req: any) {
        const userId = req.user.userId;
        try {
            const history = await this.aiAssistantService.getHistory(userId);
            return {
                success: true,
                history
            };
        } catch (error) {
            this.logger.error('Error fetching history', error);
            return { success: false, history: [] };
        }
    }

    @Post('quick-analysis')
    async quickAnalysis(@Body() request: QuickAnalysisRequest) {
        // ... (sin cambios aquí por ahora)
        try {
            const response = await this.aiAssistantService.quickAnalysis(request.equipmentType, request.issue);
            return { success: true, response, timestamp: new Date().toISOString() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}
