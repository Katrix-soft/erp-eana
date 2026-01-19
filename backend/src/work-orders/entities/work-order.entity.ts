
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Equipo } from '../../equipos/entities/equipo.entity';
import { Checklist } from '../../checklists/entities/checklist.entity';
import { Prioridad, EstadoOT } from '../../common/enums/shared.enums';

@Entity('work_orders')
export class WorkOrder {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    numero: string;

    @Column({ name: 'equipo_id' })
    equipoId: number;

    @Column({ name: 'solicitante_id' })
    solicitanteId: number;

    @Column({ name: 'tecnico_id', nullable: true })
    tecnicoId: number;

    @Column({
        type: 'enum',
        enum: Prioridad,
        default: Prioridad.MEDIA
    })
    prioridad: Prioridad;

    @Column({
        type: 'enum',
        enum: EstadoOT,
        default: EstadoOT.ABIERTA
    })
    estado: EstadoOT;

    @Column()
    descripcion: string;

    @Column({ nullable: true })
    observaciones: string;

    @Column({ name: 'fecha_inicio', default: () => 'CURRENT_TIMESTAMP' })
    fechaInicio: Date;

    @Column({ name: 'fecha_fin', nullable: true })
    fechaFin: Date;

    @Column({ name: 'checklist_id', nullable: true, unique: true })
    checklistId: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @OneToOne(() => Checklist) // , (checklist) => checklist.workOrder
    @JoinColumn({ name: 'checklist_id' })
    checklist: Checklist;

    @ManyToOne(() => Equipo) // , (equipo) => equipo.workOrders
    @JoinColumn({ name: 'equipo_id' })
    equipo: Equipo;

    @ManyToOne(() => User) // , (user) => user.solicitanteOTs
    @JoinColumn({ name: 'solicitante_id' })
    solicitante: User;

    @ManyToOne(() => User) // , (user) => user.asignadoOTs
    @JoinColumn({ name: 'tecnico_id' })
    tecnicoAsignado: User;
}
