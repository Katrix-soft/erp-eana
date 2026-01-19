import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

import { Buffer } from 'buffer';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class PdfService {
    async generateWorkOrderPdf(order: any): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({
                margin: 50,
                size: 'A4',
            });

            const buffers: Buffer[] = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            // Header Section
            this.generateHeader(doc);

            // Document Title
            doc
                .fillColor('#444444')
                .fontSize(20)
                .text('ORDEN DE TRABAJO CNS', 50, 140, { align: 'center' });

            this.generateHr(doc, 170);

            // Left Column: Order Info
            const orderInfoTop = 190;
            doc
                .fontSize(10)
                .font('Helvetica-Bold')
                .text('Número de OT:', 50, orderInfoTop)
                .font('Helvetica')
                .text(order.numero, 150, orderInfoTop)
                .font('Helvetica-Bold')
                .text('Fecha Inicio:', 50, orderInfoTop + 15)
                .font('Helvetica')
                .text(new Date(order.fechaInicio).toLocaleDateString('es-AR'), 150, orderInfoTop + 15)
                .font('Helvetica-Bold')
                .text('Prioridad:', 50, orderInfoTop + 30)
                .font('Helvetica')
                .fillColor(this.getPriorityColor(order.prioridad))
                .text(order.prioridad, 150, orderInfoTop + 30)
                .fillColor('#444444');

            // Right Column: Equipment Info
            doc
                .font('Helvetica-Bold')
                .text('Equipo:', 300, orderInfoTop)
                .font('Helvetica')
                .text(`${order.equipo?.marca} ${order.equipo?.modelo}`, 400, orderInfoTop)
                .font('Helvetica-Bold')
                .text('N/S:', 300, orderInfoTop + 15)
                .font('Helvetica')
                .text(order.equipo?.numeroSerie || 'N/A', 400, orderInfoTop + 15)
                .font('Helvetica-Bold')
                .text('Ubicación:', 300, orderInfoTop + 30)
                .font('Helvetica')
                .text(`${order.equipo?.vhf?.aeropuerto || ''} - ${order.equipo?.vhf?.sitio || ''}`, 400, orderInfoTop + 30);

            this.generateHr(doc, 240);

            // Description Section
            doc
                .fontSize(14)
                .font('Helvetica-Bold')
                .text('Descripción del Problema/Tarea', 50, 260);

            doc
                .fontSize(10)
                .font('Helvetica')
                .text(order.descripcion, 50, 285, { width: 500, align: 'justify' });

            // Observations Section (if any)
            if (order.observaciones) {
                doc
                    .fontSize(14)
                    .font('Helvetica-Bold')
                    .text('Observaciones Técnicas', 50, 350);

                doc
                    .fontSize(10)
                    .font('Helvetica')
                    .text(order.observaciones, 50, 375, { width: 500, align: 'justify' });
            }

            // Status Badge
            const statusTop = 450;
            doc
                .fontSize(12)
                .font('Helvetica-Bold')
                .text('Estado Actual:', 50, statusTop)
                .rect(150, statusTop - 5, 100, 20)
                .fill(this.getStatusColor(order.estado))
                .fillColor('#FFFFFF')
                .text(order.estado, 155, statusTop, { width: 90, align: 'center' });

            // Signature Section
            this.generateFooter(doc);

            doc.end();
        });
    }

    private generateHeader(doc: PDFKit.PDFDocument) {
        const logoPath = path.join(process.cwd(), '../frontend-angular/public/logo_atsep.png');

        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 50, 45, { width: 60 });
        }

        doc
            .fillColor('#444444')
            .fontSize(18)
            .font('Helvetica-Bold')
            .text('EANA S.E.', 120, 50)
            .fontSize(10)
            .font('Helvetica')
            .text('Empresa Argentina de Navegación Aérea', 120, 70)
            .text('Dirección de Servicios de Navegación Aérea', 120, 85)
            .text('Departamento de Comunicaciones, Navegación y Vigilancia (CNS)', 120, 100)
            .moveDown();
    }

    private generateFooter(doc: PDFKit.PDFDocument) {
        const footerTop = 730;
        this.generateHr(doc, footerTop - 10);

        doc
            .fontSize(10)
            .fillColor('#444444')
            .text('Firma Operador de Turno', 50, footerTop, { align: 'left' })
            .text('Firma Técnico de Mantenimiento', 300, footerTop, { align: 'right' });

        doc
            .fontSize(8)
            .text('Documento generado por Proyecto EANA - Sistema de Gestión ERP CNS', 0, 780, { align: 'center', width: 595 });
    }

    private generateHr(doc: PDFKit.PDFDocument, y: number) {
        doc
            .strokeColor('#aaaaaa')
            .lineWidth(1)
            .moveTo(50, y)
            .lineTo(550, y)
            .stroke();
    }

    private getPriorityColor(priority: string): string {
        switch (priority) {
            case 'CRITICA': return '#FF0000';
            case 'ALTA': return '#FF4500';
            case 'MEDIA': return '#FFA500';
            default: return '#0000FF';
        }
    }

    private getStatusColor(status: string): string {
        switch (status) {
            case 'CERRADA': return '#10b981';
            case 'ABIERTA': return '#3b82f6';
            case 'EN_PROGRESO': return '#8b5cf6';
            default: return '#94a3b8';
        }
    }
}
