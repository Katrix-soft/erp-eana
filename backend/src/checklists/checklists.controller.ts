import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ChecklistsService } from './checklists.service';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { UpdateChecklistDto } from './dto/update-checklist.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Operaciones: Checklists')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('checklists')
export class ChecklistsController {
    constructor(private readonly checklistsService: ChecklistsService) { }

    @Post()
    create(@Body() createChecklistDto: CreateChecklistDto) {
        return this.checklistsService.create(createChecklistDto);
    }

    @Get()
    findAll() {
        return this.checklistsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.checklistsService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateChecklistDto: UpdateChecklistDto) {
        return this.checklistsService.update(+id, updateChecklistDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.checklistsService.remove(+id);
    }
}
