import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
    constructor(private auditService: AuditService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const { method, url, user, body, ip } = request;
        const userAgent = request.get('user-agent');

        // Only log write operations
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
            return next.handle().pipe(
                tap((response) => {
                    // Extract entity from URL (e.g., /vhf-equipos -> VhfEquipo)
                    const entity = this.extractEntity(url);
                    if (!entity || !user) return;

                    this.auditService.log({
                        userId: user.id || user.userId,
                        action: method,
                        entity: entity,
                        entityId: response?.id || parseInt(request.params?.id) || 0,
                        newValue: method !== 'DELETE' ? body : null,
                        ipAddress: ip,
                        userAgent: userAgent,
                    });
                }),
            );
        }

        return next.handle();
    }

    private extractEntity(url: string): string {
        const parts = url.split('/');
        // Simple logic to find the main entity in path
        const candidate = parts.find(p => p && !['api', 'v1'].includes(p));
        return candidate ? candidate.charAt(0).toUpperCase() + candidate.slice(1) : 'Unknown';
    }
}
