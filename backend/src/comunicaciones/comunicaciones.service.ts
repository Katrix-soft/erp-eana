import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comunicaciones } from './entities/comunicaciones.entity';

@Injectable()
export class ComunicacionesService {
    constructor(
        @InjectRepository(Comunicaciones) private comunicacionesRepository: Repository<Comunicaciones>
    ) { }

    async findAll() {
        return this.comunicacionesRepository.find({
            relations: ['aeropuerto', 'aeropuerto.fir']
        });
    }

    async findOne(id: number) {
        return this.comunicacionesRepository.findOne({
            where: { id },
            relations: ['aeropuerto', 'aeropuerto.fir']
        });
    }

    async create(createDto: any) {
        // Warning: createDto might contain nested objects or simple fields. TypeORM create expects entity-like object.
        const entity = this.comunicacionesRepository.create(createDto);
        return this.comunicacionesRepository.save(entity);
    }

    async update(id: number, updateDto: any) {
        await this.comunicacionesRepository.update(id, updateDto);
        return this.findOne(id);
    }

    async remove(id: number) {
        return this.comunicacionesRepository.delete(id);
    }
}
