import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { VorService } from './vor.service';
import { GeminiService } from './gemini.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('vor')
@UseGuards(JwtAuthGuard)
export class VorController {
    constructor(
        private readonly vorService: VorService,
        private readonly geminiService: GeminiService
    ) { }

    @Get()
    findAll(@Request() req: any) {
        return this.vorService.findAll(req.user);
    }

    @Post()
    create(@Body() data: any) {
        return this.vorService.create(data);
    }

    @Post('analyze')
    analyze(@Body() data: any[]) {
        return this.geminiService.analyzeVorCurve(data);
    }
}
