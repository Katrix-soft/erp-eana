import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ForoService, CreateForoPostDto, CreateForoCommentDto, UpdateForoPostDto } from './foro.service';
import { Sector } from '../common/enums/shared.enums';

@Controller('foro')
@UseGuards(JwtAuthGuard)
export class ForoController {
    constructor(private readonly foroService: ForoService) { }

    @Post('posts')
    async createPost(@Request() req, @Body() dto: CreateForoPostDto) {
        return this.foroService.createPost(req.user.userId, dto);
    }

    @Get('posts')
    async findAllPosts(
        @Query('aeropuertoId') aeropuertoId?: string,
        @Query('firId') firId?: string,
        @Query('sector') sector?: Sector,
        @Query('resuelto') resuelto?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const filters: any = {};

        if (aeropuertoId) filters.aeropuertoId = parseInt(aeropuertoId);
        if (firId) filters.firId = parseInt(firId);
        if (sector) filters.sector = sector;
        if (resuelto !== undefined) filters.resuelto = resuelto === 'true';
        if (page) filters.page = parseInt(page);
        if (limit) filters.limit = parseInt(limit);

        return this.foroService.findAll(filters);
    }


    @Get('posts/:id')
    async findOnePost(@Param('id', ParseIntPipe) id: number) {
        return this.foroService.findOne(id);
    }

    @Put('posts/:id')
    async updatePost(
        @Param('id', ParseIntPipe) id: number,
        @Request() req,
        @Body() dto: UpdateForoPostDto,
    ) {
        return this.foroService.updatePost(id, req.user.userId, dto);
    }

    @Delete('posts/:id')
    async deletePost(@Param('id', ParseIntPipe) id: number, @Request() req) {
        return this.foroService.deletePost(id, req.user.userId);
    }

    @Post('posts/:id/comments')
    async createComment(
        @Param('id', ParseIntPipe) id: number,
        @Request() req,
        @Body() dto: CreateForoCommentDto,
    ) {
        return this.foroService.createComment(id, req.user.userId, dto);
    }

    @Delete('comments/:id')
    async deleteComment(@Param('id', ParseIntPipe) id: number, @Request() req) {
        return this.foroService.deleteComment(id, req.user.userId);
    }
}
