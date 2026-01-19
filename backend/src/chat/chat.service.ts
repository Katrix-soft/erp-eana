import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, Not } from 'typeorm';
import { ChatRoom } from './entities/chat-room.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatParticipant } from './entities/chat-participant.entity';
import { User } from '../users/entities/user.entity';
import { TipoChatRoom, Sector } from '../common/enums/shared.enums';

export interface CreateChatRoomDto {
    nombre: string;
    descripcion?: string;
    tipo: TipoChatRoom;
    aeropuertoId?: number;
    firId?: number;
    sector?: Sector;
}

export interface SendMessageDto {
    mensaje: string;
    imagenes?: string[];
}

@Injectable()
export class ChatService {
    constructor(
        @InjectRepository(ChatRoom) private chatRoomRepository: Repository<ChatRoom>,
        @InjectRepository(ChatMessage) private chatMessageRepository: Repository<ChatMessage>,
        @InjectRepository(ChatParticipant) private chatParticipantRepository: Repository<ChatParticipant>,
        @InjectRepository(User) private userRepository: Repository<User>,
    ) { }

    async createRoom(dto: CreateChatRoomDto) {
        const room = this.chatRoomRepository.create({
            ...dto,
            aeropuerto: dto.aeropuertoId ? { id: dto.aeropuertoId } : null,
            fir: dto.firId ? { id: dto.firId } : null,
        });
        const saved = await this.chatRoomRepository.save(room);

        return this.chatRoomRepository.findOne({
            where: { id: saved.id },
            relations: ['aeropuerto', 'fir']
        });
    }

    async findAllRooms(filters?: {
        tipo?: TipoChatRoom;
        aeropuertoId?: number;
        firId?: number;
        sector?: Sector;
        activa?: boolean;
    }) {
        const where: any = {};
        if (filters?.tipo) where.tipo = filters.tipo;
        if (filters?.aeropuertoId) where.aeropuerto = { id: filters.aeropuertoId };
        if (filters?.firId) where.fir = { id: filters.firId };
        if (filters?.sector) where.sector = filters.sector;
        if (filters?.activa !== undefined) where.activa = filters.activa;

        const rooms = await this.chatRoomRepository.find({
            where,
            relations: ['aeropuerto', 'fir', 'mensajes', 'participantes'],
            order: { createdAt: 'DESC' }
        });

        // Add counts
        return rooms.map(room => ({
            ...room,
            _count: {
                mensajes: room.mensajes?.length || 0,
                participantes: room.participantes?.length || 0
            }
        }));
    }

    async findOneRoom(id: number) {
        const room = await this.chatRoomRepository.findOne({
            where: { id },
            relations: [
                'aeropuerto', 'fir',
                'participantes', 'participantes.user', 'participantes.user.personal'
            ]
        });

        if (!room) {
            throw new NotFoundException(`Sala de chat con ID ${id} no encontrada`);
        }

        return room;
    }

    async getRoomMessages(roomId: number, limit: number = 50, offset: number = 0) {
        const room = await this.chatRoomRepository.findOne({ where: { id: roomId } });

        if (!room) {
            throw new NotFoundException(`Sala de chat con ID ${roomId} no encontrada`);
        }

        return this.chatMessageRepository.find({
            where: { room: { id: roomId } },
            relations: [
                'user', 'user.personal'
            ],
            order: { createdAt: 'DESC' },
            take: limit,
            skip: offset
        });
    }

    async sendMessage(roomId: number, userId: number, dto: SendMessageDto) {
        const room = await this.chatRoomRepository.findOne({ where: { id: roomId } });

        if (!room) {
            throw new NotFoundException(`Sala de chat con ID ${roomId} no encontrada`);
        }

        if (!room.activa) {
            throw new ForbiddenException('Esta sala de chat está inactiva');
        }

        // Asegurar que el usuario es participante
        await this.joinRoom(roomId, userId);

        const message = this.chatMessageRepository.create({
            room: { id: roomId },
            user: { id: userId },
            mensaje: dto.mensaje,
            imagenes: dto.imagenes || [],
        });

        await this.chatMessageRepository.save(message);

        const savedMessage = await this.chatMessageRepository.findOne({
            where: { id: message.id },
            relations: ['user', 'user.personal']
        });

        // Actualizar última vista del participante. Using update with criteria.
        await this.chatParticipantRepository.update(
            { room: { id: roomId }, user: { id: userId } },
            { ultimaVista: new Date() }
        );

        return savedMessage;
    }

    async joinRoom(roomId: number, userId: number) {
        const room = await this.chatRoomRepository.findOne({ where: { id: roomId } });

        if (!room) {
            throw new NotFoundException(`Sala de chat con ID ${roomId} no encontrada`);
        }

        const existing = await this.chatParticipantRepository.findOne({
            where: {
                room: { id: roomId },
                user: { id: userId }
            }
        });

        if (existing) {
            return existing;
        }

        const participant = this.chatParticipantRepository.create({
            room: { id: roomId },
            user: { id: userId }
        });

        await this.chatParticipantRepository.save(participant);

        return this.chatParticipantRepository.findOne({
            where: { id: participant.id },
            relations: ['user', 'user.personal']
        });
    }

    async leaveRoom(roomId: number, userId: number) {
        return this.chatParticipantRepository.delete({
            room: { id: roomId },
            user: { id: userId }
        });
    }

    async updateLastRead(roomId: number, userId: number) {
        return this.chatParticipantRepository.update(
            { room: { id: roomId }, user: { id: userId } },
            { ultimaVista: new Date() }
        );
    }

    async getUnreadCount(roomId: number, userId: number) {
        const participant = await this.chatParticipantRepository.findOne({
            where: {
                room: { id: roomId },
                user: { id: userId }
            }
        });

        if (!participant) {
            return 0;
        }

        // Count messages in room created after ultimaVista, NOT sent by user.
        return this.chatMessageRepository.count({
            where: {
                room: { id: roomId },
                createdAt: MoreThan(participant.ultimaVista),
                user: { id: Not(userId) }
            }
        });
    }

    async getUserName(userId: number) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['personal']
        });

        if (!user) return 'Usuario desconocido';

        if (user.personal) {
            return `${user.personal.nombre} ${user.personal.apellido}`;
        }
        return user.email.split('@')[0];
    }
}
