import { Controller, Get, Query, UseGuards, Param } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Core: Audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('audit')
export class AuditController {
    constructor(private readonly auditService: AuditService) { }

    @Get()
    findAll() {
        return this.auditService.findAll();
    }

    @Get('entity/:name/:id')
    findByEntity(@Param('name') name: string, @Param('id') id: string) {
        return this.auditService.findByEntity(name, +id);
    }
}
