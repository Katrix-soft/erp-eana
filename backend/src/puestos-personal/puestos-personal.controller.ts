import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PuestosPersonalService } from './puestos-personal.service';

@Controller('puestos-personal')
export class PuestosPersonalController {
    constructor(private readonly puestosPersonalService: PuestosPersonalService) { }

    @Post()
    create(@Body() createPuestoDto: any) {
        return this.puestosPersonalService.create(createPuestoDto);
    }

    @Get()
    findAll() {
        return this.puestosPersonalService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.puestosPersonalService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updatePuestoDto: any) {
        return this.puestosPersonalService.update(+id, updatePuestoDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.puestosPersonalService.remove(+id);
    }
}
