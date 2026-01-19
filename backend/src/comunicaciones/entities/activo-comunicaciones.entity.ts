
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Comunicaciones } from './comunicaciones.entity';

@Entity('activos_comunicaciones')
export class ActivoComunicaciones {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'activo_fijo' })
    activoFijo: string;

    @Column({ name: 'numero_serie' })
    numeroSerie: string;

    @Column({ name: 'comunicaciones_id' })
    comunicacionesId: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @ManyToOne(() => Comunicaciones, (com) => com.activos)
    @JoinColumn({ name: 'comunicaciones_id' })
    comunicaciones: Comunicaciones;
}
