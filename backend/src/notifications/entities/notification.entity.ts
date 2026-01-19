
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity'; // if userId is used relationally? Prisma schema says userId Int? @map("user_id") but NO relation.
import { Aeropuerto } from '../../aeropuertos/entities/aeropuerto.entity';
import { Fir } from '../../firs/entities/fir.entity';
import { Sector } from '../../common/enums/shared.enums';

@Entity('notifications')
export class Notification {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    message: string;

    @Column({ default: 'INFO' })
    type: string;

    @Column({ default: false })
    read: boolean;

    @Column({ name: 'user_id', nullable: true })
    userId: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

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

    @ManyToOne(() => Aeropuerto)
    @JoinColumn({ name: 'aeropuerto_id' })
    aeropuerto: Aeropuerto;

    @ManyToOne(() => Fir)
    @JoinColumn({ name: 'fir_id' })
    fir: Fir;
}
