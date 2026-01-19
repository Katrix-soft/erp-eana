import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, In, ILike } from 'typeorm';
import { Frecuencia } from './entities/frecuencia.entity';
import { Aeropuerto } from '../aeropuertos/entities/aeropuerto.entity';
import { CreateFrecuenciaDto } from './dto/create-frecuencia.dto';
import { UpdateFrecuenciaDto } from './dto/update-frecuencia.dto';

@Injectable()
export class FrecuenciasService {
    constructor(
        @InjectRepository(Frecuencia) private frecuenciaRepository: Repository<Frecuencia>,
        @InjectRepository(Aeropuerto) private aeropuertoRepository: Repository<Aeropuerto>
    ) { }

    create(createFrecuenciaDto: CreateFrecuenciaDto) {
        const entity = this.frecuenciaRepository.create(createFrecuenciaDto);
        return this.frecuenciaRepository.save(entity);
    }

    async findAll(filters?: { fir?: string; aeropuerto?: string }) {
        const qb = this.frecuenciaRepository.createQueryBuilder('frecuencia')
            .leftJoinAndSelect('frecuencia.equipoVhf', 'equipoVhf')
            .leftJoinAndSelect('equipoVhf.vhf', 'vhf')
            .leftJoinAndSelect('frecuencia.canal', 'canal');

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
        return this.frecuenciaRepository.findOne({
            where: { id },
            relations: ['equipoVhf', 'canal']
        });
    }

    async update(id: number, updateFrecuenciaDto: UpdateFrecuenciaDto) {
        await this.frecuenciaRepository.update(id, updateFrecuenciaDto);
        return this.findOne(id);
    }

    async remove(id: number) {
        return this.frecuenciaRepository.delete(id);
    }
}
