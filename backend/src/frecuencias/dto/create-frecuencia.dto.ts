import { IsNumber, IsNotEmpty, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFrecuenciaDto {
    @ApiProperty()
    @IsInt()
    @IsNotEmpty()
    canalId: number;

    @ApiProperty()
    @IsInt()
    @IsNotEmpty()
    equipoVhfId: number;

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    frecuencia: number;
}
