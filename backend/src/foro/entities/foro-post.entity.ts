
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Aeropuerto } from '../../aeropuertos/entities/aeropuerto.entity';
import { Fir } from '../../firs/entities/fir.entity';
import { Equipo } from '../../equipos/entities/equipo.entity';
import { Sector } from '../../common/enums/shared.enums';
import { ForoComment } from './foro-comment.entity';

@Entity('foro_posts')
export class ForoPost {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    titulo: string;

    @Column('text')
    contenido: string;

    @Column({ name: 'autor_id' })
    autorId: number;

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

    @Column({ name: 'equipo_id', nullable: true })
    equipoId: number;

    @Column({ default: false })
    resuelto: boolean;

    @Column({ default: 0 })
    vistas: number;

    @Column('text', { array: true, default: '{}' }) // Postgres array
    imagenes: string[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'autor_id' })
    autor: User;

    @ManyToOne(() => Aeropuerto)
    @JoinColumn({ name: 'aeropuerto_id' })
    aeropuerto: Aeropuerto;

    @ManyToOne(() => Fir)
    @JoinColumn({ name: 'fir_id' })
    fir: Fir;

    @ManyToOne(() => Equipo)
    @JoinColumn({ name: 'equipo_id' })
    equipo: Equipo;

    @OneToMany(() => ForoComment, (comment) => comment.post)
    comentarios: ForoComment[];
}
