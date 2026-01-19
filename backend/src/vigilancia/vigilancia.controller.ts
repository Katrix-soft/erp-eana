
import { Controller, Get, Param, Patch, Body, Query, UseGuards, Request } from '@nestjs/common';
import { VigilanciaService } from './vigilancia.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('vigilancia')
@UseGuards(JwtAuthGuard)
export class VigilanciaController {
    constructor(private readonly vigilanciaService: VigilanciaService) { }

    @Get()
    findAll(
        @Request() req: any,
        @Query('aeropuerto') aeropuerto?: string,
        @Query('fir') fir?: string,
    ) {
        // req.user viene del JwtAuthGuard (validado en AuthService)
        return this.vigilanciaService.findAll(req.user, { aeropuerto, fir });
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.vigilanciaService.findOne(+id);
    }

    @Patch(':id/estado')
    updateStatus(
        @Param('id') id: string,
        @Body('estado') estado: string,
    ) {
        return this.vigilanciaService.updateStatus(+id, estado as any);
    }
}
