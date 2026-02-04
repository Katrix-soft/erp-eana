import { LoggerService } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export class ProductionLogger implements LoggerService {
    private logDir = path.join(process.cwd(), 'logs');
    private logFile = path.join(this.logDir, `app-${new Date().toISOString().split('T')[0]}.log`);
    private errorFile = path.join(this.logDir, `error-${new Date().toISOString().split('T')[0]}.log`);

    constructor() {
        // Crear directorio de logs si no existe
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    private formatMessage(level: string, message: any, context?: string): string {
        const timestamp = new Date().toISOString();
        const contextStr = context ? `[${context}]` : '';
        const messageStr = typeof message === 'object' ? JSON.stringify(message) : message;
        return `${timestamp} [${level}] ${contextStr} ${messageStr}\n`;
    }

    private writeToFile(file: string, message: string) {
        try {
            fs.appendFileSync(file, message);
        } catch (error) {
            console.error('Error writing to log file:', error);
        }
    }

    log(message: any, context?: string) {
        const formatted = this.formatMessage('LOG', message, context);
        console.log(formatted.trim());
        this.writeToFile(this.logFile, formatted);
    }

    error(message: any, trace?: string, context?: string) {
        const formatted = this.formatMessage('ERROR', message, context);
        const traceStr = trace ? `\nStack: ${trace}\n` : '';
        const fullMessage = formatted + traceStr;

        console.error(fullMessage.trim());
        this.writeToFile(this.errorFile, fullMessage);
        this.writeToFile(this.logFile, fullMessage);
    }

    warn(message: any, context?: string) {
        const formatted = this.formatMessage('WARN', message, context);
        console.warn(formatted.trim());
        this.writeToFile(this.logFile, formatted);
    }

    debug(message: any, context?: string) {
        // En producción, solo loguear debug a archivo, no a consola
        if (process.env.NODE_ENV !== 'production') {
            const formatted = this.formatMessage('DEBUG', message, context);
            console.debug(formatted.trim());
            this.writeToFile(this.logFile, formatted);
        }
    }

    verbose(message: any, context?: string) {
        // En producción, solo loguear verbose a archivo, no a consola
        if (process.env.NODE_ENV !== 'production') {
            const formatted = this.formatMessage('VERBOSE', message, context);
            console.log(formatted.trim());
            this.writeToFile(this.logFile, formatted);
        }
    }
}
