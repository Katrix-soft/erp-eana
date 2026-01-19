import { IsString, IsNotEmpty, IsInt, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEquipoDto {
    @ApiProperty()
    @IsInt()
    @IsNotEmpty()
    vhfId: number;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    tipoEquipo: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    marca: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    modelo: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    numeroSerie: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    tecnologia?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    activoFijo?: string;
}
