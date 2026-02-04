
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Vhf } from '../../vhf/entities/vhf.entity';
import { Vor } from '../../vor/entities/vor.entity';
import { EstadoEquipo } from '../../common/enums/shared.enums';
import { Canal } from '../../canales/entities/canal.entity';
import { Frecuencia } from '../../frecuencias/entities/frecuencia.entity';
// import { Checklist } from '../../checklists/entities/checklist.entity';
// import { WorkOrder } from '../../work-orders/entities/work-order.entity';
// import { ForoPost } from '../../foro/entities/foro-post.entity';

@Entity('equipos')
export class Equipo {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'vhf_id', nullable: true })
    vhfId: number;

    @Column({ name: 'vor_id', nullable: true })
    vorId: number;

    @Column({ name: 'tipo_equipo' })
    tipoEquipo: string;

    @Column()
    marca: string;

    @Column()
    modelo: string;

    @Column({ name: 'numero_serie' })
    numeroSerie: string;

    @Column({ nullable: true })
    tecnologia: string;

    @Column({ name: 'activo_fijo', nullable: true })
    activoFijo: string;

    @Column({
        type: 'enum',
        enum: EstadoEquipo,
        default: EstadoEquipo.OK
    })
    estado: EstadoEquipo;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @ManyToOne(() => Vhf, (vhf) => vhf.equipos, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'vhf_id' })
    vhf: Vhf;

    @ManyToOne(() => Vor, (vor) => vor.equipos, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'vor_id' })
    vor: Vor;

    @OneToMany(() => Canal, (canal) => canal.equipoVhf)
    canales: Canal[];

    @OneToMany(() => Frecuencia, (frecuencia) => frecuencia.equipoVhf)
    frecuencias: Frecuencia[];

    // Uncomment when entities are created
    // @OneToMany(() => Checklist, (checklist) => checklist.equipo)
    // checklists: Checklist[];

    // @OneToMany(() => WorkOrder, (wo) => wo.equipo)
    // workOrders: WorkOrder[];

    // @OneToMany(() => ForoPost, (post) => post.equipo)
    // foroPosts: ForoPost[];
}
