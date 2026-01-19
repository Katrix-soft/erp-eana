import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { VhfService } from './vhf.service';
import { CreateVhfDto } from './dto/create-vhf.dto';
import { UpdateVhfDto } from './dto/update-vhf.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Activos: VHF (Sitios)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vhf')
export class VhfController {
    constructor(private readonly vhfService: VhfService) { }

    @Post()
    create(@Body() createVhfDto: CreateVhfDto) {
        return this.vhfService.create(createVhfDto);
    }

    @Get()
    findAll(@Request() req, @Query('fir') fir?: string, @Query('aeropuerto') aeropuerto?: string) {
        return this.vhfService.findAll(req.user, { fir, aeropuerto });
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.vhfService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateVhfDto: UpdateVhfDto) {
        return this.vhfService.update(+id, updateVhfDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.vhfService.remove(+id);
    }
}
