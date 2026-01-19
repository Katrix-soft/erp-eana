
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Aeropuerto } from '../../aeropuertos/entities/aeropuerto.entity';
import { ActivoComunicaciones } from './activo-comunicaciones.entity';
import { EstadoEquipo } from '../../common/enums/shared.enums';

@Entity('comunicaciones')
export class Comunicaciones {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    nombre: string;

    @Column({ nullable: true })
    tipo: string;

    @Column({ nullable: true })
    marca: string;

    @Column({ nullable: true })
    modelo: string;

    @Column({ name: 'numero_serie', nullable: true })
    numeroSerie: string;

    @Column({ name: 'aeropuerto_id' })
    aeropuertoId: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @Column({ nullable: true })
    canal: string;

    @Column({
        type: 'enum',
        enum: EstadoEquipo,
        default: EstadoEquipo.OK
    })
    estado: EstadoEquipo;

    @Column('float', { nullable: true })
    frecuencia: number;

    @OneToMany(() => ActivoComunicaciones, (activo) => activo.comunicaciones)
    activos: ActivoComunicaciones[];

    @ManyToOne(() => Aeropuerto) // Simplified, add .comunicaciones in Aeropuerto later
    @JoinColumn({ name: 'aeropuerto_id' })
    aeropuerto: Aeropuerto;
}
