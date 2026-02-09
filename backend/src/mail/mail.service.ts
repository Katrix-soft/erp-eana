import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);

    constructor(
        private configService: ConfigService,
        @InjectQueue('mail') private mailQueue: Queue
    ) { }

    async sendChecklistEmail(checklist: any) {
        const mailTo = this.configService.get<string>('MAIL_DESTINATION') || 'cns-nacional@eana.com.ar';
        const station = checklist.estacion || 'Desconocida';
        const date = new Date(checklist.fecha).toLocaleDateString();

        this.logger.log(`📧 Queuing Checklist email #${checklist.id} for ${mailTo}`);

        const mailOptions = {
            from: `"ERP EANA - Notificaciones" <${this.configService.get<string>('MAIL_USER')}>`,
            to: mailTo,
            subject: `[CHECKLIST] Nueva Firma Digital - Estación: ${station} - ${date}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 10px;">
                    <h2 style="color: #004a99; border-bottom: 2px solid #004a99; padding-bottom: 10px;">Nuevo Checklist Firmado</h2>
                    <p>Se ha recibido un nuevo checklist con firmas digitales completas.</p>
                    
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>ID Checklist:</strong> #${checklist.id}</p>
                        <p><strong>Estación:</strong> ${station}</p>
                        <p><strong>Fecha:</strong> ${date}</p>
                        <p><strong>Estado:</strong> ${checklist.estado}</p>
                    </div>

                    <h3 style="color: #333;">Firmas Digitales:</h3>
                    <ul>
                        <li><strong>Técnico Local:</strong> ${checklist.firmaDigitalLocal || 'Firmado electrónicamente'}</li>
                        <li><strong>Técnico Regional:</strong> ${checklist.firmaDigitalRegional || 'Firmado electrónicamente'}</li>
                    </ul>

                    <p style="font-size: 12px; color: #666; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
                        Este es un mensaje automático generado por el Sistema ERP EANA. No responda a este mail.
                    </p>
                </div>
            `,
        };

        return this.mailQueue.add('send-checklist', { options: mailOptions }, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 }
        });
    }

    async sendPasswordResetEmail(email: string, token: string) {
        this.logger.log(`📧 Queuing recovery email for: ${email}`);
        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';
        const resetLink = `${frontendUrl}/reset-password?token=${token}`;

        const mailOptions = {
            from: `"Seguridad ERP EANA" <${this.configService.get<string>('MAIL_USER')}>`,
            to: email,
            subject: 'Recuperación de Contraseña - ERP EANA',
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 40px auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    <div style="background-color: #0f172a; padding: 32px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 0.05em;">ERP EANA</h1>
                    </div>
                    <div style="padding: 40px; background-color: #ffffff;">
                        <h2 style="color: #1e293b; font-size: 20px; font-weight: 700; margin-bottom: 24px;">Restablecer tu contraseña</h2>
                        <p style="color: #475569; line-height: 1.6; margin-bottom: 32px; font-size: 16px;">
                            Has solicitado restablecer la contraseña de tu cuenta. Haz clic en el siguiente botón para continuar. 
                            Este enlace expirará en 1 hora por motivos de seguridad.
                        </p>
                        <div style="text-align: center; margin-bottom: 32px;">
                            <a href="${resetLink}" style="background-color: #2563eb; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 600; display: inline-block; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);">
                                Restablecer Contraseña
                            </a>
                        </div>
                        <p style="color: #94a3b8; font-size: 14px; margin-bottom: 0;">
                            Si no solicitaste este cambio, puedes ignorar este correo de forma segura. Tu contraseña actual no se verá afectada.
                        </p>
                    </div>
                    <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                        <p style="color: #64748b; font-size: 12px; margin: 0;">
                            &copy; 2025 EANA - Gestión CNS. Todos los derechos reservados.
                        </p>
                    </div>
                </div>
            `,
        };

        return this.mailQueue.add('forgot-password', { options: mailOptions }, {
            attempts: 3,
            priority: 1
        });
    }

    async sendPasswordChangedNotification(email: string) {
        const mailOptions = {
            from: `"ERP EANA" <${this.configService.get<string>('MAIL_USER')}>`,
            to: email,
            subject: 'Tu contraseña ha sido cambiada',
            text: 'Te informamos que la contraseña de tu cuenta en ERP EANA ha sido modificada recientemente.',
        };

        return this.mailQueue.add('password-changed', { options: mailOptions });
    }
}

