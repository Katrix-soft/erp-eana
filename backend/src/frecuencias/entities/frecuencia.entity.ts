
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Canal } from '../../canales/entities/canal.entity';
import { Equipo } from '../../equipos/entities/equipo.entity';

@Entity('frecuencias')
export class Frecuencia {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'canal_id' })
    canalId: number;

    @Column({ name: 'equipo_vhf_id' })
    equipoVhfId: number;

    @Column('float')
    frecuencia: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @ManyToOne(() => Canal, (canal) => canal.frecuencias, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'canal_id' })
    canalRel: Canal;

    @ManyToOne(() => Equipo, (equipo) => equipo.frecuencias, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'equipo_vhf_id' })
    equipoVhf: Equipo;
}
