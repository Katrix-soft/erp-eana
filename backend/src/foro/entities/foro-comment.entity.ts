
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ForoPost } from './foro-post.entity';

@Entity('foro_comments')
export class ForoComment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'post_id' })
    postId: number;

    @Column({ name: 'autor_id' })
    autorId: number;

    @Column('text')
    contenido: string;

    @Column('text', { array: true, default: '{}' })
    imagenes: string[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @ManyToOne(() => ForoPost, (post) => post.comentarios, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'post_id' })
    post: ForoPost;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'autor_id' })
    autor: User;
}
