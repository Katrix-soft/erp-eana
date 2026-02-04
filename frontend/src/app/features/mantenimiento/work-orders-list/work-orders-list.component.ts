import { Component, OnInit, inject } from '@angular/core';
import { LucideAngularModule, Search, ChevronDown, MapPin, Eye, CheckCircle, FileText, Plus, X } from 'lucide-angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { WorkOrdersService } from '../../../core/services/work-orders.service';
import { WorkOrder } from '../../../core/models/work-order.model';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-work-orders-list',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './work-orders-list.component.html',
    styles: [`
        .glass-card {
            background: linear-gradient(145deg, rgba(15, 23, 42, 0.4) 0%, rgba(30, 41, 59, 0.6) 100%);
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
export class WorkOrdersListComponent implements OnInit {
    readonly Search = Search;
    readonly ChevronDown = ChevronDown;
    readonly MapPin = MapPin;
    readonly Eye = Eye;
    readonly CheckCircle = CheckCircle;
    readonly FileText = FileText;
    readonly Plus = Plus;
    readonly X = X;
    orders: WorkOrder[] = [];
    filteredOrders: WorkOrder[] = [];
    pendingCount = 0;
    private router = inject(Router);
    private workOrdersService = inject(WorkOrdersService);
    private http = inject(HttpClient);

    // Form states
    showCreateModal = false;
    isSaving = false;
    equipments: any[] = [];
    newOrder: {
        equipoId: number | undefined;
        descripcion: string;
        prioridad: string;
        solicitante: string;
    } = {
            equipoId: undefined,
            descripcion: '',
            prioridad: 'MEDIA',
            solicitante: ''
        };

    constructor() { }

    ngOnInit(): void {
        this.loadOrders();
        this.loadEquipments();
    }

    loadEquipments(): void {
        // Obtenemos los equipos para el select del modal
        this.http.get<any[]>('/api/v1/vhf-equipos/dropdown').subscribe(data => {
            this.equipments = data;
        });
    }

    openCreateModal(): void {
        this.showCreateModal = true;
    }

    closeCreateModal(): void {
        this.showCreateModal = false;
        this.resetNewOrder();
    }

    resetNewOrder(): void {
        this.newOrder = {
            equipoId: undefined,
            descripcion: '',
            prioridad: 'MEDIA',
            solicitante: ''
        };
    }

    saveOrder(): void {
        if (!this.newOrder.equipoId || !this.newOrder.descripcion) return;

        this.isSaving = true;
        this.workOrdersService.create(this.newOrder as any).subscribe({
            next: () => {
                this.isSaving = false;
                this.closeCreateModal();
                this.loadOrders();
            },
            error: (err) => {
                this.isSaving = false;
                console.error('Error creating order:', err);
            }
        });
    }

    loadOrders(): void {
        this.workOrdersService.getAll().subscribe({
            next: (data) => {
                this.orders = data;
                this.filteredOrders = data;
                this.updateStats();
            },
            error: (err) => console.error('Error loading work orders:', err)
        });
    }

    updateStats(): void {
        this.pendingCount = this.orders.filter(o => ['ABIERTA', 'EN_PROGRESO', 'ESPERANDO_REPUESTO'].includes(o.estado)).length;
    }

    onSearch(event: Event): void {
        const query = (event.target as HTMLInputElement).value.toLowerCase();
        this.filteredOrders = this.orders.filter(o =>
            o.numero.toLowerCase().includes(query) ||
            o.equipo?.marca?.toLowerCase().includes(query) ||
            o.equipo?.modelo?.toLowerCase().includes(query)
        );
    }

    filterByStatus(event: Event): void {
        const status = (event.target as HTMLSelectElement).value;
        if (!status) {
            this.filteredOrders = this.orders;
        } else {
            this.filteredOrders = this.orders.filter(o => o.estado === status);
        }
    }

    completeOrder(order: WorkOrder): void {
        if (confirm(`¿Desea marcar la orden ${order.numero} como CERRADA ? El equipo volverá a estado OK.`)) {
            this.workOrdersService.update(order.id, { estado: 'CERRADA' }).subscribe({
                next: () => this.loadOrders(),
                error: (err) => console.error('Error closing order:', err)
            });
        }
    }

    viewDetails(order: WorkOrder): void {
        if (order.checklistId) {
            this.router.navigate(['/checklists', order.checklistId]);
        } else {
            console.warn('Esta OT no tiene un checklist asociado');
        }
    }


    exportPdf(order: WorkOrder): void {
        this.workOrdersService.exportPdf(order.id).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `OT - ${order.numero}.pdf`;
                a.click();
                window.URL.revokeObjectURL(url);
            },
            error: (err) => console.error('Error exporting PDF:', err)
        });
    }
}
