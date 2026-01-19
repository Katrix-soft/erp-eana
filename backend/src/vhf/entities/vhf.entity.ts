
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Equipo } from '../../equipos/entities/equipo.entity';

@Entity('vhf')
export class Vhf {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    fir: string;

    @Column()
    aeropuerto: string;

    @Column()
    sitio: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @OneToMany(() => Equipo, (equipo) => equipo.vhf)
    equipos: Equipo[];
}
