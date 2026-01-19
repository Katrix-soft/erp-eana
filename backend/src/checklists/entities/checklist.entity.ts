
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToOne, JoinColumn } from 'typeorm';
import { Aeropuerto } from '../../aeropuertos/entities/aeropuerto.entity';
import { Equipo } from '../../equipos/entities/equipo.entity';
import { Personal } from '../../personal/entities/personal.entity';
import { WorkOrder } from '../../work-orders/entities/work-order.entity';

@Entity('checklists')
export class Checklist {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    estacion: string;

    @Column({ nullable: true })
    folio: string;

    @Column()
    fecha: Date;

    @Column({ default: 'OPERATIVO', nullable: true })
    estado: string;

    @Column({ nullable: true })
    conmutacion: string;

    @Column({ name: 'conmutacion_obs', nullable: true })
    conmutacionObs: string;

    @Column({ name: 'estado_baterias', nullable: true })
    estadoBaterias: string;

    @Column({ name: 'estado_baterias_obs', nullable: true })
    estadoBateriasObs: string;

    @Column({ name: 'sistema_irradiante', nullable: true })
    sistemaIrradiante: string;

    @Column({ name: 'sistema_irradiante_obs', nullable: true })
    sistemaIrradianteObs: string;

    @Column({ name: 'cableado_rf', nullable: true })
    cableadoRf: string;

    @Column({ name: 'cableado_rf_obs', nullable: true })
    cableadoRfObs: string;

    @Column({ nullable: true })
    balizamiento: string;

    @Column({ name: 'balizamiento_obs', nullable: true })
    balizamientoObs: string;

    @Column({ name: 'switch_ethernet', nullable: true })
    switchEthernet: string;

    @Column({ name: 'switch_ethernet_obs', nullable: true })
    switchEthernetObs: string;

    @Column({ name: 'cabeza_control', nullable: true })
    cabezaControl: string;

    @Column({ name: 'cabeza_control_obs', nullable: true })
    cabezaControlObs: string;

    @Column({ nullable: true })
    em100: string;

    @Column({ name: 'em100_obs', nullable: true })
    em100Obs: string;

    @Column({ nullable: true })
    limpieza: string;

    @Column({ name: 'limpieza_obs', nullable: true })
    limpiezaObs: string;

    @Column({ name: 'tablero_electrico', nullable: true })
    tableroElectrico: string;

    @Column({ name: 'tablero_electrico_obs', nullable: true })
    tableroElectricoObs: string;

    @Column({ name: 'reporte_digital', nullable: true })
    reporteDigital: string;

    @Column({ name: 'reporte_digital_obs', nullable: true })
    reporteDigitalObs: string;

    @Column({ nullable: true })
    observaciones: string;

    @Column({ name: 'al_aire', nullable: true })
    alAire: boolean;

    @Column({ name: 'v_rectificador', nullable: true })
    vRectificador: string;

    @Column({ name: 'v_1hora', nullable: true })
    v1hora: string;

    @Column({ nullable: true })
    modulacion: string;

    @Column({ name: 'modulacion_obs', nullable: true })
    modulacionObs: string;

    @Column({ name: 'piso_ruido', nullable: true })
    pisoRuido: string;

    @Column({ name: 'piso_ruido_obs', nullable: true })
    pisoRuidoObs: string;

    @Column({ nullable: true })
    squelch: string;

    @Column({ name: 'squelch_obs', nullable: true })
    squelchObs: string;

    @Column({ name: 'puesta_tierra', nullable: true })
    puestaTierra: string;

    @Column({ name: 'puesta_tierra_obs', nullable: true })
    puestaTierraObs: string;

    @Column({ name: 'roe_local', nullable: true })
    roeLocal: string;

    @Column({ name: 'roe_externo', nullable: true })
    roeExterno: string;

    @Column({ name: 'roe_obs', nullable: true })
    roeObs: string;

    @Column({ name: 'potencia_local', nullable: true })
    potenciaLocal: string;

    @Column({ name: 'potencia_externo', nullable: true })
    potenciaExterno: string;

    @Column({ name: 'potencia_obs', nullable: true })
    potenciaObs: string;

    @Column({ nullable: true })
    firmaTecnico: string;

    @Column({ nullable: true })
    fechaFirmaTecnico: Date;

    @Column({ nullable: true })
    firmaCoordinador: string;

    @Column({ nullable: true })
    fechaFirmaCoordinador: Date;

    @Column({ name: 'firma_digital_local', nullable: true })
    firmaDigitalLocal: string;

    @Column({ name: 'firma_digital_regional', nullable: true })
    firmaDigitalRegional: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @Column({ name: 'aeropuerto_id', nullable: true })
    aeropuertoId: number;

    @Column({ name: 'tecnico_id', nullable: true })
    tecnicoId: number;

    @Column({ name: 'equipo_id', nullable: true })
    equipoId: number;

    @ManyToOne(() => Aeropuerto)
    @JoinColumn({ name: 'aeropuerto_id' })
    aeropuerto: Aeropuerto;

    @ManyToOne(() => Equipo)
    @JoinColumn({ name: 'equipo_id' })
    equipo: Equipo;

    @ManyToOne(() => Personal)
    @JoinColumn({ name: 'tecnico_id' })
    tecnico: Personal;

    @OneToOne(() => WorkOrder, (wo) => wo.checklist)
    workOrder: WorkOrder;
}
