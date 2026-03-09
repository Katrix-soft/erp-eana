import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Request, Put, Get, Param, Ip, Delete } from '@nestjs/common';
import { AuthService } from './auth.service';
import { WebAuthnService } from './webauthn.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto, ForgotPasswordDto, ResetPasswordDto, UpdateProfileDto } from './dto/password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Core: Auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly webAuthnService: WebAuthnService,
    ) { }

    // ============================================
    // AUTENTICACIÓN CLÁSICA
    // ============================================

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'User login with rate limiting' })
    @ApiResponse({ status: 200, description: 'Return JWT access token.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 429, description: 'Too many requests - Rate limited.' })
    async login(@Body() loginDto: LoginDto, @Ip() ip: string) {
        return this.authService.login(loginDto, ip);
    }

    @Post('change-password')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Change user password' })
    async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
        return this.authService.changePassword(req.user.userId, changePasswordDto);
    }

    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Request password reset' })
    async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
        return this.authService.forgotPassword(forgotPasswordDto);
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Reset password with token' })
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
        return this.authService.resetPassword(resetPasswordDto);
    }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get user profile' })
    async getProfile(@Request() req) {
        return this.authService.getProfile(req.user.userId);
    }

    @Put('profile')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update user profile' })
    async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
        return this.authService.updateProfile(req.user.userId, updateProfileDto);
    }

    @Get('check-status/:identifier')
    @ApiOperation({ summary: 'Check if default password hint should be shown' })
    async checkStatus(@Param('identifier') identifier: string) {
        return this.authService.checkDefaultPasswordStatus(identifier);
    }

    /**
     * Resolver userId desde email/username (para flujo biométrico sin contraseña)
     */
    @Get('resolve-user/:identifier')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: '[Biometría] Resolver userId desde email o nombre de usuario' })
    async resolveUser(@Param('identifier') identifier: string) {
        return this.authService.resolveUserIdFromIdentifier(identifier);
    }

    // ============================================
    // AUTENTICACIÓN BIOMÉTRICA (WebAuthn / Passkey)
    // ============================================

    /**
     * REGISTRO biométrico - Paso 1: Obtener opciones de registro
     * Requiere que el usuario ya esté logueado (JWT)
     */
    @Post('passkey/register/options')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: '[Biometría] Obtener opciones para registrar huella/Face ID' })
    async getRegistrationOptions(@Request() req) {
        return this.webAuthnService.generateRegistrationOptions(req.user.userId, req.headers.origin);
    }

    /**
     * REGISTRO biométrico - Paso 2: Verificar y guardar el biométrico
     */
    @Post('passkey/register/verify')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: '[Biometría] Verificar y guardar registro biométrico' })
    async verifyRegistration(@Request() req, @Body() body: { response: any }) {
        return this.webAuthnService.verifyRegistration(req.user.userId, body.response, req.headers.origin);
    }

    /**
     * AUTENTICACIÓN biométrica - Paso 1: Obtener opciones (no requiere JWT)
     * El userId se obtiene del identifier (email/DNI) enviado
     */
    @Post('passkey/auth/options')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: '[Biometría] Obtener opciones para autenticarse con huella/Face ID' })
    async getAuthOptions(@Request() req, @Body() body: { userId: number }) {
        return this.webAuthnService.generateAuthenticationOptions(body.userId, req.headers.origin);
    }

    /**
     * AUTENTICACIÓN biométrica - Paso 2: Verificar y emitir JWT
     */
    @Post('passkey/auth/verify')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: '[Biometría] Verificar autenticación biométrica y obtener JWT' })
    async verifyAuthentication(@Request() req, @Body() body: { userId: number; response: any }) {
        return this.webAuthnService.verifyAuthentication(body.userId, body.response, req.headers.origin);
    }

    /**
     * Verificar si el usuario tiene biométrico registrado (no requiere JWT)
     */
    @Get('passkey/status/:userId')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: '[Biometría] Verificar si usuario tiene biométrico registrado' })
    async getPasskeyStatus(@Param('userId') userId: string) {
        return this.webAuthnService.hasPasskey(parseInt(userId));
    }

    /**
     * Eliminar todos los biométricos registrados del usuario
     */
    @Delete('passkey/remove')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: '[Biometría] Eliminar dispositivos biométricos registrados' })
    async removePasskeys(@Request() req) {
        return this.webAuthnService.removePasskeys(req.user.userId);
    }
}
