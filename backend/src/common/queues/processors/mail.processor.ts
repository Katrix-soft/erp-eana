import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Processor('mail')
export class MailProcessor extends WorkerHost {
    private readonly logger = new Logger(MailProcessor.name);
    private transporter;

    constructor(private configService: ConfigService) {
        super();
        this.transporter = nodemailer.createTransport({
            host: this.configService.get<string>('MAIL_HOST') || 'smtp.office365.com',
            port: this.configService.get<number>('MAIL_PORT') || 587,
            secure: false,
            auth: {
                user: this.configService.get<string>('MAIL_USER'),
                pass: this.configService.get<string>('MAIL_PASS'),
            },
            tls: {
                ciphers: 'SSLv3',
                rejectUnauthorized: false
            }
        });
    }

    async process(job: Job<any, any, string>): Promise<any> {
        this.logger.log(`📨 Processing mail job ${job.id} - Type: ${job.name}`);

        const { options } = job.data;

        try {
            const info = await this.transporter.sendMail(options);
            this.logger.log(`✅ Mail sent successfully: ${info.messageId}`);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            this.logger.error(`❌ Failed to send mail: ${error.message}`);
            throw error; // Let BullMQ handle retries
        }
    }
}
