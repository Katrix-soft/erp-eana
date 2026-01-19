import { Controller, Get, Put, Delete, Body, Param, Query, UseGuards, Request, Res } from '@nestjs/common';
import { WorkOrdersService } from './work-orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PdfService } from '../common/services/pdf.service';
import { Response } from 'express';


@ApiTags('Operaciones: Ordenes de Trabajo')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('work-orders')
export class WorkOrdersController {
    constructor(
        private readonly workOrdersService: WorkOrdersService,
        private readonly pdfService: PdfService
    ) { }

    @Get()
    findAll(@Request() req, @Query('estado') estado?: string, @Query('prioridad') prioridad?: string) {
        return this.workOrdersService.findAll(req.user, { estado, prioridad });
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.workOrdersService.findOne(+id);
    }

    @Get('export/:id')
    async exportPdf(@Param('id') id: string, @Res() res: Response) {
        const order = await this.workOrdersService.findOne(+id);
        if (!order) return res.status(404).json({ message: 'OT no encontrada' });

        const buffer = await this.pdfService.generateWorkOrderPdf(order);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=OT-${order.numero}.pdf`,
            'Content-Length': buffer.length,
        });

        res.end(buffer);
    }


    @Put(':id')
    update(@Param('id') id: string, @Body() updateDto: any) {
        return this.workOrdersService.update(+id, updateDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.workOrdersService.remove(+id);
    }
}
