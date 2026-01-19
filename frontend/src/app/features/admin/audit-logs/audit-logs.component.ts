import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuditService } from '../../../core/services/audit.service';
import { AuditLog } from '../../../core/models/audit-log.model';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search } from 'lucide-angular';

@Component({
    selector: 'app-audit-logs',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './audit-logs.component.html',
    styles: [`
        .glass-card {
            background: linear-gradient(145deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.03);
        }
        @keyframes slideInUp {
            from { transform: translateY(30px) scale(0.98); opacity: 0; }
            to { transform: translateY(0) scale(1); opacity: 1; }
        }
        .animate-slide-up {
            animation: slideInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
    `]
})
export class AuditLogsComponent implements OnInit {
    readonly Search = Search;
    logs: AuditLog[] = [];
    filteredLogs: AuditLog[] = [];
    searchQuery = '';

    constructor(private auditService: AuditService) { }

    ngOnInit(): void {
        this.loadLogs();
    }

    loadLogs(): void {
        this.auditService.getAll().subscribe({
            next: (data) => {
                this.logs = data;
                this.filteredLogs = data;
            },
            error: (err) => console.error('Error loading audit logs:', err)
        });
    }

    onSearch(): void {
        const query = this.searchQuery.toLowerCase();
        this.filteredLogs = this.logs.filter(log =>
            log.action.toLowerCase().includes(query) ||
            log.entity.toLowerCase().includes(query) ||
            log.user?.email.toLowerCase().includes(query) ||
            log.entityId.toString().includes(query)
        );
    }

    getActionClass(action: string): string {
        switch (action) {
            case 'POST': return 'action-create';
            case 'PUT':
            case 'PATCH': return 'action-update';
            case 'DELETE': return 'action-delete';
            default: return 'action-other';
        }
    }

    formatValue(value: any): string {
        if (!value) return '-';
        if (typeof value === 'object') return JSON.stringify(value, null, 2);
        return value.toString();
    }
}
