
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Fir } from '../../firs/entities/fir.entity';
// import { Checklist } from '../../checklists/entities/checklist.entity';
// import { Comunicaciones } from '../../comunicaciones/entities/comunicaciones.entity';
// import { Energia } from '../../energia/entities/energia.entity';
// import { Navegacion } from '../../navegacion/entities/navegacion.entity';
// import { Notification } from '../../notifications/entities/notification.entity';
import { Personal } from '../../personal/entities/personal.entity';
// import { Vigilancia } from '../../vigilancia/entities/vigilancia.entity';
// import { VorMeasurement } from '../../vor/entities/vor-measurement.entity';
// import { ForoPost } from '../../foro/entities/foro-post.entity';
// import { ChatRoom } from '../../chat/entities/chat-room.entity';

@Entity('aeropuertos')
export class Aeropuerto {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    nombre: string;

    @Column({ unique: true, nullable: true })
    codigo: string;

    @Column({ name: 'fir_id' })
    firId: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @ManyToOne(() => Fir, (fir) => fir.aeropuertos)
    @JoinColumn({ name: 'fir_id' })
    fir: Fir;

    @OneToMany(() => Personal, (personal) => personal.aeropuerto)
    personal: Personal[];

    // Uncomment after creating other entities

    // @OneToMany(() => Checklist, (checklist) => checklist.aeropuerto)
    // checklists: Checklist[];

    // @OneToMany(() => Comunicaciones, (com) => com.aeropuerto)
    // comunicaciones: Comunicaciones[];

    // @OneToMany(() => Energia, (energ) => energ.aeropuerto)
    // energia: Energia[];

    // @OneToMany(() => Navegacion, (nav) => nav.aeropuerto)
    // navegacion: Navegacion[];

    // @OneToMany(() => Notification, (notif) => notif.aeropuerto)
    // notifications: Notification[];

    // @OneToMany(() => Vigilancia, (vig) => vig.aeropuerto)
    // vigilancia: Vigilancia[];

    // @OneToMany(() => VorMeasurement, (vor) => vor.aeropuerto)
    // vorMeasurements: VorMeasurement[];

    // @OneToMany(() => ForoPost, (post) => post.aeropuerto)
    // foroPosts: ForoPost[];

    // @OneToMany(() => ChatRoom, (room) => room.aeropuerto)
    // chatRooms: ChatRoom[];
}
