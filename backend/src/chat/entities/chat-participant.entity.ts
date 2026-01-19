
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { ChatRoom } from './chat-room.entity';
import { User } from '../../users/entities/user.entity';

@Entity('chat_participants')
@Unique(['roomId', 'userId'])
export class ChatParticipant {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'room_id' })
    roomId: number;

    @Column({ name: 'user_id' })
    userId: number;

    @Column({ name: 'ultima_vista', default: () => 'CURRENT_TIMESTAMP' })
    ultimaVista: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @ManyToOne(() => ChatRoom, (room) => room.participantes, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'room_id' })
    room: ChatRoom;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;
}
