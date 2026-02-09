
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Aeropuerto } from '../../aeropuertos/entities/aeropuerto.entity';
import { Fir } from '../../firs/entities/fir.entity';
import { EstadoEquipo } from '../../common/enums/shared.enums';

@Entity('vigilancia')
export class Vigilancia {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    referencia: string;

    @Column({ nullable: true })
    definicion: string; // Tipo de equipo (e.g., Radar)

    @Column({ nullable: true })
    modelo: string;

    @Column({ name: 'entes_certificadores', nullable: true })
    certificadores: string;

    @Column({ nullable: true })
    sistema: string;

    @Column({ nullable: true })
    fir: string; // FIR Texto de Excel

    @Column({ name: 'siglas_local', nullable: true })
    siglasLocal: string; // OACI

    @Column({ nullable: true })
    ubicacion: string; // Nombre del sitio/aeropuerto

    @Column({ name: 'id_ap_sig', nullable: true })
    idApSig: string;

    @Column({ name: 'numero_serie', nullable: true })
    numeroSerie: string;

    @Column({ nullable: true })
    nombre: string;

    @Column({ nullable: true })
    tipo: string;

    @Column({ nullable: true })
    marca: string;

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

    @Column({ name: 'canal_activo', default: 'CH1' })
    canalActivo: string; // CH1 or CH2

    @ManyToOne(() => Aeropuerto)
    @JoinColumn({ name: 'aeropuerto_id' })
    aeropuerto: Aeropuerto;

    @ManyToOne(() => Fir)
    @JoinColumn({ name: 'fir_id' })
    firRel: Fir;
}
