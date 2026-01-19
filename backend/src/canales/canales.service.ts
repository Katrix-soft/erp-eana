import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, ILike } from 'typeorm';
import { Canal } from './entities/canal.entity';
import { Aeropuerto } from '../aeropuertos/entities/aeropuerto.entity';
import { CreateCanalDto } from './dto/create-canal.dto';
import { UpdateCanalDto } from './dto/update-canal.dto';

@Injectable()
export class CanalesService {
    constructor(
        @InjectRepository(Canal) private canalRepository: Repository<Canal>,
        @InjectRepository(Aeropuerto) private aeropuertoRepository: Repository<Aeropuerto>
    ) { }

    create(createCanalDto: CreateCanalDto) {
        const entity = this.canalRepository.create(createCanalDto);
        return this.canalRepository.save(entity);
    }

    async findAll(filters?: { fir?: string; aeropuerto?: string }) {
        const qb = this.canalRepository.createQueryBuilder('canal')
            .leftJoinAndSelect('canal.equipoVhf', 'equipoVhf')
            .leftJoinAndSelect('equipoVhf.vhf', 'vhf')
            .leftJoinAndSelect('canal.frecuencias', 'frecuencias');

        if (filters?.fir || filters?.aeropuerto) {
            if (filters.fir) {
                const firName = filters.fir.replace(/^FIR\s+/i, '').trim();
                qb.andWhere('vhf.fir ILIKE :firName', { firName: `%${firName}%` });
            }

            if (filters.aeropuerto) {
                const val = filters.aeropuerto.trim();
                const airportInfo = await this.aeropuertoRepository.findOne({
                    where: [
                        { nombre: ILike(val) },
                        { codigo: ILike(val) }
                    ]
                });

                let searchVals = [val];
                if (airportInfo) {
                    if (airportInfo.nombre) searchVals.push(airportInfo.nombre);
                    if (airportInfo.codigo) searchVals.push(airportInfo.codigo);
                }

                qb.andWhere(new Brackets(qb2 => {
                    searchVals.forEach((v, i) => {
                        qb2.orWhere(`vhf.aeropuerto ILIKE :val${i}`, { [`val${i}`]: v });
                    });
                }));
            }
        }
        return qb.getMany();
    }

    findOne(id: number) {
        return this.canalRepository.findOne({
            where: { id },
            relations: ['frecuencias']
        });
    }

    async update(id: number, updateCanalDto: UpdateCanalDto) {
        await this.canalRepository.update(id, updateCanalDto);
        return this.findOne(id);
    }

    async remove(id: number) {
        return this.canalRepository.delete(id);
    }
}
