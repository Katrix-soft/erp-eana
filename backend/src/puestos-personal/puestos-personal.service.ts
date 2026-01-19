import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PuestoPersonal } from './entities/puesto-personal.entity';

@Injectable()
export class PuestosPersonalService {
    constructor(
        @InjectRepository(PuestoPersonal) private puestoPersonalRepository: Repository<PuestoPersonal>
    ) { }

    async create(data: any) {
        // Warning: TypeORM create accepts partial entity, data might need validation or shaping if it comes raw from Prisma style
        // Assuming data is compatible with entity structure
        const puesto = this.puestoPersonalRepository.create(data);
        return this.puestoPersonalRepository.save(puesto);
    }

    async findAll() {
        return this.puestoPersonalRepository.find();
    }

    async findOne(id: number) {
        return this.puestoPersonalRepository.findOne({
            where: { id },
        });
    }

    async update(id: number, data: any) {
        await this.puestoPersonalRepository.update(id, data);
        return this.findOne(id);
    }

    async remove(id: number) {
        return this.puestoPersonalRepository.delete(id);
    }
}
