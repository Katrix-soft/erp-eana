import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { VhfEquiposService } from './vhf-equipos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Activos: VHF (Equipos)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vhf-equipos')
export class VhfEquiposController {
    constructor(private readonly vhfEquiposService: VhfEquiposService) { }

    // 📊 Estadísticas agregadas (cache 10 min)
    @Get('statistics')
    @ApiOperation({ summary: 'Get aggregated statistics' })
    getStatistics(@Request() req, @Query('fir') fir?: string, @Query('aeropuerto') aeropuerto?: string) {
        return this.vhfEquiposService.getStatistics(req.user, { fir, aeropuerto });
    }

    // 📋 Lista ligera (solo campos necesarios para tabla)
    @Get('list')
    @ApiOperation({ summary: 'Get lightweight list for tables' })
    getList(@Request() req, @Query('sector') sector?: string, @Query('aeropuerto') aeropuerto?: string, @Query('fir') fir?: string) {
        return this.vhfEquiposService.getList(req.user, { sector, aeropuerto, fir });
    }

    // 🔽 Dropdown (solo id y nombre para selects)
    @Get('dropdown')
    @ApiOperation({ summary: 'Get minimal data for dropdowns' })
    getDropdown() {
        return this.vhfEquiposService.getDropdown();
    }

    // 📄 Detalles completos de un equipo
    @Get(':id/full')
    @ApiOperation({ summary: 'Get full equipment details with all relations' })
    getFullDetails(@Param('id') id: string) {
        return this.vhfEquiposService.getFullDetails(+id);
    }



    // 🔍 Endpoint genérico (mantener compatibilidad)
    @Get()
    @ApiOperation({ summary: 'Get all equipments (legacy)' })
    findAll(@Request() req, @Query('sector') sector?: string, @Query('aeropuerto') aeropuerto?: string, @Query('fir') fir?: string) {
        return this.vhfEquiposService.findAll(req.user, { sector, aeropuerto, fir });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get equipment by ID' })
    findOne(@Param('id') id: string) {
        return this.vhfEquiposService.findOne(+id);
    }

    @Post()
    @ApiOperation({ summary: 'Create new equipment' })
    create(@Body() createDto: any) {
        return this.vhfEquiposService.create(createDto);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update equipment' })
    update(@Param('id') id: string, @Body() updateDto: any) {
        return this.vhfEquiposService.update(+id, updateDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete equipment' })
    remove(@Param('id') id: string) {
        return this.vhfEquiposService.remove(+id);
    }
}
