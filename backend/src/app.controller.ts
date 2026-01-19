
import { Controller, Get, Header, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('General')
@Controller()
export class AppController {
    constructor(private readonly appService: AppService) { }

    @Get()
    @Header('Content-Type', 'text/html')
    @ApiOperation({ summary: 'API Landing Page', description: 'Returns API landing page' })
    @ApiResponse({ status: 200, description: 'HTML landing page' })
    getHello() {
        return this.appService.getLandingPage();
    }

    @Get('health')
    @ApiOperation({ summary: 'System health check', description: 'Returns detailed system health status' })
    @ApiResponse({ status: 200, description: 'System health information' })
    async getHealth(@Query('format') format?: string) {
        const healthData = await this.appService.getSystemHealth();

        // Si se solicita formato JSON explícitamente, devolver JSON
        if (format === 'json') {
            return healthData;
        }

        // Por defecto, devolver vista HTML bonita
        return this.appService.getHealthPage(healthData);
    }
}
