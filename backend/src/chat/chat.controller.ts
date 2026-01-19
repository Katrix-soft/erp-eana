import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    ParseIntPipe,
    Delete,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatService, CreateChatRoomDto, SendMessageDto } from './chat.service';
import { TipoChatRoom, Sector } from '../common/enums/shared.enums';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Post('rooms')
    async createRoom(@Body() dto: CreateChatRoomDto) {
        return this.chatService.createRoom(dto);
    }

    @Get('rooms')
    async findAllRooms(
        @Query('tipo') tipo?: TipoChatRoom,
        @Query('aeropuertoId') aeropuertoId?: string,
        @Query('firId') firId?: string,
        @Query('sector') sector?: Sector,
        @Query('activa') activa?: string,
    ) {
        const filters: any = {};

        if (tipo) filters.tipo = tipo;
        if (aeropuertoId) filters.aeropuertoId = parseInt(aeropuertoId);
        if (firId) filters.firId = parseInt(firId);
        if (sector) filters.sector = sector;
        if (activa !== undefined) filters.activa = activa === 'true';

        return this.chatService.findAllRooms(filters);
    }

    @Get('rooms/:id')
    async findOneRoom(@Param('id', ParseIntPipe) id: number) {
        return this.chatService.findOneRoom(id);
    }

    @Get('rooms/:id/messages')
    async getRoomMessages(
        @Param('id', ParseIntPipe) id: number,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        return this.chatService.getRoomMessages(
            id,
            limit ? parseInt(limit) : 50,
            offset ? parseInt(offset) : 0,
        );
    }

    @Post('rooms/:id/messages')
    async sendMessage(
        @Param('id', ParseIntPipe) id: number,
        @Request() req,
        @Body() dto: SendMessageDto,
    ) {
        return this.chatService.sendMessage(id, req.user.userId, dto);
    }

    @Post('rooms/:id/join')
    async joinRoom(@Param('id', ParseIntPipe) id: number, @Request() req) {
        return this.chatService.joinRoom(id, req.user.userId);
    }

    @Delete('rooms/:id/leave')
    async leaveRoom(@Param('id', ParseIntPipe) id: number, @Request() req) {
        return this.chatService.leaveRoom(id, req.user.userId);
    }

    @Post('rooms/:id/read')
    async markAsRead(@Param('id', ParseIntPipe) id: number, @Request() req) {
        return this.chatService.updateLastRead(id, req.user.userId);
    }

    @Get('rooms/:id/unread')
    async getUnreadCount(@Param('id', ParseIntPipe) id: number, @Request() req) {
        const count = await this.chatService.getUnreadCount(id, req.user.userId);
        return { count };
    }
}
