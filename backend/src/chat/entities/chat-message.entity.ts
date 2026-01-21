import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ChatRoom } from './chat-room.entity';
import { User } from '../../users/entities/user.entity';

@Entity('chat_messages')
@Index(['roomId', 'createdAt'])
export class ChatMessage {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'room_id' })
    roomId: number;

    @Column({ name: 'user_id' })
    userId: number;

    @Column('text')
    mensaje: string;

    @Column('text', { array: true, default: '{}' })
    imagenes: string[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @ManyToOne(() => ChatRoom, (room) => room.mensajes, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'room_id' })
    room: ChatRoom;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;
}
