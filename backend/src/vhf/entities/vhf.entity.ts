
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Equipo } from '../../equipos/entities/equipo.entity';
import { Aeropuerto } from '../../aeropuertos/entities/aeropuerto.entity';

@Entity('vhf')
export class Vhf {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    fir: string;

    @Column()
    aeropuerto: string;

    @Column({ name: 'aeropuerto_id', nullable: true })
    aeropuertoId: number;

    @Column()
    sitio: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @ManyToOne(() => Aeropuerto)
    @JoinColumn({ name: 'aeropuerto_id' })
    aeropuertoRelation: Aeropuerto;

    @OneToMany(() => Equipo, (equipo) => equipo.vhf)
    equipos: Equipo[];
}
