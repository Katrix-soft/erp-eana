import { IsString, IsNotEmpty, MinLength, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    currentPassword: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @MinLength(8, { message: 'La nueva contraseña debe tener al menos 8 caracteres' })
    newPassword: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    confirmPassword: string;
}

export class ForgotPasswordDto {
    @ApiProperty()
    @IsEmail()
    @IsNotEmpty()
    email: string;
}

export class ResetPasswordDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    token: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    newPassword: string;
}

export class UpdateProfileDto {
    @ApiProperty({ required: false })
    @IsString()
    nombre?: string;

    @ApiProperty({ required: false })
    @IsString()
    apellido?: string;

    @ApiProperty({ required: false })
    @IsEmail()
    email?: string;
}
