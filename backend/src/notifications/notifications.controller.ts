import { Controller, Get, Post, Put, Body, UseGuards, Request, Param } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Core: Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    findAll(@Request() req) {
        return this.notificationsService.findAll(req.user);
    }

    @Put('read-all')
    markAllAsRead(@Request() req) {
        return this.notificationsService.markAllAsRead(req.user);
    }

    @Put(':id/read')
    markAsRead(@Param('id') id: string) {
        return this.notificationsService.markAsRead(+id);
    }

    @Post()
    create(@Body() data: { message: string, type?: string, userId?: number, aeropuertoId?: number, firId?: number }) {
        return this.notificationsService.create(data);
    }
}
