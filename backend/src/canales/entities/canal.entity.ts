
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Equipo } from '../../equipos/entities/equipo.entity';
import { Frecuencia } from '../../frecuencias/entities/frecuencia.entity';

@Entity('canales')
export class Canal {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'equipo_vhf_id' })
    equipoVhfId: number;

    @Column()
    canal: string;

    @Column()
    tipo: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @ManyToOne(() => Equipo, (equipo) => equipo.canales, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'equipo_vhf_id' })
    equipoVhf: Equipo;

    @OneToMany(() => Frecuencia, (frecuencia) => frecuencia.canalRel)
    frecuencias: Frecuencia[];
}
