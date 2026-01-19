
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Aeropuerto } from '../../aeropuertos/entities/aeropuerto.entity';

@Entity('vor_measurements')
export class VorMeasurement {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    fecha: Date;

    @Column({ name: 'equipo_vor' })
    equipoVor: string;

    @Column('float')
    azimut: number;

    @Column('float', { name: 'error_medido' })
    errorMedido: number;

    @Column()
    tecnico: string;

    @Column({ name: 'aeropuerto_id', nullable: true })
    aeropuertoId: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @ManyToOne(() => Aeropuerto)
    @JoinColumn({ name: 'aeropuerto_id' })
    aeropuerto: Aeropuerto;
}
