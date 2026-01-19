import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { FrecuenciasService } from './frecuencias.service';
import { CreateFrecuenciaDto } from './dto/create-frecuencia.dto';
import { UpdateFrecuenciaDto } from './dto/update-frecuencia.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Activos: VHF (Frecuencias)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('frecuencias')
export class FrecuenciasController {
    constructor(private readonly frecuenciasService: FrecuenciasService) { }

    @Post()
    @ApiOperation({ summary: 'Create new frequency' })
    create(@Body() createFrecuenciaDto: CreateFrecuenciaDto) {
        return this.frecuenciasService.create(createFrecuenciaDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all frequencies with optional filtering' })
    findAll(@Query('fir') fir?: string, @Query('aeropuerto') aeropuerto?: string) {
        return this.frecuenciasService.findAll({ fir, aeropuerto });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get frequency by ID' })
    findOne(@Param('id') id: string) {
        return this.frecuenciasService.findOne(+id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update frequency' })
    update(@Param('id') id: string, @Body() updateFrecuenciaDto: UpdateFrecuenciaDto) {
        return this.frecuenciasService.update(+id, updateFrecuenciaDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete frequency' })
    remove(@Param('id') id: string) {
        return this.frecuenciasService.remove(+id);
    }
}
