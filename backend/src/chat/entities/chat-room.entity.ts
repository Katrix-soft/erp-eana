
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Aeropuerto } from '../../aeropuertos/entities/aeropuerto.entity';
import { Fir } from '../../firs/entities/fir.entity';
import { Sector, TipoChatRoom } from '../../common/enums/shared.enums';
import { ChatMessage } from './chat-message.entity';
import { ChatParticipant } from './chat-participant.entity';

@Entity('chat_rooms')
export class ChatRoom {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    nombre: string;

    @Column({ nullable: true })
    descripcion: string;

    @Column({
        type: 'enum',
        enum: TipoChatRoom,
        default: TipoChatRoom.GENERAL
    })
    tipo: TipoChatRoom;

    @Column({ name: 'aeropuerto_id', nullable: true })
    aeropuertoId: number;

    @Column({ name: 'fir_id', nullable: true })
    firId: number;

    @Column({
        type: 'enum',
        enum: Sector,
        nullable: true
    })
    sector: Sector;

    @Column({ default: true })
    activa: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @ManyToOne(() => Aeropuerto)
    @JoinColumn({ name: 'aeropuerto_id' })
    aeropuerto: Aeropuerto;

    @ManyToOne(() => Fir)
    @JoinColumn({ name: 'fir_id' })
    fir: Fir;

    @OneToMany(() => ChatMessage, (msg) => msg.room)
    mensajes: ChatMessage[];

    @OneToMany(() => ChatParticipant, (part) => part.room)
    participantes: ChatParticipant[];
}
