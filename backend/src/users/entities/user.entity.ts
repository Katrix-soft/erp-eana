
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, OneToOne } from 'typeorm';
import { AuditLog } from '../../audit/entities/audit-log.entity';
import { Authenticator } from '../../auth/entities/authenticator.entity';
import { Personal } from '../../personal/entities/personal.entity';
import { WorkOrder } from '../../work-orders/entities/work-order.entity';
import { ForoPost } from '../../foro/entities/foro-post.entity';
import { ForoComment } from '../../foro/entities/foro-comment.entity';
import { ChatMessage } from '../../chat/entities/chat-message.entity';
import { ChatParticipant } from '../../chat/entities/chat-participant.entity';
import { Role } from '../../common/enums/shared.enums'; // Better to use shared enum

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    email: string;

    @Column()
    password?: string;

    @Column({
        type: 'enum',
        enum: Role,
        default: Role.TECNICO,
    })
    role: Role;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @Column({ name: 'reset_token', nullable: true })
    resetToken?: string;

    @Column({ name: 'reset_token_expiry', type: 'timestamp', nullable: true })
    resetTokenExpiry?: Date;

    @Column({ name: 'password_changed', default: false })
    passwordChanged: boolean;

    // Relations

    @OneToMany(() => AuditLog, (log) => log.user)
    auditLogs: AuditLog[];

    @OneToMany(() => Authenticator, (auth) => auth.user)
    authenticators: Authenticator[];

    @OneToOne(() => Personal, (personal) => personal.user)
    personal: Personal;

    @OneToMany(() => WorkOrder, (wo) => wo.solicitante)
    solicitanteOTs: WorkOrder[];

    @OneToMany(() => WorkOrder, (wo) => wo.tecnicoAsignado)
    asignadoOTs: WorkOrder[];

    @OneToMany(() => ForoPost, (post) => post.autor)
    foroPosts: ForoPost[];

    @OneToMany(() => ForoComment, (comment) => comment.autor)
    foroComments: ForoComment[];

    @OneToMany(() => ChatMessage, (msg) => msg.user)
    chatMessages: ChatMessage[];

    @OneToMany(() => ChatParticipant, (part) => part.user)
    chatParticipations: ChatParticipant[];
}
