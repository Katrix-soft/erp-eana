
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Personal } from './personal.entity';

@Entity('turnos')
export class Turno {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    fecha: Date;

    @Column()
    tipo: string;

    @Column({ nullable: true })
    obs: string;

    @Column({ name: 'personal_id' })
    personalId: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @ManyToOne(() => Personal, (personal) => personal.turnos, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'personal_id' })
    personal: Personal;
}
