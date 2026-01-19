import { Controller, Get, Body, Param, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NavegacionService } from './navegacion.service';
import { VorDataDto, DocDataDto, HistoryDataDto } from './dto/nav-data.dto';
import { UpdateNavSystemDto } from './dto/update-nav-system.dto';

@ApiTags('Activos: Navegación')
@Controller('navegacion')
export class NavegacionController {
    constructor(private readonly navService: NavegacionService) { }

    @Get()
    @ApiOperation({ summary: 'Get all Navigation Aids' })
    findAll() {
        return this.navService.findAll();
    }

    @Get('vor-data')
    @ApiOperation({ summary: 'Get VOR Error Curve Data' })
    @ApiResponse({ status: 200, description: 'List of VOR measurements', type: [VorDataDto] })
    getVorData(): VorDataDto[] {
        return this.navService.getVorData();
    }

    @Get('docs')
    @ApiOperation({ summary: 'Get Documentation List' })
    @ApiResponse({ status: 200, description: 'List of documents', type: [DocDataDto] })
    getDocs(): DocDataDto[] {
        return this.navService.getDocs();
    }

    @Get('history')
    @ApiOperation({ summary: 'Get Digital History Log' })
    @ApiResponse({ status: 200, description: 'List of historical events', type: [HistoryDataDto] })
    getHistory(): HistoryDataDto[] {
        return this.navService.getHistory();
    }

    @Patch('system/:id')
    @ApiOperation({ summary: 'Update a Navigation System (Main aid + units)' })
    updateSystem(@Param('id') id: string, @Body() data: UpdateNavSystemDto) {
        return this.navService.updateSystem(+id, data);
    }
}
