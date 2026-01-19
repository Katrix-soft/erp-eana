
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Navegacion } from './navegacion.entity';
import { EstadoEquipo } from '../../common/enums/shared.enums';

@Entity('equipos_navegacion')
export class EquipoNavegacion {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'navegacion_id' })
    navegacionId: number;

    @Column({ name: 'tipo_equipo' })
    tipoEquipo: string;

    @Column()
    marca: string;

    @Column()
    modelo: string;

    @Column({ name: 'numero_serie' })
    numeroSerie: string;

    @Column({
        type: 'enum',
        enum: EstadoEquipo,
        default: EstadoEquipo.OK
    })
    estado: EstadoEquipo;

    @Column({ name: 'frecuencia', nullable: true })
    frecuencia: string;

    @Column({ name: 'ayuda', nullable: true })
    ayuda: string;

    @Column({ name: 'asociado_a', nullable: true })
    asociadoA: string;

    @Column({ name: 'oaci', nullable: true })
    oaci: string;

    @Column({ name: 'fecha_instalacion', nullable: true })
    fechaInstalacion: Date;

    @Column({ nullable: true })
    observaciones: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @ManyToOne(() => Navegacion, (nav) => nav.equipos, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'navegacion_id' })
    navegacion: Navegacion;
}
