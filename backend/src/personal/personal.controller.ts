import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PersonalService } from './personal.service';

@Controller('personal')
export class PersonalController {
    constructor(private readonly personalService: PersonalService) { }

    @Post()
    create(@Body() createPersonalDto: any) {
        return this.personalService.create(createPersonalDto);
    }

    @Get()
    findAll() {
        return this.personalService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.personalService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updatePersonalDto: any) {
        return this.personalService.update(+id, updatePersonalDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.personalService.remove(+id);
    }
}
