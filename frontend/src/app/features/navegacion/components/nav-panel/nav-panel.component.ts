import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Signal, Activity, AlertTriangle, CheckCircle, XCircle, ArrowUpDown, ExternalLink, Zap, Monitor, Edit2, Save, ArrowLeft } from 'lucide-angular';
import { NavegacionService } from '../../../../core/services/navegacion.service';

interface NavEquipment {
    id: number;
    nombre: string;     // Site Name (VOR MALARGUE)
    tipo: string;       // Type (VOR, DME) of the SITE
    tipoEquipo: string; // Component Type (Transmitter 1, Monitor, etc.)
    marca: string;
    modelo: string;
    numeroSerie?: string;
    estado: string;
    aeropuerto?: { nombre: string; codigo: string };

    // New Excel Fields
    ayuda?: string;
    asociadoA?: string;
    frecuencia?: string;
    oaci?: string;
    latitud?: number;
    longitud?: number;

    activeSide?: 'MAIN' | 'STANDBY';
}

interface NavSystem {
    id: number;        // Shared Navegacion ID
    name: string;      // VOR MALARGUE
    type: string;      // VOR
    airport: string;
    status: string;
    components: NavEquipment[];
    main?: NavEquipment;
    standby?: NavEquipment;
    monitor?: NavEquipment;
    hasMain: boolean;
    hasStandby: boolean;
    activeSide: 'MAIN' | 'STANDBY';
    // Visual props
    statusClass: string;
    statusLabel: string;
}

@Component({
    selector: 'app-nav-panel',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './nav-panel.component.html'
})
export class NavPanelComponent implements OnChanges {
    @Input() equipments: any[] = [];
    private navService = inject(NavegacionService);

    systems: NavSystem[] = [];

    readonly Signal = Signal;
    readonly Activity = Activity;
    readonly AlertTriangle = AlertTriangle;
    readonly CheckCircle = CheckCircle;
    readonly XCircle = XCircle;
    readonly ArrowUpDown = ArrowUpDown;
    readonly ExternalLink = ExternalLink;
    readonly Zap = Zap;
    readonly Monitor = Monitor;
    readonly Edit2 = Edit2;
    readonly Save = Save;
    readonly ArrowLeft = ArrowLeft;

    selectedSystem: NavSystem | null = null;
    editingSystem: NavSystem | null = null;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['equipments'] && this.equipments) {
            this.processSystems();
        }
    }

    processSystems() {
        const grouped = new Map<string, NavSystem>();

        this.equipments.forEach(eq => {
            // Group by Site Name + Aid Type
            const siteName = eq.nombre || 'Ubicación Desconocida';
            const aidType = eq.ayuda || eq.tipo || 'NAV';
            const key = `${siteName}-${aidType}`;

            if (!grouped.has(key)) {
                grouped.set(key, {
                    id: (eq as any).navegacionId || eq.id,
                    name: siteName,
                    type: aidType,
                    airport: eq.oaci || (eq.aeropuerto?.codigo || (eq.aeropuerto?.nombre || 'Unknown')),
                    status: eq.estado || 'OK',
                    components: [],
                    hasMain: false,
                    hasStandby: false,
                    activeSide: 'MAIN',
                    statusClass: '',
                    statusLabel: ''
                });
            }

            const system = grouped.get(key)!;
            system.components.push(eq);

            // Identify Roles (naive approach based on string matching)
            const typeUpper = (eq.tipoEquipo || '').toUpperCase();
            const modelUpper = (eq.modelo || '').toUpperCase();

            let isStandby = typeUpper.includes('STANDBY') || typeUpper.includes('STBY') || typeUpper.includes('DUPE');
            if (!isStandby) isStandby = modelUpper.includes('STANDBY');

            if (isStandby) {
                if (!system.standby) {
                    system.standby = eq;
                    system.hasStandby = true;
                }
            } else {
                // Assume Main
                if (!system.main) {
                    system.main = eq;
                    system.hasMain = true;
                } else {
                    // If we already have main, maybe this is standby?
                    if (!system.standby) {
                        system.standby = eq;
                        system.hasStandby = true;
                    }
                }
            }
        });

        // Calculate Statuses
        this.systems = Array.from(grouped.values()).map(sys => {
            this.syncVisualState(sys);
            return sys;
        });
    }

    setSide(sys: NavSystem, side: 'MAIN' | 'STANDBY') {
        sys.activeSide = side;
        this.syncVisualState(sys);
    }

    toggleSide(event: Event, sys: NavSystem) {
        event.stopPropagation();
        sys.activeSide = sys.activeSide === 'MAIN' ? 'STANDBY' : 'MAIN';
        this.syncVisualState(sys);
    }

    syncVisualState(sys: NavSystem) {
        const active = sys.activeSide === 'MAIN' ? sys.main : sys.standby;
        // If active side is missing, show other? No, strict mode requested previously.
        // But for Nav, we might have multiple components.

        // Determine overall status based on Active Side
        const state = active?.estado || 'FUERA_SERVICIO'; // Default to Bad if missing

        sys.statusLabel = state === 'OK' ? 'OPERATIVO' : state;

        switch (state) {
            case 'OK':
            case 'OPERATIVO':
                sys.statusClass = 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
                break;
            case 'NOVEDAD':
            case 'PRECAUCION':
                sys.statusClass = 'text-amber-400 bg-amber-400/10 border-amber-400/20';
                break;
            default:
                sys.statusClass = 'text-red-400 bg-red-400/10 border-red-400/20';
        }
    }

    openDetails(sys: NavSystem) {
        this.selectedSystem = sys;
    }

    closeDetails() {
        this.selectedSystem = null;
    }

    openEdit(sys: NavSystem) {
        this.editingSystem = JSON.parse(JSON.stringify(sys)); // Deep clone for editing
    }

    closeEdit() {
        this.editingSystem = null;
    }

    saveEdit() {
        if (!this.editingSystem) return;

        const sys = this.editingSystem;
        this.navService.updateSystem(sys.id, {
            name: sys.name,
            type: sys.type,
            main: sys.main,
            standby: sys.standby
        }).subscribe({
            next: () => {
                const index = this.systems.findIndex(s => s.id === sys.id);
                if (index !== -1) {
                    this.systems[index] = sys;
                    this.syncVisualState(this.systems[index]);
                }
                this.closeEdit();
            },
            error: (err) => {
                console.error('Error updating system:', err);
            }
        });
    }
}
