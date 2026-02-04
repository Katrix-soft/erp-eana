import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Aeropuerto } from './entities/aeropuerto.entity';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class AeropuertosService {
    constructor(
        @InjectRepository(Aeropuerto)
        private aeropuertoRepository: Repository<Aeropuerto>,
        @Optional() private cache?: CacheService
    ) { }

    async create(data: any) {
        const newItem = this.aeropuertoRepository.create(data);
        const result = await this.aeropuertoRepository.save(newItem);

        // Invalidar cache
        if (this.cache) {
            await this.cache.del('catalog:aeropuertos:all').catch(() => { });
        }

        return result;
    }

    async findAll() {
        if (this.cache) {
            return this.cache.getOrSet(
                'catalog:aeropuertos:all',
                () => this.aeropuertoRepository.find({ relations: ['fir'] }),
                3600 // 1 hora
            );
        }
        return this.aeropuertoRepository.find({ relations: ['fir'] });
    }

    async findOne(id: number) {
        if (this.cache) {
            return this.cache.getOrSet(
                `aeropuerto:${id}`,
                () => this.aeropuertoRepository.findOne({
                    where: { id },
                    relations: ['fir']
                }),
                1800 // 30 minutos
            );
        }
        return this.aeropuertoRepository.findOne({
            where: { id },
            relations: ['fir']
        });
    }

    async update(id: number, data: any) {
        await this.aeropuertoRepository.update(id, data);

        // Invalidar caches
        if (this.cache) {
            await this.cache.del(`aeropuerto:${id}`).catch(() => { });
            await this.cache.del('catalog:aeropuertos:all').catch(() => { });
        }

        return this.findOne(id);
    }

    async remove(id: number) {
        const result = await this.aeropuertoRepository.delete(id);

        // Invalidar caches
        if (this.cache) {
            await this.cache.del(`aeropuerto:${id}`).catch(() => { });
            await this.cache.del('catalog:aeropuertos:all').catch(() => { });
        }

        return result;
    }
}
