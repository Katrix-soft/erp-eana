import { Controller, Get, Post, Put, Delete, Query, Body, Param, UseGuards } from '@nestjs/common';
import { EquiposService } from './equipos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Activos: Equipos (Global)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('equipos')
export class EquiposController {
    constructor(private readonly equiposService: EquiposService) { }

    @Get('statistics')
    getStats() {
        console.log('API Request: /equipos/statistics');
        return this.equiposService.getDashboardStats();
    }

    @Get()
    findAll(
        @Query('fir') fir?: string,
        @Query('aeropuerto') aeropuerto?: string,
        @Query('sector') sector?: string
    ) {
        return this.equiposService.findAll({ fir, aeropuerto, sector });
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.equiposService.findOne(+id);
    }

    @Post()
    create(@Body() createDto: any) {
        console.log('API Request: POST /equipos', createDto);
        return this.equiposService.create(createDto);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() updateDto: any) {
        console.log('API Request: PUT /equipos/' + id, updateDto);
        return this.equiposService.update(+id, updateDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        console.log('API Request: DELETE /equipos/' + id);
        return this.equiposService.remove(+id);
    }
}
