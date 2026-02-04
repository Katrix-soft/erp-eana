
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Equipo } from '../../equipos/entities/equipo.entity';

@Entity('vor')
export class Vor {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    fir: string;

    @Column()
    aeropuerto: string;

    @Column({ nullable: true })
    ident: string;

    @Column()
    sitio: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @OneToMany(() => Equipo, (equipo) => equipo.vor)
    equipos: Equipo[];
}
