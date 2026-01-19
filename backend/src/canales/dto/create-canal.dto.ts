import { IsString, IsNotEmpty, IsInt, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCanalDto {
    @ApiProperty()
    @IsInt()
    @IsNotEmpty()
    equipoVhfId: number;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    canal: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    tipo: string;
}
