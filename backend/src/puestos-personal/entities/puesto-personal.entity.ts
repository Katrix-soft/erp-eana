
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, Unique } from 'typeorm';
import { Sector } from '../../common/enums/shared.enums';
import { Personal } from '../../personal/entities/personal.entity';
// import { Navegacion } from '../../navegacion/entities/navegacion.entity';

@Entity('puestos_personal')
@Unique(['nombre', 'sector'])
export class PuestoPersonal {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    nombre: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @Column({
        type: 'enum',
        enum: Sector,
        default: Sector.CNSE,
        nullable: true
    })
    sector: Sector;

    @OneToMany(() => Personal, (personal) => personal.puesto)
    personal: Personal[];

    // Uncomment when Navegacion is created
    // @OneToMany(() => Navegacion, (nav) => nav.puesto)
    // navegacion: Navegacion[];
}
