import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FirsService } from './firs.service';

@ApiTags('Recursos: FIRs')
@Controller('firs')
export class FirsController {
    constructor(private readonly firsService: FirsService) { }

    @Post()
    create(@Body() createFirDto: any) {
        return this.firsService.create(createFirDto);
    }

    @Get()
    findAll() {
        return this.firsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.firsService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateFirDto: any) {
        return this.firsService.update(+id, updateFirDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.firsService.remove(+id);
    }
}
