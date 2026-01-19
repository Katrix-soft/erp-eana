
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Sector } from '../../common/enums/shared.enums';
import { Turno } from './turno.entity';
import { PuestoPersonal } from '../../puestos-personal/entities/puesto-personal.entity';
import { Aeropuerto } from '../../aeropuertos/entities/aeropuerto.entity';
import { Fir } from '../../firs/entities/fir.entity';
// import { Checklist } from '../../checklists/entities/checklist.entity';

@Entity('personal')
export class Personal {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    nombre: string;

    @Column()
    apellido: string;

    @Column({ unique: true, nullable: true })
    dni: string;

    @Column({ name: 'puesto_id' })
    puestoId: number;

    @Column({ name: 'aeropuerto_id', nullable: true })
    aeropuertoId: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @Column({ name: 'user_id', nullable: true, unique: true })
    userId: number;

    @Column({
        type: 'enum',
        enum: Sector,
        default: Sector.CNSE,
        nullable: true
    })
    sector: Sector;

    @Column({ name: 'fir_id', nullable: true })
    firId: number;

    @ManyToOne(() => Aeropuerto, (aeropuerto) => aeropuerto.personal)
    @JoinColumn({ name: 'aeropuerto_id' })
    aeropuerto: Aeropuerto;

    @ManyToOne(() => Fir, (fir) => fir.personal)
    @JoinColumn({ name: 'fir_id' })
    fir: Fir;

    @ManyToOne(() => PuestoPersonal, (puesto) => puesto.personal)
    @JoinColumn({ name: 'puesto_id' })
    puesto: PuestoPersonal;

    @OneToOne(() => User, (user) => user.personal)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @OneToMany(() => Turno, (turno) => turno.personal)
    turnos: Turno[];

    // Uncomment when Checklist is created
    // @OneToMany(() => Checklist, (checklist) => checklist.tecnico)
    // checklists: Checklist[];
}
