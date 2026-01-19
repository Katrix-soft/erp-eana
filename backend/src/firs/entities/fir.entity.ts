
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Aeropuerto } from '../../aeropuertos/entities/aeropuerto.entity';
// import { Navegacion } from '../../navegacion/entities/navegacion.entity';
// import { Notification } from '../../notifications/entities/notification.entity';
import { Personal } from '../../personal/entities/personal.entity';
// import { Vigilancia } from '../../vigilancia/entities/vigilancia.entity';
// import { Energia } from '../../energia/entities/energia.entity';
// import { ForoPost } from '../../foro/entities/foro-post.entity';
// import { ChatRoom } from '../../chat/entities/chat-room.entity';

@Entity('firs')
export class Fir {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    nombre: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @OneToMany(() => Aeropuerto, (aeropuerto) => aeropuerto.fir)
    aeropuertos: Aeropuerto[];

    @OneToMany(() => Personal, (personal) => personal.fir)
    personal: Personal[];

    // Uncomment when entities are created

    // @OneToMany(() => Navegacion, (nav) => nav.firRel)
    // navegacion: Navegacion[];

    // @OneToMany(() => Notification, (notif) => notif.fir)
    // notifications: Notification[];

    // @OneToMany(() => Vigilancia, (vig) => vig.firRel)
    // vigilancia: Vigilancia[];

    // @OneToMany(() => Energia, (energ) => energ.firRel)
    // energia: Energia[];

    // @OneToMany(() => ForoPost, (post) => post.fir)
    // foroPosts: ForoPost[];

    // @OneToMany(() => ChatRoom, (room) => room.fir)
    // chatRooms: ChatRoom[];
}
