export interface AuditLog {
    id: number;
    userId: number;
    action: string;
    entity: string;
    entityId: number;
    oldValue: any;
    newValue: any;
    ipAddress?: string;
    userAgent?: string;
    createdAt: string;
    user?: {
        email: string;
    };
}
