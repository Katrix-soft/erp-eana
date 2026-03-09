import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Authenticator } from './entities/authenticator.entity';
import { JwtService } from '@nestjs/jwt';

// Importar solo las funciones, sin tipos (para evitar conflictos de versión de tipos)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const simplewebauthn = require('@simplewebauthn/server');
const {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
} = simplewebauthn;

// In-memory challenge store (en producción usar Redis)
const challengeStore = new Map<number, string>();

@Injectable()
export class WebAuthnService {
    // Configuración del RP (Relying Party)
    private readonly rpName = 'EANA ERP';
    private readonly rpID: string;
    private readonly origin: string;

    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Authenticator)
        private authenticatorRepository: Repository<Authenticator>,
        private jwtService: JwtService,
    ) {
        // Detectar entorno
        const isDev = process.env.NODE_ENV !== 'production';
        this.rpID = process.env.WEBAUTHN_RP_ID || (isDev ? 'localhost' : 'eana.com.ar');
        this.origin = process.env.WEBAUTHN_ORIGIN || (isDev
            ? `http://localhost:${process.env.FRONTEND_PORT || '4200'}`
            : 'https://eana.com.ar');
    }

    private getRpIDAndOrigin(requestOrigin?: string) {
        if (!requestOrigin) return { rpID: this.rpID, origin: this.origin };
        try {
            const url = new URL(requestOrigin);
            return { rpID: url.hostname, origin: requestOrigin };
        } catch (e) {
            return { rpID: this.rpID, origin: this.origin };
        }
    }

    /**
     * PASO 1 REGISTRO: Generar opciones de registro para el cliente
     */
    async generateRegistrationOptions(userId: number, requestOrigin?: string): Promise<any> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['authenticators'],
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        const { rpID } = this.getRpIDAndOrigin(requestOrigin);
        const existingAuthenticators = user.authenticators || [];

        const options = await generateRegistrationOptions({
            rpName: this.rpName,
            rpID: rpID,
            userName: user.email,
            userDisplayName: user.email,
            excludeCredentials: existingAuthenticators.map((auth: any) => ({
                id: auth.credentialID,
                transports: auth.transports ? auth.transports.split(',') as any[] : [],
            })),
            authenticatorSelection: {
                authenticatorAttachment: 'platform',
                residentKey: 'preferred',
                userVerification: 'preferred',
            },
            timeout: 60000,
        });

        challengeStore.set(userId, options.challenge);
        setTimeout(() => challengeStore.delete(userId), 5 * 60 * 1000);

        return options;
    }

    /**
     * PASO 2 REGISTRO: Verificar la respuesta del cliente y guardar el authenticator
     */
    async verifyRegistration(userId: number, response: any, requestOrigin?: string): Promise<{ success: boolean; message: string }> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('Usuario no encontrado');

        const expectedChallenge = challengeStore.get(userId);
        if (!expectedChallenge) throw new BadRequestException('Challenge no encontrado o expirado. Vuelva a intentarlo.');

        const { rpID, origin } = this.getRpIDAndOrigin(requestOrigin);

        let verification: any;
        try {
            verification = await verifyRegistrationResponse({
                response,
                expectedChallenge,
                expectedOrigin: origin,
                expectedRPID: rpID,
                requireUserVerification: true,
            });
        } catch (error) {
            throw new BadRequestException(`Error de verificación: ${error.message}`);
        }

        const { verified, registrationInfo } = verification;

        if (!verified || !registrationInfo) {
            throw new UnauthorizedException('Verificación biométrica fallida');
        }

        challengeStore.delete(userId);

        const credentialID = registrationInfo.credential?.id ?? registrationInfo.credentialID ?? registrationInfo.credential?.credentialID;
        const credentialPublicKey = registrationInfo.credential?.publicKey ?? registrationInfo.credentialPublicKey;
        const counter = registrationInfo.credential?.counter ?? registrationInfo.counter ?? 0;
        const credentialDeviceType = registrationInfo.credentialDeviceType ?? 'singleDevice';
        const credentialBackedUp = registrationInfo.credentialBackedUp ?? false;

        const authenticator = this.authenticatorRepository.create({
            credentialID: credentialID,
            credentialPublicKey: Buffer.from(credentialPublicKey),
            counter: counter.toString(),
            credentialDeviceType,
            credentialBackedUp,
            transports: response.response.transports?.join(',') || '',
            userId: user.id,
        });

        await this.authenticatorRepository.save(authenticator);

        return { success: true, message: 'Biométrico registrado exitosamente.' };
    }

    /**
     * PASO 1 AUTENTICACIÓN: Generar opciones de autenticación
     */
    async generateAuthenticationOptions(userId: number, requestOrigin?: string): Promise<any> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['authenticators'],
        });

        if (!user) throw new NotFoundException('Usuario no encontrado');
        if (!user.authenticators || user.authenticators.length === 0) {
            throw new BadRequestException('No hay biométrico registrado para este usuario.');
        }

        const { rpID } = this.getRpIDAndOrigin(requestOrigin);

        const options = await generateAuthenticationOptions({
            rpID: rpID,
            allowCredentials: user.authenticators.map((auth: any) => ({
                id: auth.credentialID,
                transports: auth.transports ? auth.transports.split(',') as any[] : [],
            })),
            userVerification: 'preferred',
            timeout: 60000,
        });

        challengeStore.set(userId, options.challenge);
        setTimeout(() => challengeStore.delete(userId), 5 * 60 * 1000);

        return options;
    }

    /**
     * PASO 2 AUTENTICACIÓN: Verificar y loguear al usuario
     */
    async verifyAuthentication(userId: number, response: any, requestOrigin?: string): Promise<{
        access_token: string;
        user: { id: number; email: string; role: string; context: any };
    }> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['authenticators', 'personal', 'personal.aeropuerto', 'personal.fir', 'personal.puesto', 'personal.aeropuerto.fir'],
        });

        if (!user) throw new NotFoundException('Usuario no encontrado');

        const expectedChallenge = challengeStore.get(userId);
        if (!expectedChallenge) {
            throw new BadRequestException('Challenge no encontrado o expirado.');
        }

        const authenticator = user.authenticators.find(
            (a: any) => a.credentialID === response.id
        );

        if (!authenticator) {
            throw new UnauthorizedException('Dispositivo biométrico no reconocido');
        }

        const { rpID, origin } = this.getRpIDAndOrigin(requestOrigin);

        let verification: any;
        try {
            verification = await verifyAuthenticationResponse({
                response,
                expectedChallenge,
                expectedOrigin: origin,
                expectedRPID: rpID,
                authenticator: {
                    credentialID: authenticator.credentialID as string,
                    credentialPublicKey: new Uint8Array(authenticator.credentialPublicKey),
                    counter: parseInt(authenticator.counter),
                    transports: authenticator.transports ? authenticator.transports.split(',') as any[] : [],
                },
                requireUserVerification: true,
            } as any);
        } catch (error) {
            throw new UnauthorizedException(`Error de autenticación biométrica: ${error.message}`);
        }

        const { verified, authenticationInfo } = verification;

        if (!verified) {
            throw new UnauthorizedException('Autenticación biométrica fallida');
        }

        await this.authenticatorRepository.update(
            { id: authenticator.id },
            { counter: authenticationInfo.newCounter.toString() }
        );

        challengeStore.delete(userId);

        // Generar JWT exactamente igual que el login normal
        const payload = { email: user.email, sub: user.id, role: user.role };
        const token = this.jwtService.sign(payload);

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
            sector,
            aeropuerto: user.personal.aeropuerto?.nombre,
            aeropuertoCodigo: user.personal.aeropuerto?.codigo,
            fir: user.personal.fir?.nombre || user.personal.aeropuerto?.fir?.nombre,
            puesto: user.personal.puesto?.nombre,
        } : null;

        return {
            access_token: token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                context,
            },
        };
    }

    /**
     * Verificar si el usuario tiene biométrico registrado
     */
    async hasPasskey(userId: number): Promise<{ hasPasskey: boolean; count: number }> {
        const count = await this.authenticatorRepository.count({ where: { userId } });
        return { hasPasskey: count > 0, count };
    }

    /**
     * Eliminar todos los biométricos de un usuario
     */
    async removePasskeys(userId: number): Promise<{ success: boolean; message: string }> {
        await this.authenticatorRepository.delete({ userId });
        return { success: true, message: 'Dispositivos biométricos eliminados' };
    }
}
