import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    async create(createUserDto: CreateUserDto) {
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        const newUser = this.userRepository.create({
            ...createUserDto,
            password: hashedPassword,
        });
        return this.userRepository.save(newUser);
    }

    findAll() {
        return this.userRepository.find({
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
            },
            relations: {
                personal: {
                    aeropuerto: true,
                    fir: true
                }
            }
        });
    }

    findOne(id: number) {
        return this.userRepository.findOne({
            where: { id },
            relations: ['personal'],
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
            }
        });
    }

    async update(id: number, updateUserDto: UpdateUserDto) {
        if (updateUserDto.password) {
            updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
        }
        await this.userRepository.update(id, updateUserDto);
        return this.findOne(id);
    }

    async remove(id: number) {
        const user = await this.findOne(id);
        if (user) {
            return this.userRepository.remove(user);
        }
        return null; // Or throw NotFoundException
    }
}
