import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, Optional } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Personal } from '../personal/entities/personal.entity';
// import { PrismaService } from '../prisma/prisma.service'; 
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto, ForgotPasswordDto, ResetPasswordDto, UpdateProfileDto } from './dto/password.dto';
import { MailService } from '../mail/mail.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Personal)
        private personalRepository: Repository<Personal>,
        private jwtService: JwtService,
        @Optional() private mailService?: MailService,
    ) { }

    async validateUser(emailOrUsername: string, pass: string): Promise<any> {
        if (!emailOrUsername || !pass) return null;

        const normalizedIdentifier = emailOrUsername.trim().toLowerCase();

        let userSearchWhere: any = {};

        // 1. Detección Inteligente del Identificador para Búsqueda Rápida
        if (normalizedIdentifier.includes('@')) {
            // Caso: Email directo
            userSearchWhere = { email: normalizedIdentifier };
        } else if (/^\d+$/.test(normalizedIdentifier)) {
            // Caso: DNI (solo números) - Requires finding user via Personal relation
            // TypeORM handles this slightly differently, we might need a query builder or find with relations
            userSearchWhere = { personal: { dni: normalizedIdentifier } };
        } else {
            // For complex OR/AND conditions, FindOptionsWhere in TypeORM works but can be verbose for nested relations in ORs.
            // We can fetch by email OR fetch personal and then user.
            // OR: [ { email: ... }, { personal: ... } ]
        }

        // Simplify for TypeORM migration first pass: using QueryBuilder for complex queries or simple finds
        let user: User | null = null;

        if (normalizedIdentifier.includes('@')) {
            user = await this.userRepository.findOne({
                where: { email: normalizedIdentifier },
                relations: ['personal', 'personal.aeropuerto', 'personal.fir', 'personal.puesto', 'personal.aeropuerto.fir']
            });
        } else if (/^\d+$/.test(normalizedIdentifier)) {
            // Find by DNI
            const personal = await this.personalRepository.findOne({
                where: { dni: normalizedIdentifier },
                relations: ['user']
            });
            if (personal && personal.user) {
                user = await this.userRepository.findOne({
                    where: { id: personal.user.id },
                    relations: ['personal', 'personal.aeropuerto', 'personal.fir', 'personal.puesto', 'personal.aeropuerto.fir']
                });
            }
        } else {
            // Try to find by email prefix (username)
            user = await this.userRepository.createQueryBuilder('user')
                .leftJoinAndSelect('user.personal', 'personal')
                .leftJoinAndSelect('personal.aeropuerto', 'aeropuerto')
                .leftJoinAndSelect('personal.fir', 'fir')
                .leftJoinAndSelect('personal.puesto', 'puesto')
                .leftJoinAndSelect('aeropuerto.fir', 'aero_fir')
                .where('user.email LIKE :emailPrefix', { emailPrefix: `${normalizedIdentifier}@%` })
                .getOne();

            // Fallback for admin if uniquely typed
            if (!user && normalizedIdentifier === 'admin') {
                user = await this.userRepository.findOne({
                    where: { email: 'admin@eana.com' },
                    relations: ['personal', 'personal.aeropuerto', 'personal.fir', 'personal.puesto', 'personal.aeropuerto.fir']
                });
            }
        }

        // Verificación de Contraseña
        if (user) {
            const isMatch = await bcrypt.compare(pass, user.password);
            if (isMatch) {
                const { password, ...result } = user;
                return result;
            } else {
                console.log(`[AuthService] Password mismatch for user: ${user.email}`);
            }
        } else {
            console.log(`[AuthService] User not found for identifier: ${normalizedIdentifier}`);
        }

        return null;
    }

    async login(loginDto: LoginDto) {
        const user = await this.validateUser(loginDto.email, loginDto.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const payload = { email: user.email, sub: user.id, role: user.role };

        let sector = null;
        if (user.personal) {
            sector = user.personal.sector as string;
            if ((!sector || sector === 'CNSE') && user.personal.puesto?.nombre) {
                const puestoUpper = user.personal.puesto.nombre.toUpperCase();
                if (puestoUpper.includes('VIGILANCIA')) sector = 'VIGILANCIA';
                else if (puestoUpper.includes('NAVEGACION') || puestoUpper.includes('NAVEGACIÓN')) sector = 'NAVEGACION';
                else if (puestoUpper.includes('COMUNICACION')) sector = 'COMUNICACIONES';
                else if (puestoUpper.includes('ENERGIA') || puestoUpper.includes('ENERGÍA')) sector = 'ENERGIA';
            }
        }

        const context = user.personal ? {
            nombre: user.personal.nombre,
            apellido: user.personal.apellido,
            sector: sector,
            aeropuerto: user.personal.aeropuerto?.nombre,
            aeropuertoCodigo: user.personal.aeropuerto?.codigo,
            fir: user.personal.fir?.nombre || user.personal.aeropuerto?.fir?.nombre,
            puesto: user.personal.puesto?.nombre
        } : null;

        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                context
            }
        };
    }

    async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
        const { currentPassword, newPassword, confirmPassword } = changePasswordDto;

        if (newPassword !== confirmPassword) {
            throw new BadRequestException('Las contraseñas no coinciden');
        }

        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Contraseña actual incorrecta');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await this.userRepository.update(userId, {
            password: hashedPassword,
            passwordChanged: true
        });

        if (this.mailService) {
            await this.mailService.sendPasswordChangedNotification(user.email);
        }

        return {
            success: true,
            message: 'Contraseña actualizada correctamente'
        };
    }

    async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
        const { email: identifier } = forgotPasswordDto;
        const normalizedIdentifier = identifier.trim().toLowerCase();

        let user: User | null = null;

        if (normalizedIdentifier.includes('@')) {
            user = await this.userRepository.findOne({ where: { email: normalizedIdentifier } });
        } else {
            // Support finding by username (email prefix)
            user = await this.userRepository.createQueryBuilder('user')
                .where('user.email LIKE :emailPrefix', { emailPrefix: `${normalizedIdentifier}@%` })
                .getOne();
        }

        if (!user) {
            // Security: don't reveal if user exists, but log it internally for debugging
            console.log(`[AuthService] Password reset requested for non-existent user/email: ${normalizedIdentifier}`);
            return {
                success: true,
                message: 'Si el usuario existe en nuestro sistema, recibirá un enlace de recuperación'
            };
        }

        const resetTokenRaw = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetTokenRaw).digest('hex');
        const expiresAt = new Date(Date.now() + 3600000); // 1 hora de validez

        await this.userRepository.update(user.id, {
            resetToken: hashedToken,
            resetTokenExpiry: expiresAt
        });

        if (this.mailService) {
            console.log(`[AuthService] Generated reset token for ${user.email}`);
            await this.mailService.sendPasswordResetEmail(user.email, resetTokenRaw);
        }

        return {
            success: true,
            message: 'Si el usuario existe en nuestro sistema, recibirá un enlace de recuperación'
        };
    }

    async resetPassword(resetPasswordDto: ResetPasswordDto) {
        const { token, newPassword } = resetPasswordDto;

        // Hash the token from user to compare with DB
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Find user with valid token and not expired
        const user = await this.userRepository.createQueryBuilder("user")
            .where("user.resetToken = :hashedToken", { hashedToken })
            .andWhere("user.resetTokenExpiry >= :now", { now: new Date() })
            .getOne();

        if (!user) {
            console.warn(`[AuthService] Invalid or expired password reset attempt with token`);
            throw new BadRequestException('El enlace de recuperación es inválido o ha expirado');
        }

        // Hash the new password using bcrypt
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await this.userRepository.update(user.id, {
            password: hashedPassword,
            passwordChanged: true,
            resetToken: null, // Invalidate token after use
            resetTokenExpiry: null
        });

        if (this.mailService) {
            await this.mailService.sendPasswordChangedNotification(user.email);
        }

        console.log(`[AuthService] Password reset successful for user: ${user.email}`);

        return {
            success: true,
            message: 'Tu contraseña ha sido restablecida correctamente'
        };
    }

    async getProfile(userId: number) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['personal', 'personal.aeropuerto', 'personal.fir', 'personal.puesto', 'personal.aeropuerto.fir']
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        const { password, resetToken, resetTokenExpiry, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    async updateProfile(userId: number, updateProfileDto: UpdateProfileDto) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['personal']
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        if (updateProfileDto.email) {
            await this.userRepository.update(userId, { email: updateProfileDto.email });
        }

        if (user.personal && (updateProfileDto.nombre || updateProfileDto.apellido)) {
            await this.personalRepository.update(user.personal.id, {
                nombre: updateProfileDto.nombre || user.personal.nombre,
                apellido: updateProfileDto.apellido || user.personal.apellido
            });
        }

        return {
            success: true,
            message: 'Perfil actualizado correctamente'
        };
    }

    async checkDefaultPasswordStatus(identifier: string) {
        // Simplified check
        return { showHint: false };
    }
}
