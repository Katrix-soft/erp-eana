
import { Component, inject, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VigilanciaService, Vigilancia } from '../../../core/services/vigilancia.service';
import { AuthService } from '../../../core/services/auth.service';
import { take } from 'rxjs';
import { LucideAngularModule, Radar, MapPin, Activity, Shield, AlertTriangle, CheckCircle, RefreshCw, History } from 'lucide-angular';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-vigilancia-list',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, SkeletonLoaderComponent, ConfirmModalComponent],
  template: `
    <div class="min-h-screen bg-slate-950 p-6 space-y-8">
      <!-- Header -->
      <div class="flex items-center justify-between animate-in slide-in-from-top duration-500">
        <div>
          <h1 class="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <lucide-icon [name]="Radar" class="text-sky-400" [size]="32"></lucide-icon>
            Equipamiento de Vigilancia
          </h1>
          <p class="text-slate-400 mt-2">Monitoreo y estado de radares y sistemas de vigilancia</p>
        </div>
      </div>

      <!-- Stats / Quick Info -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in zoom-in duration-500 delay-100">
        <div class="bg-slate-900/50 border border-white/5 rounded-2xl p-6 flex items-center gap-4">
          <div class="p-3 bg-sky-500/10 rounded-xl text-sky-400">
            <lucide-icon [name]="Radar" [size]="24"></lucide-icon>
          </div>
          <div>
            <p class="text-sm text-slate-400 font-medium">Total Equipos</p>
            <p class="text-2xl font-bold text-white">{{ equipamientos.length }}</p>
          </div>
        </div>
        <div class="bg-slate-900/50 border border-white/5 rounded-2xl p-6 flex items-center gap-4">
          <div class="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
            <lucide-icon [name]="CheckCircle" [size]="24"></lucide-icon>
          </div>
          <div>
            <p class="text-sm text-slate-400 font-medium">Operativos</p>
            <p class="text-2xl font-bold text-white">{{ getOperativosCount() }}</p>
          </div>
        </div>
        <div class="bg-slate-900/50 border border-white/5 rounded-2xl p-6 flex items-center gap-4">
          <div class="p-3 bg-red-500/10 rounded-xl text-red-400">
            <lucide-icon [name]="AlertTriangle" [size]="24"></lucide-icon>
          </div>
          <div>
            <p class="text-sm text-slate-400 font-medium">Fuera de Servicio</p>
            <p class="text-2xl font-bold text-white">{{ getFueraServicioCount() }}</p>
          </div>
        </div>
      </div>

      <!-- Grid de Equipos -->
      <div *ngIf="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <app-skeleton-loader *ngFor="let i of [1,2,3,4,5,6]" class="h-64 rounded-2xl"></app-skeleton-loader>
      </div>

      <div *ngIf="!loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-200">
        <div *ngFor="let eq of equipamientos" 
             class="group relative bg-slate-900 rounded-2xl border border-white/10 overflow-hidden hover:border-sky-500/50 hover:bg-slate-800/80 transition-all duration-300 shadow-lg hover:shadow-sky-500/10">
          
          <!-- Status Banner -->
          <div [ngClass]="getStatusClass(eq.estado)" class="h-1.5 w-full"></div>

          <div class="p-6 space-y-4">
            <!-- Header Card -->
            <div class="flex justify-between items-start">
              <div>
                <span class="text-[10px] font-bold uppercase tracking-wider text-sky-400 px-2 py-0.5 bg-sky-400/10 rounded-full mb-2 inline-block">
                  {{ eq.definicion || 'VIGILANCIA' }}
                </span>
                <h3 class="text-xl font-bold text-white group-hover:text-sky-400 transition-colors">{{ eq.ubicacion }}</h3>
              </div>
              <div class="flex flex-col items-end">
                <span class="text-xs font-mono font-bold text-slate-500 px-2 py-1 bg-white/5 rounded">{{ eq.siglasLocal }}</span>
              </div>
            </div>

            <!-- Details -->
            <div class="space-y-2 py-2">
              <div class="flex items-center gap-2 text-slate-300 text-sm">
                <lucide-icon [name]="Shield" [size]="14" class="opacity-50"></lucide-icon>
                <span class="font-medium">Modelo:</span>
                <span class="text-slate-400">{{ eq.modelo || '---' }}</span>
              </div>
              <div class="flex items-center gap-2 text-slate-300 text-sm">
                <lucide-icon [name]="Activity" [size]="14" class="opacity-50"></lucide-icon>
                <span class="font-medium">Sistema:</span>
                <span class="text-slate-400">{{ eq.sistema || '---' }}</span>
              </div>
              <div class="flex items-center gap-2 text-slate-300 text-sm">
                <lucide-icon [name]="MapPin" [size]="14" class="opacity-50"></lucide-icon>
                <span class="font-medium">FIR:</span>
                <span class="text-slate-400">{{ eq.fir }}</span>
              </div>
            </div>

            <!-- Separator -->
            <div class="h-px bg-white/5 w-full"></div>

            <!-- Footer Card -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div [ngClass]="getStatusDotClass(eq.estado)" class="w-2.5 h-2.5 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                <span class="text-xs font-bold tracking-widest uppercase" [ngClass]="getStatusTextClass(eq.estado)">
                  {{ eq.estado }}
                </span>
              </div>
              <span class="text-[10px] text-slate-600 font-mono tracking-tighter">ID: {{ eq.idApSig }}</span>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-2 pt-2">
              <button (click)="conmutarCanales(eq)" 
                      class="flex-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 border border-sky-500/20 group/btn">
                <lucide-icon [name]="RefreshCw" [size]="14" class="group-hover/btn:rotate-180 transition-transform duration-500"></lucide-icon>
                Conmutar Canales
              </button>
              <button (click)="verDetalles(eq)"
                      class="flex-1 bg-slate-800/50 hover:bg-slate-700 text-slate-300 text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 border border-white/5 hover:border-white/10 group/btn">
                <lucide-icon [name]="History" [size]="14" class="group-hover/btn:scale-110 transition-transform"></lucide-icon>
                Historial
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading && equipamientos.length === 0" class="flex flex-col items-center justify-center py-40 animate-in fade-in duration-700">
        <div class="p-8 bg-slate-900/50 rounded-full mb-6 border border-white/5">
          <lucide-icon [name]="Radar" [size]="64" class="text-slate-700 opacity-20"></lucide-icon>
        </div>
        <p class="text-xl font-medium text-slate-500">No se encontraron equipos de vigilancia en su región.</p>
      </div>

      <!-- Modals -->
      <app-confirm-modal
        [isOpen]="showConfirmModal"
        [title]="'Confirmar Conmutación'"
        [message]="'¿Estás seguro que deseas conmutar los canales del equipo ' + selectedEquipamiento?.ubicacion + '?'"
        [confirmText]="'Conmutar'"
        [cancelText]="'Cancelar'"
        [type]="'info'"
        (onConfirm)="confirmConmutar()"
        (onCancel)="showConfirmModal = false"
      ></app-confirm-modal>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VigilanciaListComponent implements OnInit {
  private vigilanciaService = inject(VigilanciaService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  equipamientos: Vigilancia[] = [];
  loading = true;
  showConfirmModal = false;
  selectedEquipamiento: Vigilancia | null = null;

  readonly Radar = Radar;
  readonly MapPin = MapPin;
  readonly Activity = Activity;
  readonly Shield = Shield;
  readonly AlertTriangle = AlertTriangle;
  readonly CheckCircle = CheckCircle;
  readonly RefreshCw = RefreshCw;
  readonly History = History;

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.authService.user$.pipe(take(1)).subscribe(user => {
      const filters: any = {};

      if (user?.role !== 'ADMIN' && user?.role !== 'CNS_NACIONAL') {
        if (user?.context?.aeropuertoCodigo) {
          filters.aeropuerto = user.context.aeropuertoCodigo;
        } else if (user?.context?.fir) {
          filters.fir = user.context.fir;
        }
      }

      this.vigilanciaService.getEquipamientos(filters).subscribe({
        next: (data) => {
          this.equipamientos = data;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error loading vigilancia:', err);
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
    });
  }

  conmutarCanales(eq: Vigilancia) {
    this.selectedEquipamiento = eq;
    this.showConfirmModal = true;
    this.cdr.markForCheck();
  }

  confirmConmutar() {
    if (!this.selectedEquipamiento) return;

    this.showConfirmModal = false;
    this.toastService.info(`Iniciando conmutación de canales para ${this.selectedEquipamiento.ubicacion}...`, 'Procesando');

    // Simular proceso
    setTimeout(() => {
      this.toastService.success(`Conmutación completada exitosamente para ${this.selectedEquipamiento?.ubicacion}`, 'Operación Exitosa');
      this.cdr.markForCheck();
    }, 2000);
  }

  verDetalles(eq: Vigilancia) {
    this.toastService.info(`Cargando historial de mantenimientos para ${eq.ubicacion}...`, 'Historial');
    // Implementación futura: Navegar a detalles o abrir modal de historial
  }

  getOperativosCount() {
    return this.equipamientos.filter(e => e.estado === 'OK').length;
  }

  getFueraServicioCount() {
    return this.equipamientos.filter(e => e.estado === 'FUERA_SERVICIO').length;
  }

  getStatusClass(estado: string) {
    switch (estado) {
      case 'OK': return 'bg-emerald-500';
      case 'NOVEDAD': return 'bg-amber-500';
      case 'FUERA_SERVICIO': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  }

  getStatusDotClass(estado: string) {
    switch (estado) {
      case 'OK': return 'bg-emerald-500';
      case 'NOVEDAD': return 'bg-amber-500';
      case 'FUERA_SERVICIO': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  }

  getStatusTextClass(estado: string) {
    switch (estado) {
      case 'OK': return 'text-emerald-500';
      case 'NOVEDAD': return 'text-amber-500';
      case 'FUERA_SERVICIO': return 'text-red-500';
      default: return 'text-slate-500';
    }
  }
}
