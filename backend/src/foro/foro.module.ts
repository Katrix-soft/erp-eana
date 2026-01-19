import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ForoController } from './foro.controller';
import { ForoService } from './foro.service';
import { ForoPost } from './entities/foro-post.entity';
import { ForoComment } from './entities/foro-comment.entity';

@Module({
    imports: [TypeOrmModule.forFeature([ForoPost, ForoComment])],
    controllers: [ForoController],
    providers: [ForoService],
    exports: [ForoService],
})
export class ForoModule { }
