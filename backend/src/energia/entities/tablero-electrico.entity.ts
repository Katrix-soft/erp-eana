
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Aeropuerto } from '../../aeropuertos/entities/aeropuerto.entity';
import { EstadoEquipo, TipoComponenteElectrico } from '../../common/enums/shared.enums';

@Entity('tableros_electricos')
export class TableroElectrico {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    nombre: string; // Ej: TS1, TGBT, etc.

    @Column({ nullable: true })
    ubicacion: string;

    @Column({ nullable: true })
    descripcion: string;

    @Column({
        type: 'enum',
        enum: EstadoEquipo,
        default: EstadoEquipo.OK
    })
    estado: EstadoEquipo;

    @Column({ name: 'aeropuerto_id', nullable: true })
    aeropuertoId: number;

    @ManyToOne(() => Aeropuerto)
    @JoinColumn({ name: 'aeropuerto_id' })
    aeropuerto: Aeropuerto;

    @OneToMany(() => ComponenteTablero, (componente) => componente.tablero, { cascade: true })
    componentes: ComponenteTablero[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}

@Entity('componentes_tablero')
export class ComponenteTablero {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: 'enum',
        enum: TipoComponenteElectrico,
        default: TipoComponenteElectrico.TERMICA
    })
    tipo: TipoComponenteElectrico;

    @Column({ nullable: true })
    nombre: string; // Ej: C1, "Iluminación", etc.

    @Column({ nullable: true })
    amperaje: string; // Ej: 16A, 25A

    @Column({ nullable: true })
    marca: string;

    @Column({ nullable: true })
    modelo: string;

    @Column({ nullable: true })
    polos: number; // Ej: 1, 2, 4 (Monofásico, Tetrapolar)

    @Column({ name: 'tablero_id' })
    tableroId: number;

    @ManyToOne(() => TableroElectrico, (tablero) => tablero.componentes)
    @JoinColumn({ name: 'tablero_id' })
    tablero: TableroElectrico;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
