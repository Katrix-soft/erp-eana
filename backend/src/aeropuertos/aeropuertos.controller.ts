import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AeropuertosService } from './aeropuertos.service';

@ApiTags('Recursos: Aeropuertos')
@Controller('aeropuertos')
export class AeropuertosController {
    constructor(private readonly aeropuertosService: AeropuertosService) { }

    @Post()
    create(@Body() createAeropuertoDto: any) {
        return this.aeropuertosService.create(createAeropuertoDto);
    }

    @Get()
    findAll() {
        return this.aeropuertosService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.aeropuertosService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateAeropuertoDto: any) {
        return this.aeropuertosService.update(+id, updateAeropuertoDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.aeropuertosService.remove(+id);
    }
}
