
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('audit_logs')
export class AuditLog {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'user_id' })
    userId: number;

    @Column()
    action: string;

    @Column()
    entity: string;

    @Column({ name: 'entity_id' })
    entityId: number;

    @Column('json', { name: 'old_value', nullable: true })
    oldValue: any;

    @Column('json', { name: 'new_value', nullable: true })
    newValue: any;

    @Column({ name: 'ip_address', nullable: true })
    ipAddress: string;

    @Column({ name: 'user_agent', nullable: true })
    userAgent: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @ManyToOne(() => User) // , (user) => user.auditLogs
    @JoinColumn({ name: 'user_id' })
    user: User;
}
