import { ApiProperty } from '@nestjs/swagger';

export class VorDataDto {
    @ApiProperty({ example: '2024-01-05', description: 'Date of measurement' })
    fecha: string;

    @ApiProperty({ example: 'VOR MENDOZA', description: 'Equipment Name' })
    equipo: string;

    @ApiProperty({ example: 0, description: 'Azimuth in degrees' })
    azimut: number;

    @ApiProperty({ example: 0.5, description: 'Measured error in degrees' })
    error: number;

    @ApiProperty({ example: 'A. Sanchez', description: 'Technician Name' })
    tecnico: string;
}

export class DocDataDto {
    @ApiProperty({ example: 'Manual Mantenimiento', description: 'Document Name' })
    nombre: string;

    @ApiProperty({ example: 'PDF', description: 'File Type' })
    tipo: string;

    @ApiProperty({ example: '2023-11-15', description: 'Last Update Date' })
    fecha: string;

    @ApiProperty({ example: '12.4 MB', description: 'File Size' })
    size: string;
}

export class HistoryDataDto {
    @ApiProperty({ example: 'FALLA DETECTADA', description: 'Event Name' })
    evento: string;

    @ApiProperty({ example: 'ALERT', enum: ['ALERT', 'OK'], description: 'Event Type' })
    type: 'ALERT' | 'OK';

    @ApiProperty({ example: 'Pérdida de potencia en TX1', description: 'Description' })
    descripcion: string;

    @ApiProperty({ example: 'Sistema', description: 'Responsible Party' })
    responsable: string;

    @ApiProperty({ example: '2024-01-05 14:30', description: 'Timestamp' })
    fecha: string;
}
