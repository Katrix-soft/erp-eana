
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('authenticators')
export class Authenticator {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    credentialID: string;

    @Column('bytea')
    credentialPublicKey: Buffer;

    @Column('bigint')
    counter: string; // or number or BigInt depending on usage, TypeORM handles bigint as string by default

    @Column()
    credentialDeviceType: string;

    @Column()
    credentialBackedUp: boolean;

    @Column({ nullable: true })
    transports: string;

    @Column()
    userId: number;

    @ManyToOne(() => User, (user) => user.authenticators, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' }) // or user_id? Prisma had fields: [userId], User has id Int. The DB column name matters.
    user: User;
}
