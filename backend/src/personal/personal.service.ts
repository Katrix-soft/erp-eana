import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Personal } from './entities/personal.entity';

@Injectable()
export class PersonalService {
    constructor(
        @InjectRepository(Personal)
        private personalRepository: Repository<Personal>
    ) { }

    async create(data: any) {
        const newItem = this.personalRepository.create(data);
        return this.personalRepository.save(newItem);
    }

    async findAll() {
        return this.personalRepository.find({
            relations: ['aeropuerto', 'aeropuerto.fir', 'fir', 'puesto', 'user'],
            // Note: TypeORM doesn't support nested select in standard find() relations easily.
            // It loads the full user object. If selection is critical, use QueryBuilder.
            // For now, loading full user is acceptable but we should sanitize output in controller or interceptor ideally.
        });
    }

    async findOne(id: number) {
        return this.personalRepository.findOne({
            where: { id },
            relations: ['aeropuerto', 'aeropuerto.fir', 'fir', 'puesto', 'user']
        });
    }

    async update(id: number, data: any) {
        await this.personalRepository.update(id, data);
        return this.findOne(id);
    }

    async remove(id: number) {
        return this.personalRepository.delete(id);
    }
}
