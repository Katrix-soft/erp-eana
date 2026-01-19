import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

enum Role {
    TECNICO = 'TECNICO',
    JEFE_COORDINADOR = 'JEFE_COORDINADOR',
    CNS_NACIONAL = 'CNS_NACIONAL',
    ADMIN = 'ADMIN',
}

export class CreateUserDto {
    @ApiProperty()
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @ApiProperty({ enum: Role })
    @IsEnum(Role)
    role: Role;
}
