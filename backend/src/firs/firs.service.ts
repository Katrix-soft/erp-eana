import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Fir } from './entities/fir.entity';

@Injectable()
export class FirsService {
    constructor(
        @InjectRepository(Fir)
        private firRepository: Repository<Fir>
    ) { }

    async create(data: any) {
        const newItem = this.firRepository.create(data);
        return this.firRepository.save(newItem);
    }

    async findAll() {
        return this.firRepository.find({
            relations: ['aeropuertos']
        });
    }

    async findOne(id: number) {
        return this.firRepository.findOne({
            where: { id },
            relations: ['aeropuertos']
        });
    }

    async update(id: number, data: any) {
        await this.firRepository.update(id, data);
        return this.findOne(id);
    }

    async remove(id: number) {
        return this.firRepository.delete(id);
    }
}
