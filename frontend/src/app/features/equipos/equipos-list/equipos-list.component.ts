import { Component, inject, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EquipmentService } from '../../../core/services/equipment.service';
import { AuthService } from '../../../core/services/auth.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LucideAngularModule, LayoutGrid, List, Plus, Pencil, Trash2, FileText, X } from 'lucide-angular';
import { RadioPanelComponent } from '../radio-panel/radio-panel.component';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { CacheService } from '../../../core/services/cache.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

interface EquipoItem {
    id: number;
    vhfId: number;
    tipoEquipo: string;
    marca: string;
    modelo: string;
    numeroSerie: string;
    tecnologia?: string;
    activoFijo?: string;
    estado?: 'OK' | 'NOVEDAD' | 'FUERA_SERVICIO';
    vhf?: {
        sitio: string;
        aeropuerto: string;
    };
    frecuencia?: number | string;
    // Propiedades computadas para optimización
    stateClass?: string;
    displayEstado?: string;
    displayAeropuerto?: string;
}

interface VhfItem {
    id: number;
    sitio: string;
    aeropuerto: string;
}

@Component({
    selector: 'app-equipos-list',
    standalone: true,
    imports: [CommonModule, RouterModule, LucideAngularModule, RadioPanelComponent, ReactiveFormsModule, ModalComponent, SkeletonLoaderComponent, ConfirmModalComponent],
    templateUrl: './equipos-list.component.html',
    styleUrl: './equipos-list.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EquiposListComponent implements OnInit {
    private equipmentService = inject(EquipmentService);
    private authService = inject(AuthService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private fb = inject(FormBuilder);
    private cdr = inject(ChangeDetectorRef);
    private cacheService = inject(CacheService); // ✅ Inyectado
    private toastService = inject(ToastService);

    confirmModal = {
        isOpen: false,
        title: '',
        message: '',
        id: 0,
        type: 'warning' as 'danger' | 'warning' | 'success' | 'info'
    };

    toggleViewMode() {
        this.viewMode = this.viewMode === 'list' ? 'grid' : 'list';
        console.log('🔄 View mode changed to:', this.viewMode, '- Data length:', this.data.length);
    }
    viewMode: 'grid' | 'list' = 'grid';
    data: EquipoItem[] = [];
    loading = true;
    user$ = this.authService.user$;
    isAdmin = false;
    isTechnician = false;
    canDelete = false;
    canManage = false;

    isModalOpen = false;
    editingItem: EquipoItem | null = null;
    form!: FormGroup;
    vhfs: VhfItem[] = [];

    readonly LayoutGrid = LayoutGrid;
    readonly List = List;
    readonly Plus = Plus;
    readonly Pencil = Pencil;
    readonly Trash2 = Trash2;
    readonly FileText = FileText;
    readonly X = X;

    constructor() {
        this.initForm();
    }

    private initForm() {
        this.form = this.fb.group({
            vhfId: ['', Validators.required],
            tipoEquipo: ['', Validators.required],
            marca: ['', Validators.required],
            modelo: ['', Validators.required],
            numeroSerie: ['', Validators.required],
            tecnologia: [''],
            activoFijo: [''],
            frecuencia: [''],
            estado: ['OK']
        });
    }

    ngOnInit(): void {
        // ⚠️ IMPORTANTE: Invalidar caché anterior para asegurar datos frescos
        // Esto soluciona el problema de que muestre 0 equipos por recordar un estado fallido
        this.cacheService.invalidate('equipments:');
        console.log('🧹 Caché de equipos invalidado para forzar recarga');

        this.authService.user$.subscribe(user => {
            if (user) {
                this.isAdmin = ['ADMIN', 'CNS_NACIONAL'].includes(user.role);
                this.isTechnician = ['TECNICO', 'JEFE_COORDINADOR'].includes(user.role);
                this.canDelete = ['ADMIN', 'CNS_NACIONAL'].includes(user.role);
                this.canManage = ['ADMIN', 'CNS_NACIONAL'].includes(user.role);

                this.route.queryParams.subscribe(params => {
                    let mergedParams = { ...params };

                    // Solo ADMIN global y CNS NACIONAL pueden navegar libremente
                    const isGlobalAuthority = ['ADMIN', 'CNS_NACIONAL'].includes(user.role);

                    // Si NO es autoridad global, forzar SU contexto siempre
                    if (!isGlobalAuthority) {
                        if (user.context?.aeropuerto) {
                            mergedParams['aeropuerto'] = user.context.aeropuertoCodigo || user.context.aeropuerto;
                        }
                        if (user.context?.fir) {
                            mergedParams['fir'] = user.context.fir;
                        }
                    } else {
                        // Si es autoridad global, solo aplicar contexto si no vienen ya en la URL
                        if (!mergedParams['aeropuerto'] && user.context?.aeropuerto) {
                            mergedParams['aeropuerto'] = user.context.aeropuertoCodigo || user.context.aeropuerto;
                        }
                        if (!mergedParams['fir'] && user.context?.fir) {
                            mergedParams['fir'] = user.context.fir;
                        }
                    }

                    delete mergedParams['sector'];
                    this.loadEquipments(mergedParams);
                });
            }
        });
    }

    loadVhfs() {
        this.equipmentService.getVhf().subscribe({
            next: (data) => {
                this.vhfs = data;
                this.cdr.markForCheck();
            },
            error: (err) => console.error('Error cargando VHFs:', err)
        });
    }

    loadEquipments(params: any) {
        this.loading = true;
        this.cdr.markForCheck(); // Forzar detección de cambios
        console.log('📡 Cargando equipos con params:', params);

        this.equipmentService.getEquipments(params).subscribe({
            next: (data) => {
                console.log('✅ Equipos recibidos:', data.length);
                const user = this.authService.userValue;
                this.data = data.map(item => {
                    let displayAeropuerto = item.vhf?.aeropuerto || '';
                    if (user?.context?.aeropuerto && user?.context?.aeropuertoCodigo === displayAeropuerto) {
                        displayAeropuerto = user.context.aeropuerto;
                    }

                    return {
                        ...item,
                        displayAeropuerto,
                        stateClass: this.getStateClass(item.estado || 'OK'),
                        displayEstado: (item.estado === 'OK' ? 'OPERATIVO' : (item.estado === 'NOVEDAD' ? 'CON NOVEDAD' : (item.estado || 'OPERATIVO'))).replace('_', ' ')
                    };
                });
                this.loading = false;
                this.cdr.markForCheck(); // Forzar detección de cambios
            },
            error: (err) => {
                console.error('❌ Error cargando equipos:', err);
                this.loading = false;
                this.cdr.markForCheck(); // Forzar detección de cambios
            }
        });
    }

    openModal(item: EquipoItem | null = null) {
        this.editingItem = item;
        if (item) {
            this.form.patchValue(item);
        } else {
            this.form.reset({ estado: 'OK' });
        }
        this.isModalOpen = true;
    }

    closeModal() {
        this.isModalOpen = false;
        this.editingItem = null;
        this.form.reset({ estado: 'OK' });
    }

    onSubmit() {
        if (this.form.invalid) return;

        const payload = {
            ...this.form.value,
            vhfId: parseInt(this.form.value.vhfId),
            frecuencia: this.form.value.frecuencia ? parseFloat(this.form.value.frecuencia) : undefined
        };

        const request = this.editingItem
            ? this.equipmentService.updateEquipment(this.editingItem.id, payload)
            : this.equipmentService.createEquipment(payload);

        request.subscribe({
            next: () => {
                this.toastService.success(this.editingItem ? 'Equipo actualizado' : 'Equipo creado');
                this.closeModal();
                this.loadEquipments(this.route.snapshot.queryParams);
            },
            error: (err) => {
                console.error('Error guardando equipo:', err);
                this.toastService.error('Hubo un problema al procesar los datos.');
            }
        });
    }

    deleteItem(id: number) {
        this.confirmModal = {
            isOpen: true,
            title: '¿Eliminar equipo?',
            message: 'Esta acción eliminará el equipo permanentemente de la base de datos.',
            id: id,
            type: 'danger'
        };
    }

    handleConfirmDelete() {
        const id = this.confirmModal.id;
        this.confirmModal.isOpen = false;

        this.equipmentService.deleteEquipment(id).subscribe({
            next: () => {
                this.toastService.success('El equipo ha sido eliminado correctamente.');
                this.loadEquipments(this.route.snapshot.queryParams);
            },
            error: (err) => {
                console.error(err);
                this.toastService.error('No se pudo eliminar el equipo.');
            }
        });
    }

    handleCancelDelete() {
        this.confirmModal.isOpen = false;
    }

    getStateClass(estado: string) {
        switch (estado) {
            case 'OK':
            case 'OPERATIVO': return 'bg-green-500 text-white shadow-lg shadow-green-500/20';
            case 'NOVEDAD':
            case 'PRECAUCION': return 'bg-yellow-400 text-black shadow-lg shadow-yellow-500/20';
            case 'FUERA_SERVICIO':
            case 'FALLA': return 'bg-red-500 text-white shadow-lg shadow-red-500/20';
            default: return 'bg-slate-700 text-slate-200';
        }
    }

    openModalById(id: number) {
        const item = this.data.find(e => e.id === id);
        if (item) {
            this.openModal(item);
        }
    }

    handleChecklist(item: EquipoItem) {
        const stationName = item.vhf?.sitio || '';
        this.router.navigate(['/checklists/new'], { queryParams: { station: stationName } });
    }

    // TrackBy function para optimizar ngFor
    trackByEquipoId(index: number, item: EquipoItem): number {
        return item.id;
    }

    trackByVhfId(index: number, item: VhfItem): number {
        return item.id;
    }
}

