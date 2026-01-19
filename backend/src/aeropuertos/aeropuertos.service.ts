import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Aeropuerto } from './entities/aeropuerto.entity';

@Injectable()
export class AeropuertosService {
    constructor(
        @InjectRepository(Aeropuerto)
        private aeropuertoRepository: Repository<Aeropuerto>
    ) { }

    async create(data: any) {
        // data usually comes as DTO, assume it matches entity or handle mapping
        // TypeORM create doesn't assume DTO = entity 1:1 always but mostly yes for keys
        const newItem = this.aeropuertoRepository.create(data);
        return this.aeropuertoRepository.save(newItem);
    }

    async findAll() {
        return this.aeropuertoRepository.find({
            relations: ['fir']
        });
    }

    async findOne(id: number) {
        return this.aeropuertoRepository.findOne({
            where: { id },
            relations: ['fir']
        });
    }

    async update(id: number, data: any) {
        await this.aeropuertoRepository.update(id, data);
        return this.findOne(id);
    }

    async remove(id: number) {
        // TypeORM remove needs entity, delete needs criteria
        return this.aeropuertoRepository.delete(id);
    }
}
