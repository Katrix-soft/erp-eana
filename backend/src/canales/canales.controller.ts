import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { CanalesService } from './canales.service';
import { CreateCanalDto } from './dto/create-canal.dto';
import { UpdateCanalDto } from './dto/update-canal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Activos: VHF (Canales)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('canales')
export class CanalesController {
    constructor(private readonly canalesService: CanalesService) { }

    @Post()
    create(@Body() createCanalDto: CreateCanalDto) {
        return this.canalesService.create(createCanalDto);
    }

    @Get()
    findAll(@Query('fir') fir?: string, @Query('aeropuerto') aeropuerto?: string) {
        return this.canalesService.findAll({ fir, aeropuerto });
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.canalesService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateCanalDto: UpdateCanalDto) {
        return this.canalesService.update(+id, updateCanalDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.canalesService.remove(+id);
    }
}
