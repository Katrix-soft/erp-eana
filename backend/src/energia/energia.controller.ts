import { Controller, Get, Param, Patch, Body, Query, UseGuards, Request } from '@nestjs/common';
import { EnergiaService } from './energia.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('energia')
@UseGuards(JwtAuthGuard)
export class EnergiaController {
    constructor(private readonly energiaService: EnergiaService) { }

    @Get()
    findAll(
        @Request() req: any,
        @Query('aeropuerto') aeropuerto?: string,
        @Query('fir') fir?: string,
    ) {
        return this.energiaService.findAll(req.user, { aeropuerto, fir });
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.energiaService.findOne(+id);
    }

    @Patch(':id/estado')
    updateStatus(
        @Param('id') id: string,
        @Body('estado') estado: string,
    ) {
        return this.energiaService.updateStatus(+id, estado as any);
    }

    @Get('tableros')
    findAllTableros(
        @Request() req: any,
        @Query('aeropuerto') aeropuerto?: string,
    ) {
        return this.energiaService.findAllTableros(req.user, { aeropuerto });
    }

    @Get('tableros/:id')
    findTablero(@Param('id') id: string) {
        return this.energiaService.findTablero(+id);
    }
}
