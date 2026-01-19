import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService, SendMessageDto } from './chat.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
    cors: {
        origin: '*', // TODO: Restrict in production via environment
    },
    namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private userSockets = new Map<number, Set<string>>();

    constructor(
        private chatService: ChatService,
        private jwtService: JwtService
    ) { }

    async handleConnection(client: Socket) {
        try {
            const token = client.handshake.auth.token || client.handshake.query.token as string;

            if (!token) {
                console.log(`Cliente desconectado por falta de token: ${client.id}`);
                client.disconnect();
                return;
            }

            const payload = this.jwtService.verify(token);
            const userId = payload.sub;

            // Guardar userId y userName en la data del socket
            client.data.userId = userId;
            const userName = await this.chatService.getUserName(userId);
            client.data.userName = userName;

            if (!this.userSockets.has(userId)) {
                this.userSockets.set(userId, new Set());
            }
            this.userSockets.get(userId).add(client.id);

            console.log(`Cliente autenticado y conectado: ${client.id}, UserID: ${userId}, Name: ${userName}`);
            client.emit('authenticated', { success: true });

        } catch (error) {
            console.error(`Error de autenticación WebSocket: ${error.message}`);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        console.log(`Cliente desconectado: ${client.id}`);
        const userId = client.data.userId;

        if (userId && this.userSockets.has(userId)) {
            const userSockets = this.userSockets.get(userId);
            userSockets.delete(client.id);
            if (userSockets.size === 0) {
                this.userSockets.delete(userId);
            }
        }
    }

    // Ya no necesitamos 'authenticate' explícito, se hace en handshake

    @SubscribeMessage('joinRoom')
    async handleJoinRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: number },
    ) {
        const userId = client.data.userId;
        if (!userId) return;

        try {
            await this.chatService.joinRoom(data.roomId, userId);
            client.join(`room-${data.roomId}`);

            this.server.to(`room-${data.roomId}`).emit('userJoined', {
                roomId: data.roomId,
                userId: userId,
            });

            client.emit('joinedRoom', { roomId: data.roomId, success: true });
        } catch (error) {
            client.emit('error', { message: error.message });
        }
    }

    @SubscribeMessage('leaveRoom')
    async handleLeaveRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: number },
    ) {
        const userId = client.data.userId;
        if (!userId) return;

        try {
            await this.chatService.leaveRoom(data.roomId, userId);
            client.leave(`room-${data.roomId}`);

            this.server.to(`room-${data.roomId}`).emit('userLeft', {
                roomId: data.roomId,
                userId: userId,
            });

            client.emit('leftRoom', { roomId: data.roomId, success: true });
        } catch (error) {
            client.emit('error', { message: error.message });
        }
    }

    @SubscribeMessage('sendMessage')
    async handleSendMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: number; dto: SendMessageDto },
    ) {
        const userId = client.data.userId;
        if (!userId) {
            client.emit('error', { message: 'Unauthorized' });
            return;
        }

        try {
            const message = await this.chatService.sendMessage(
                data.roomId,
                userId,
                data.dto,
            );

            // Emitir el mensaje a todos en la sala
            this.server.to(`room-${data.roomId}`).emit('newMessage', message);

            client.emit('messageSent', { success: true, message });
        } catch (error) {
            client.emit('error', { message: error.message });
        }
    }

    @SubscribeMessage('typing')
    handleTyping(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: number; isTyping: boolean },
    ) {
        const userId = client.data.userId;
        if (!userId) return;

        client.to(`room-${data.roomId}`).emit('userTyping', {
            roomId: data.roomId,
            userId: userId,
            userName: client.data.userName,
            isTyping: data.isTyping,
        });
    }

    @SubscribeMessage('markAsRead')
    async handleMarkAsRead(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: number },
    ) {
        const userId = client.data.userId;
        if (!userId) return;

        try {
            await this.chatService.updateLastRead(data.roomId, userId);
            client.emit('markedAsRead', { roomId: data.roomId, success: true });
        } catch (error) {
            client.emit('error', { message: error.message });
        }
    }
}
