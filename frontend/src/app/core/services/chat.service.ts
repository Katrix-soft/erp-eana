import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';

export interface ChatRoom {
    id: number;
    nombre: string;
    descripcion?: string;
    tipo: 'GENERAL' | 'AEROPUERTO' | 'FIR' | 'SECTOR' | 'EQUIPO';
    aeropuertoId?: number;
    firId?: number;
    sector?: string;
    activa: boolean;
    createdAt: string;
    aeropuerto?: {
        id: number;
        nombre: string;
    };
    fir?: {
        id: number;
        nombre: string;
    };
    _count?: {
        mensajes: number;
        participantes: number;
    };
}

export interface ChatMessage {
    id: number;
    roomId: number;
    userId: number;
    mensaje: string;
    imagenes: string[];
    createdAt: string;
    user: {
        id: number;
        email: string;
        personal?: {
            nombre: string;
            apellido: string;
        };
    };
    pending?: boolean;
}

export interface CreateChatRoomDto {
    nombre: string;
    descripcion?: string;
    tipo: 'GENERAL' | 'AEROPUERTO' | 'FIR' | 'SECTOR' | 'EQUIPO';
    aeropuertoId?: number;
    firId?: number;
    sector?: string;
}

export interface SendMessageDto {
    mensaje: string;
    imagenes?: string[];
}

@Injectable({
    providedIn: 'root'
})
export class ChatService {
    private apiUrl = `${environment.apiUrl}/chat`;
    private socket: Socket | null = null;
    private messageSubject = new Subject<ChatMessage>();
    private typingSubject = new Subject<{ roomId: number; userId: number; userName?: string; isTyping: boolean }>();

    public messages$ = this.messageSubject.asObservable();
    public typing$ = this.typingSubject.asObservable();

    constructor(private http: HttpClient) { }

    // REST API Methods
    createRoom(dto: CreateChatRoomDto): Observable<ChatRoom> {
        return this.http.post<ChatRoom>(`${this.apiUrl}/rooms`, dto);
    }

    getRooms(filters?: {
        tipo?: string;
        aeropuertoId?: number;
        firId?: number;
        sector?: string;
        activa?: boolean;
    }): Observable<ChatRoom[]> {
        let params = new HttpParams();

        if (filters) {
            if (filters.tipo) params = params.set('tipo', filters.tipo);
            if (filters.aeropuertoId) params = params.set('aeropuertoId', filters.aeropuertoId.toString());
            if (filters.firId) params = params.set('firId', filters.firId.toString());
            if (filters.sector) params = params.set('sector', filters.sector);
            if (filters.activa !== undefined) params = params.set('activa', filters.activa.toString());
        }

        return this.http.get<ChatRoom[]>(`${this.apiUrl}/rooms`, { params });
    }

    getRoom(id: number): Observable<ChatRoom> {
        return this.http.get<ChatRoom>(`${this.apiUrl}/rooms/${id}`);
    }

    getRoomMessages(roomId: number, limit: number = 50, offset: number = 0): Observable<ChatMessage[]> {
        const params = new HttpParams()
            .set('limit', limit.toString())
            .set('offset', offset.toString());

        return this.http.get<ChatMessage[]>(`${this.apiUrl}/rooms/${roomId}/messages`, { params });
    }

    sendMessage(roomId: number, dto: SendMessageDto): Observable<ChatMessage> {
        return this.http.post<ChatMessage>(`${this.apiUrl}/rooms/${roomId}/messages`, dto);
    }

    joinRoom(roomId: number): Observable<any> {
        return this.http.post(`${this.apiUrl}/rooms/${roomId}/join`, {});
    }

    leaveRoom(roomId: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/rooms/${roomId}/leave`);
    }

    markAsRead(roomId: number): Observable<any> {
        return this.http.post(`${this.apiUrl}/rooms/${roomId}/read`, {});
    }

    getUnreadCount(roomId: number): Observable<{ count: number }> {
        return this.http.get<{ count: number }>(`${this.apiUrl}/rooms/${roomId}/unread`);
    }

    // WebSocket Methods
    connectWebSocket(): void {
        if (this.socket) {
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No se encontró token para conectar al WebSocket');
            return;
        }

        this.socket = io(`${environment.socketUrl}/chat`, {
            path: '/socket.io/',
            transports: ['polling', 'websocket'], // Allow polling for faster initial connection
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            auth: {
                token: token
            }
        });

        this.socket.on('connect', () => {
            console.log('WebSocket conectado');
            // Re-join active room if any after reconnection
            const activeRoomId = localStorage.getItem('last_chat_room');
            if (activeRoomId) {
                this.joinRoomWebSocket(parseInt(activeRoomId, 10));
            }
        });

        this.socket.on('connect_error', (err) => {
            console.error('WebSocket connection error:', err);
            // Fallback to polling if websocket fails
            if (this.socket) {
                this.socket.io.opts.transports = ['polling', 'websocket'];
            }
        });

        this.socket.on('newMessage', (message: ChatMessage) => {
            this.messageSubject.next(message);
        });

        this.socket.on('userTyping', (data: { roomId: number; userId: number; userName?: string; isTyping: boolean }) => {
            this.typingSubject.next(data);
        });

        this.socket.on('error', (error: any) => {
            console.error('WebSocket error:', error);
        });
    }

    disconnectWebSocket(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    joinRoomWebSocket(roomId: number): void {
        this.socket?.emit('joinRoom', { roomId });
    }

    leaveRoomWebSocket(roomId: number): void {
        this.socket?.emit('leaveRoom', { roomId });
    }

    sendMessageWebSocket(roomId: number, dto: SendMessageDto): void {
        this.socket?.emit('sendMessage', { roomId, dto });
    }

    sendTyping(roomId: number, isTyping: boolean): void {
        this.socket?.emit('typing', { roomId, isTyping });
    }
}
