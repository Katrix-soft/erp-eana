import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVhfDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    fir: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    aeropuerto: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    sitio: string;
}
