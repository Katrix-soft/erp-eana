
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Aeropuerto } from '../../aeropuertos/entities/aeropuerto.entity';
import { Fir } from '../../firs/entities/fir.entity';
import { EstadoEquipo } from '../../common/enums/shared.enums';

@Entity('energia')
export class Energia {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    nombre: string;

    @Column({ nullable: true })
    tipo: string;

    @Column({ nullable: true })
    marca: string;

    @Column({ nullable: true })
    modelo: string;

    @Column({ name: 'numero_serie', nullable: true })
    numeroSerie: string;

    @Column({ name: 'activo_fijo', nullable: true })
    activoFijo: string;

    @Column({ nullable: true })
    referencia: string;

    @Column({ nullable: true })
    grupo: string;

    @Column({ name: 'siglas_local', nullable: true })
    siglasLocal: string;

    @Column({ nullable: true })
    oaci: string;

    @Column({ nullable: true })
    sistema: string;

    @Column({ nullable: true })
    potencia: string;

    @Column({ name: 'id_ap_sig', nullable: true })
    idApSig: string;

    @Column({ nullable: true })
    observaciones: string;

    @Column({ name: 'aeropuerto_id', nullable: true })
    aeropuertoId: number;

    @Column({ name: 'fir_id', nullable: true })
    firId: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @Column({
        type: 'enum',
        enum: EstadoEquipo,
        default: EstadoEquipo.OK
    })
    estado: EstadoEquipo;

    @ManyToOne(() => Aeropuerto)
    @JoinColumn({ name: 'aeropuerto_id' })
    aeropuerto: Aeropuerto;

    @ManyToOne(() => Fir)
    @JoinColumn({ name: 'fir_id' })
    firRel: Fir;
}
