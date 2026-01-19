import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ComunicacionesService } from './comunicaciones.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Activos: Comunicaciones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('comunicaciones')
export class ComunicacionesController {
    constructor(private readonly comunicacionesService: ComunicacionesService) { }

    @Get()
    findAll() {
        return this.comunicacionesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.comunicacionesService.findOne(+id);
    }

    @Post()
    create(@Body() createDto: any) {
        return this.comunicacionesService.create(createDto);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() updateDto: any) {
        return this.comunicacionesService.update(+id, updateDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.comunicacionesService.remove(+id);
    }
}
