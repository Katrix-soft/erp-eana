
import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException, Get, Param, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { join } from 'path';

@Controller('upload')
export class UploadController {
    @Post()
    @UseInterceptors(FileInterceptor('file'))
    uploadFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        // Return relative path or full URL depending on how you want to serve it
        // Assuming we serve 'uploads' folder statically at /uploads
        return {
            url: `/uploads/${file.filename}`,
            filename: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype
        };
    }
}
