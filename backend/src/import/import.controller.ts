import { Controller, Post, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportService } from './import.service';

@Controller('import')
export class ImportController {
    constructor(private readonly importService: ImportService) { }

    @Post('excel')
    @UseInterceptors(FileInterceptor('file'))
    async importExcel(@UploadedFile() file: any) {
        if (!file) {
            throw new BadRequestException('No se proporcionó ningún archivo');
        }

        if (!file.originalname.match(/\.(xlsx|xls)$/)) {
            throw new BadRequestException('El archivo debe ser un Excel (.xlsx o .xls)');
        }

        const result = await this.importService.processExcelFile(file.buffer);

        return {
            message: 'Importación completada exitosamente',
            ...result
        };
    }
}
