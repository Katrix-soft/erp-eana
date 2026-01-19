
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Aeropuerto } from '../../aeropuertos/entities/aeropuerto.entity';
import { Fir } from '../../firs/entities/fir.entity';
import { PuestoPersonal } from '../../puestos-personal/entities/puesto-personal.entity';
import { EquipoNavegacion } from './equipo-navegacion.entity';

@Entity('navegacion')
export class Navegacion {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    ayuda: string;

    @Column({ name: 'asociado_a', nullable: true })
    asociadoA: string;

    @Column({ nullable: true })
    modelo: string;

    @Column()
    nombre: string;

    @Column('float', { nullable: true })
    latitud: number;

    @Column('float', { nullable: true })
    longitud: number;

    @Column({ nullable: true })
    oaci: string;

    @Column({ name: 'anio_instalacion', nullable: true })
    anioInstalacion: string;

    @Column({ name: 'monitor_torre', nullable: true })
    monitorTorre: boolean;

    @Column({ nullable: true })
    frecuencia: string;

    @Column({ nullable: true }) // Fir Text
    fir: string;

    @Column({ nullable: true })
    tipo: string;

    @Column({ name: 'siglas_local', nullable: true })
    siglasLocal: string;

    @Column({ nullable: true })
    estacion: string;

    @Column({ nullable: true })
    ident: string;

    @Column({ name: 'aeropuerto_id', nullable: true })
    aeropuertoId: number;

    @Column({ name: 'fir_id', nullable: true })
    firId: number;

    @Column({ name: 'puesto_id', nullable: true })
    puestoId: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @OneToMany(() => EquipoNavegacion, (equipo) => equipo.navegacion)
    equipos: EquipoNavegacion[];

    @ManyToOne(() => Aeropuerto)
    @JoinColumn({ name: 'aeropuerto_id' })
    aeropuerto: Aeropuerto;

    @ManyToOne(() => Fir)
    @JoinColumn({ name: 'fir_id' })
    firRel: Fir;

    @ManyToOne(() => PuestoPersonal)
    @JoinColumn({ name: 'puesto_id' })
    puesto: PuestoPersonal;
}
