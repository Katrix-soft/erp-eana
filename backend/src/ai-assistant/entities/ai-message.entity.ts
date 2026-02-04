
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AiConversation } from './ai-conversation.entity';

@Entity('ai_messages')
export class AiMessage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => AiConversation, (conversation) => conversation.messages, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'conversation_id' })
    conversation: AiConversation;

    @Column({ name: 'conversation_id' })
    conversationId: string;

    @Column({ type: 'enum', enum: ['user', 'assistant'] })
    role: 'user' | 'assistant';

    @Column('text')
    content: string;

    // Campos para adjuntos (RAG)
    @Column({ name: 'has_attachment', default: false })
    hasAttachment: boolean;

    @Column({ name: 'attachment_path', nullable: true })
    attachmentPath: string; // Ruta relativa en el servidor (uploads/ai/...)

    @Column({ name: 'attachment_type', nullable: true })
    attachmentType: string; // mime/type ej: application/pdf

    @Column({ name: 'attachment_name', nullable: true })
    attachmentName: string; // nombre original del archivo

    @Column({ name: 'attachment_file_uri', nullable: true })
    attachmentFileUri: string; // URI de Google File API (para optimización 429)

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
