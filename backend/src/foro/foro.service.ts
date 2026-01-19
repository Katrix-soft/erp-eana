import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ForoPost } from './entities/foro-post.entity';
import { ForoComment } from './entities/foro-comment.entity';
import { Sector } from '../common/enums/shared.enums';
import { IsString, IsOptional, IsEnum, IsNumber, IsArray, MinLength } from 'class-validator';

export class CreateForoPostDto {
    @IsString()
    @MinLength(3)
    titulo: string;

    @IsString()
    @MinLength(10)
    contenido: string;

    @IsOptional()
    @IsNumber()
    aeropuertoId?: number;

    @IsOptional()
    @IsNumber()
    firId?: number;

    @IsOptional()
    @IsEnum(Sector)
    sector?: Sector;

    @IsOptional()
    @IsNumber()
    equipoId?: number;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    imagenes?: string[];
}

export class CreateForoCommentDto {
    @IsString()
    @MinLength(1)
    contenido: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    imagenes?: string[];
}

export class UpdateForoPostDto {
    @IsOptional()
    @IsString()
    titulo?: string;

    @IsOptional()
    @IsString()
    contenido?: string;

    @IsOptional()
    resuelto?: boolean;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    imagenes?: string[];
}

@Injectable()
export class ForoService {
    constructor(
        @InjectRepository(ForoPost) private foroPostRepository: Repository<ForoPost>,
        @InjectRepository(ForoComment) private foroCommentRepository: Repository<ForoComment>
    ) { }

    async createPost(autorId: number, dto: CreateForoPostDto) {
        const post = this.foroPostRepository.create({
            ...dto,
            autorId: autorId,
            aeropuertoId: dto.aeropuertoId || null,
            firId: dto.firId || null,
            equipoId: dto.equipoId || null,
        });

        const saved = await this.foroPostRepository.save(post);
        return this.findOne(saved.id);
    }

    async findAll(filters?: {
        aeropuertoId?: number;
        firId?: number;
        sector?: Sector;
        resuelto?: boolean;
        page?: number;
        limit?: number;
    }) {
        const page = filters?.page ?? 1;
        const limit = filters?.limit ?? 20;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (filters?.aeropuertoId) where.aeropuerto = { id: filters.aeropuertoId };
        if (filters?.firId) where.fir = { id: filters.firId };
        if (filters?.sector) where.sector = filters.sector;
        if (filters?.resuelto !== undefined) where.resuelto = filters.resuelto;

        const posts = await this.foroPostRepository.find({
            where,
            skip,
            take: limit,
            order: { createdAt: 'DESC' },
            relations: [
                'autor', 'autor.personal',
                'aeropuerto', 'fir', 'equipo',
                'comentarios'
            ]
        });

        // Add comment count manually since standard find doesn't include count easily without loadRelationCountAndMap
        // Or we can just use comments.length if we loaded them.
        // Prisma `_count`. TypeORM `loadRelationCountAndMap` or just map array length.

        return posts.map(p => ({
            ...p,
            _count: { comments: p.comentarios ? p.comentarios.length : 0 }
        }));
    }

    async findOne(id: number) {
        const post = await this.foroPostRepository.findOne({
            where: { id },
            relations: [
                'autor', 'autor.personal',
                'aeropuerto', 'fir', 'equipo',
                'comentarios', 'comentarios.autor', 'comentarios.autor.personal'
            ],
            order: {
                comentarios: { createdAt: 'ASC' } // Order comments
            }
        });

        if (!post) {
            throw new NotFoundException(`Post con ID ${id} no encontrado`);
        }

        // Incrementar vistas
        await this.foroPostRepository.increment({ id }, 'vistas', 1);

        return post;
    }

    async updatePost(id: number, autorId: number, dto: UpdateForoPostDto) {
        const post = await this.foroPostRepository.findOne({
            where: { id },
            relations: ['autor']
        });

        if (!post) {
            throw new NotFoundException(`Post con ID ${id} no encontrado`);
        }

        if (post.autor?.id !== autorId && post.autorId !== autorId) { // Check both relation or column
            throw new ForbiddenException('No tienes permiso para editar este post');
        }

        await this.foroPostRepository.update(id, dto);
        return this.findOne(id);
    }

    async deletePost(id: number, autorId: number) {
        const post = await this.foroPostRepository.findOne({ where: { id } });

        if (!post) {
            throw new NotFoundException(`Post con ID ${id} no encontrado`);
        }

        if (post.autorId !== autorId) {
            // TypeORM entity usually has the foreign key column 'autorId' if defined in entity
            // If not, we rely on relation.
            throw new ForbiddenException('No tienes permiso para eliminar este post');
        }

        return this.foroPostRepository.delete(id);
    }

    async createComment(postId: number, autorId: number, dto: CreateForoCommentDto) {
        const post = await this.foroPostRepository.findOne({ where: { id: postId } });

        if (!post) {
            throw new NotFoundException(`Post con ID ${postId} no encontrado`);
        }

        const comment = this.foroCommentRepository.create({
            post: { id: postId },
            autor: { id: autorId },
            contenido: dto.contenido,
            imagenes: dto.imagenes || [],
        });

        const saved = await this.foroCommentRepository.save(comment);

        // Return with author info
        return this.foroCommentRepository.findOne({
            where: { id: saved.id },
            relations: ['autor', 'autor.personal']
        });
    }

    async deleteComment(id: number, autorId: number) {
        const comment = await this.foroCommentRepository.findOne({ where: { id } });

        if (!comment) {
            throw new NotFoundException(`Comentario con ID ${id} no encontrado`);
        }

        if (comment.autorId !== autorId) {
            throw new ForbiddenException('No tienes permiso para eliminar este comentario');
        }

        return this.foroCommentRepository.delete(id);
    }
}
