import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, Optional } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Personal } from '../personal/entities/personal.entity';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto, ForgotPasswordDto, ResetPasswordDto, UpdateProfileDto } from './dto/password.dto';
import { MailService } from '../mail/mail.service';
import { CacheService } from '../cache/cache.service';
import { RateLimiterService } from '../cache/rate-limiter.service';
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
        @Optional() private cacheService?: CacheService,
        @Optional() private rateLimiter?: RateLimiterService,
    ) { }

    async validateUser(emailOrUsername: string, pass: string): Promise<any> {
        console.log(`[AuthService] validateUser called for: ${emailOrUsername}`);
        if (!emailOrUsername || !pass) {
            console.log(`[AuthService] Missing credentials`);
            return null;
        }

        const normalizedIdentifier = emailOrUsername.trim().toLowerCase();
        let user: User | null = null;

        try {
            if (normalizedIdentifier.includes('@')) {
                console.log(`[AuthService] Finding by email: ${normalizedIdentifier}`);
                user = await this.userRepository.findOne({
                    where: { email: normalizedIdentifier },
                    relations: ['personal', 'personal.aeropuerto', 'personal.fir', 'personal.puesto', 'personal.aeropuerto.fir']
                });
            } else if (/^\d+$/.test(normalizedIdentifier)) {
                console.log(`[AuthService] Finding by DNI: ${normalizedIdentifier}`);
                const personal = await this.personalRepository.findOne({
                    where: { dni: normalizedIdentifier },
                    relations: ['user']
                });
                if (personal && personal.user) {
                    console.log(`[AuthService] Found personal record, finding user with ID: ${personal.user.id}`);
                    user = await this.userRepository.findOne({
                        where: { id: personal.user.id },
                        relations: ['personal', 'personal.aeropuerto', 'personal.fir', 'personal.puesto', 'personal.aeropuerto.fir']
                    });
                } else {
                    console.log(`[AuthService] No personal record found for DNI: ${normalizedIdentifier}`);
                }
            } else {
                console.log(`[AuthService] Finding by email prefix (username): ${normalizedIdentifier}`);
                user = await this.userRepository.createQueryBuilder('user')
                    .leftJoinAndSelect('user.personal', 'personal')
                    .leftJoinAndSelect('personal.aeropuerto', 'aeropuerto')
                    .leftJoinAndSelect('personal.fir', 'fir')
                    .leftJoinAndSelect('personal.puesto', 'puesto')
                    .leftJoinAndSelect('aeropuerto.fir', 'aero_fir')
                    .where('user.email LIKE :emailPrefix', { emailPrefix: `${normalizedIdentifier}@%` })
                    .getOne();

                if (!user && normalizedIdentifier === 'admin') {
                    console.log(`[AuthService] Fallback for admin`);
                    user = await this.userRepository.findOne({
                        where: { email: 'admin@eana.com' },
                        relations: ['personal', 'personal.aeropuerto', 'personal.fir', 'personal.puesto', 'personal.aeropuerto.fir']
                    });
                }
            }
        } catch (dbError) {
            console.error(`[AuthService] Database error during user lookup:`, dbError);
            throw dbError;
        }

        if (user) {
            console.log(`[AuthService] User found: ${user.email}. Password hash: ${user.password ? 'present' : 'EMPTY!'}`);
            try {
                const isMatch = await bcrypt.compare(pass, user.password);
                if (isMatch) {
                    console.log(`[AuthService] Password match!`);
                    const { password, ...result } = user;
                    return result;
                } else {
                    console.log(`[AuthService] Password mismatch for user: ${user.email}`);
                }
            } catch (bcryptError) {
                console.error(`[AuthService] Bcrypt error:`, bcryptError);
                throw bcryptError;
            }
        } else {
            console.log(`[AuthService] User NOT found for identifier: ${normalizedIdentifier}`);
        }

        return null;
    }

    async login(loginDto: LoginDto, ip?: string) {
        console.log(`[Auth] 🔐 Login attempt for: ${loginDto.email} from ${ip || 'unknown IP'}`);

        const identifier = loginDto.email.trim().toLowerCase();

        try {
            // 🛡️ STEP 1: Rate Limiting Check (Brute-Force Protection)
            if (this.rateLimiter) {
                const rateLimitCheck = await this.rateLimiter.check(
                    ip || identifier,
                    'login',
                    { maxAttempts: 5, windowSeconds: 300 } // 5 intentos en 5 minutos
                );

                if (!rateLimitCheck.allowed) {
                    console.log(`[Auth] 🚫 Rate limit exceeded for ${identifier} (${rateLimitCheck.retryAfter}s)`);
                    throw new UnauthorizedException({
                        message: 'Demasiados intentos de inicio de sesión',
                        retryAfter: rateLimitCheck.retryAfter,
                        blocked: true,
                    });
                }

                console.log(`[Auth] ✅ Rate limit OK: ${rateLimitCheck.remaining} attempts remaining`);
            }

            // 🔍 STEP 2: Validate User (con cache automático en validateUser si se implementa)
            const user = await this.validateUser(loginDto.email, loginDto.password);

            if (!user) {
                console.log(`[Auth] ❌ Login failed: Invalid credentials for ${loginDto.email}`);

                // Registrar intento fallido para rate limiting
                if (this.rateLimiter) {
                    await this.rateLimiter.recordFailure(ip || identifier, 'login');
                }

                throw new UnauthorizedException('Credenciales inválidas');
            }

            console.log(`[Auth] ✅ User validated: ${user.email}, ID: ${user.id}, Role: ${user.role}`);

            // 🎯 STEP 3: Limpiar intentos fallidos (login exitoso)
            if (this.rateLimiter) {
                await this.rateLimiter.recordSuccess(ip || identifier, 'login');
            }

            // 📦 STEP 4: Preparar payload y contexto
            const payload = { email: user.email, sub: user.id, role: user.role };

            let sector = null;
            if (user.personal) {
                console.log(`[Auth] Personal data found for user: ${user.personal.nombre} ${user.personal.apellido}`);
                sector = user.personal.sector as string;
                if ((!sector || sector === 'CNSE') && user.personal.puesto?.nombre) {
                    const puestoUpper = user.personal.puesto.nombre.toUpperCase();
                    if (puestoUpper.includes('VIGILANCIA')) sector = 'VIGILANCIA';
                    else if (puestoUpper.includes('NAVEGACION') || puestoUpper.includes('NAVEGACIÓN')) sector = 'NAVEGACION';
                    else if (puestoUpper.includes('COMUNICACION')) sector = 'COMUNICACIONES';
                    else if (puestoUpper.includes('ENERGIA') || puestoUpper.includes('ENERGÍA')) sector = 'ENERGIA';
                }
                console.log(`[Auth] Resolved sector: ${sector}`);
            } else {
                console.log(`[Auth] No personal record for user ${user.email}`);
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

            // 💾 STEP 5: Cachear datos del usuario (NO cachear password/tokens)
            if (this.cacheService) {
                const cacheKey = `user:${user.id}:profile`;
                const cacheData = {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    context,
                };

                // Cache por 5 minutos (TTL corto para datos sensibles)
                await this.cacheService.set(cacheKey, cacheData, 300).catch(err => {
                    console.error(`[Auth] ⚠️ Failed to cache user data:`, err.message);
                });
            }

            // 🔑 STEP 6: Generar JWT
            console.log(`[Auth] 🔑 Generating JWT...`);
            const token = this.jwtService.sign(payload);
            console.log(`[Auth] ✅ Login successful for ${user.email}`);

            return {
                access_token: token,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    context
                }
            };
        } catch (error) {
            // Si el error es UnauthorizedException, re-lanzarlo tal cual
            if (error instanceof UnauthorizedException) {
                throw error;
            }

            console.error(`[Auth] 💥 CRITICAL ERROR during login for ${loginDto.email}:`, error);
            throw error;
        }
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
            user = await this.userRepository.createQueryBuilder('user')
                .where('user.email LIKE :emailPrefix', { emailPrefix: `${normalizedIdentifier}@%` })
                .getOne();
        }

        if (!user) {
            console.log(`[AuthService] Password reset requested for non-existent user/email: ${normalizedIdentifier}`);
            return {
                success: true,
                message: 'Si el usuario existe en nuestro sistema, recibirá un enlace de recuperación'
            };
        }

        const resetTokenRaw = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetTokenRaw).digest('hex');
        const expiresAt = new Date(Date.now() + 3600000); // 1 hora

        await this.userRepository.update(user.id, {
            resetToken: hashedToken,
            resetTokenExpiry: expiresAt
        });

        if (this.mailService) {
            await this.mailService.sendPasswordResetEmail(user.email, resetTokenRaw);
        }

        return {
            success: true,
            message: 'Si el usuario existe en nuestro sistema, recibirá un enlace de recuperación'
        };
    }

    async resetPassword(resetPasswordDto: ResetPasswordDto) {
        const { token, newPassword } = resetPasswordDto;
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await this.userRepository.createQueryBuilder("user")
            .where("user.resetToken = :hashedToken", { hashedToken })
            .andWhere("user.resetTokenExpiry >= :now", { now: new Date() })
            .getOne();

        if (!user) {
            throw new BadRequestException('El enlace de recuperación es inválido o ha expirado');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await this.userRepository.update(user.id, {
            password: hashedPassword,
            passwordChanged: true,
            resetToken: null,
            resetTokenExpiry: null
        });

        if (this.mailService) {
            await this.mailService.sendPasswordChangedNotification(user.email);
        }

        return {
            success: true,
            message: 'Tu contraseña ha sido restablecida correctamente'
        };
    }

    async getProfile(userId: number) {
        const cacheKey = `user:${userId}:profile`;

        // Intentar del cache primero si está disponible
        if (this.cacheService) {
            try {
                const cached = await this.cacheService.get<any>(cacheKey);
                if (cached) {
                    console.log(`[Auth] 📦 Profile from cache for user ${userId}`);
                    return cached;
                }
            } catch (error) {
                console.error(`[Auth] ⚠️ Cache error, falling back to DB:`, error.message);
            }
        }

        // Fallback a base de datos
        console.log(`[Auth] 🔍 Fetching profile from DB for user ${userId}`);
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['personal', 'personal.aeropuerto', 'personal.fir', 'personal.puesto', 'personal.aeropuerto.fir']
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        const { password, resetToken, resetTokenExpiry, ...userWithoutPassword } = user;

        // Cachear para próximas llamadas
        if (this.cacheService) {
            await this.cacheService.set(cacheKey, userWithoutPassword, 300).catch(err => {
                console.error(`[Auth] ⚠️ Failed to cache profile:`, err.message);
            });
        }

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
        return { showHint: false };
    }
}
