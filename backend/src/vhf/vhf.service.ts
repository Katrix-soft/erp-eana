import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, In } from 'typeorm';
import { Vhf } from './entities/vhf.entity';
import { Personal } from '../personal/entities/personal.entity';
import { Aeropuerto } from '../aeropuertos/entities/aeropuerto.entity';
import { CreateVhfDto } from './dto/create-vhf.dto';
import { UpdateVhfDto } from './dto/update-vhf.dto';

@Injectable()
export class VhfService {
    constructor(
        @InjectRepository(Vhf)
        private vhfRepository: Repository<Vhf>,
        @InjectRepository(Personal)
        private personalRepository: Repository<Personal>,
        @InjectRepository(Aeropuerto)
        private aeropuertoRepository: Repository<Aeropuerto>,
    ) { }

    create(createVhfDto: CreateVhfDto) {
        const newVhf = this.vhfRepository.create(createVhfDto);
        return this.vhfRepository.save(newVhf);
    }

    async findAll(user: any, filters?: { fir?: string; aeropuerto?: string }) {
        let whereConditions: any[] = []; // OR array for TypeORM
        // Or if simple AND, object.

        // Si no es ADMIN o CNS_NACIONAL, forzar filtrado según su contexto
        if (user.role !== 'ADMIN' && user.role !== 'CNS_NACIONAL') {
            const personal = await this.personalRepository.findOne({
                where: { userId: user.userId }, // Assuming user.userId comes from JWT
                relations: ['aeropuerto', 'aeropuerto.fir', 'fir']
            });

            if (!personal) return [];

            // Priorizar aeropuerto si tiene uno asignado
            if (personal.aeropuerto) {
                // OR condition: exact code or name match, case insensitive
                whereConditions.push({ aeropuerto: ILike(personal.aeropuerto.codigo) });
                whereConditions.push({ aeropuerto: ILike(personal.aeropuerto.nombre) });
            } else if (personal.fir?.nombre) {
                // FIR check
                // The old prisma code said: fir contains personal.fir.nombre
                whereConditions.push({ fir: ILike(`%${personal.fir.nombre}%`) });
            } else {
                return []; // No tiene sitio asignado
            }
        } else {
            // Es Admin/Nacional
            // filters logic
            if (filters?.aeropuerto) {
                const searchVal = filters.aeropuerto.trim();
                const airportInfo = await this.aeropuertoRepository.findOne({
                    where: [
                        { nombre: ILike(searchVal) },
                        { codigo: ILike(searchVal) }
                    ]
                });

                const searchValues = [searchVal];
                if (airportInfo) {
                    if (airportInfo.nombre) searchValues.push(airportInfo.nombre);
                    if (airportInfo.codigo) searchValues.push(airportInfo.codigo);
                }

                // whereClause.aeropuerto = { in: searchValues, mode: 'insensitive' };
                // TypeORM In with ILike is NOT supported directly. We need ORs or QueryBuilder.
                // Easiest is to push multiple OR objects if we were at the top level, but 'whereConditions' is becoming our top level AND/OR?
                // Wait, if I am ADMIN, 'whereConditions' is empty so far.

                // I need to search where aeropuerto ILike value1 OR ILike value2...
                // This implies multiple objects in the 'where' array.
                for (const val of searchValues) {
                    whereConditions.push({ aeropuerto: ILike(val) });
                }
            } else if (filters?.fir) {
                const firVal = filters.fir.replace(/^FIR\s+/i, '').trim();
                whereConditions.push({ fir: ILike(`%${firVal}%`) });
            } else {
                // No filters, return all (empty where)
                whereConditions = [];
            }
        }

        // If whereConditions is empty and we are NOT filtering (Admin no filter), pass empty object or undefined
        const finalWhere = whereConditions.length > 0 ? whereConditions : undefined;

        // Note: the above Admin logic with 'filters.aeropuerto' assumes a single filter active at a time generally, 
        // or that we only filter by that. If I had 'aeropuerto' AND 'fir', the array approach is flawed (it becomes OR).
        // But original code: "else if (filters?.fir)" implies mutual exclusion.

        return this.vhfRepository.find({
            where: finalWhere,
            relations: ['equipos'],
        });
    }

    findOne(id: number) {
        return this.vhfRepository.findOne({
            where: { id },
            relations: ['equipos'],
        });
    }

    async update(id: number, updateVhfDto: UpdateVhfDto) {
        await this.vhfRepository.update(id, updateVhfDto);
        return this.findOne(id);
    }

    async remove(id: number) {
        const vhf = await this.findOne(id);
        if (vhf) {
            return this.vhfRepository.remove(vhf);
        }
        return null;
    }
}
