import { Module, Global } from '@nestjs/common';
import { PdfService } from './services/pdf.service';

@Global()
@Module({
    providers: [PdfService],
    exports: [PdfService],
})
export class CommonModule { }
