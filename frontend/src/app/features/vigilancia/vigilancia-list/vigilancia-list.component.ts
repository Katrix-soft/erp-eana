
import { Component, inject, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VigilanciaService, Vigilancia } from '../../../core/services/vigilancia.service';
import { AuthService } from '../../../core/services/auth.service';
import { take } from 'rxjs';
import { LucideAngularModule, Radar, MapPin, Activity, Shield, AlertTriangle, CheckCircle, RefreshCw, History, Sparkles, X } from 'lucide-angular';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { AiAssistantService } from '../../../core/services/ai-assistant.service';

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
              <div class="flex items-center gap-4">
                <div class="flex items-center gap-2">
                  <div [ngClass]="getStatusDotClass(eq.estado)" class="w-2.5 h-2.5 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                  <span class="text-xs font-bold tracking-widest uppercase" [ngClass]="getStatusTextClass(eq.estado)">
                    {{ eq.estado }}
                  </span>
                </div>
                <!-- Channel Indicator -->
                <div class="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                  <span class="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Canal:</span>
                  <span class="text-[10px] font-bold" [ngClass]="eq.canalActivo === 'CH1' ? 'text-sky-400' : 'text-purple-400'">
                    {{ eq.canalActivo || 'CH1' }}
                  </span>
                </div>
              </div>
              <span class="text-[10px] text-slate-600 font-mono tracking-tighter">ID: {{ eq.idApSig }}</span>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-2 pt-2">
              <button (click)="conmutarCanales(eq)" 
                      class="flex-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-[10px] font-bold py-2 px-2 rounded-xl flex items-center justify-center gap-1 transition-all duration-300 border border-sky-500/20 group/btn">
                <lucide-icon [name]="RefreshCw" [size]="12" class="group-hover/btn:rotate-180 transition-transform duration-500"></lucide-icon>
                Canales
              </button>
              <button (click)="verDetalles(eq)"
                      class="flex-1 bg-slate-800/50 hover:bg-slate-700 text-slate-300 text-[10px] font-bold py-2 px-2 rounded-xl flex items-center justify-center gap-1 transition-all duration-300 border border-white/5 hover:border-white/10 group/btn">
                <lucide-icon [name]="History" [size]="12" class="group-hover/btn:scale-110 transition-transform"></lucide-icon>
                Historial
              </button>
              <button (click)="reportarFalla(eq)"
                      class="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-2.5 rounded-xl transition-all duration-300 border border-red-500/20 group/ai shadow-lg shadow-red-500/5">
                <lucide-icon [name]="Sparkles" [size]="14" class="group-hover/ai:animate-pulse"></lucide-icon>
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

      <!-- Detalles Modal -->
      <div *ngIf="showDetailsModal && selectedEquipamiento" 
           class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
        <div class="bg-slate-900 w-full max-w-2xl rounded-[2.5rem] border border-white/10 shadow-3xl overflow-hidden animate-in zoom-in-95 duration-300">
          <!-- Modal Header -->
          <div class="relative p-8 pb-0">
            <div [ngClass]="getStatusClass(selectedEquipamiento.estado)" class="absolute top-0 left-0 w-full h-1.5"></div>
            <div class="flex justify-between items-start">
              <div>
                <span class="text-[10px] font-black uppercase tracking-[0.2em] text-sky-400 px-3 py-1 bg-sky-400/10 rounded-full mb-3 inline-block">
                  Ficha Técnica: {{ selectedEquipamiento.definicion || 'VIGILANCIA' }}
                </span>
                <h2 class="text-3xl font-black text-white tracking-tight">{{ selectedEquipamiento.ubicacion }}</h2>
              </div>
              <button (click)="showDetailsModal = false" class="p-3 hover:bg-white/5 rounded-2xl text-slate-500 hover:text-white transition-all">
                <lucide-icon [name]="X" [size]="24"></lucide-icon>
              </button>
            </div>
          </div>

          <!-- Modal Body -->
          <div class="p-8 space-y-8">
            <div class="grid grid-cols-2 gap-6">
              <div class="space-y-1">
                <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estado Operativo</p>
                <div class="flex items-center gap-2">
                  <div [ngClass]="getStatusDotClass(selectedEquipamiento.estado)" class="w-2.5 h-2.5 rounded-full shadow-lg border border-white/10"></div>
                  <p class="text-lg font-bold" [ngClass]="getStatusTextClass(selectedEquipamiento.estado)">{{ selectedEquipamiento.estado }}</p>
                </div>
              </div>
              <div class="space-y-1">
                <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest">ID Sistema (AP SIG)</p>
                <p class="text-lg font-bold text-white font-mono">{{ selectedEquipamiento.idApSig || 'N/A' }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Modelo Equipo</p>
                <p class="text-lg font-bold text-slate-200">{{ selectedEquipamiento.modelo || '---' }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sistema / Red</p>
                <p class="text-lg font-bold text-slate-200">{{ selectedEquipamiento.sistema || 'VIGILANCIA' }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Región (FIR)</p>
                <p class="text-lg font-bold text-slate-200">{{ selectedEquipamiento.fir }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Siglas Local</p>
                <p class="text-lg font-bold text-slate-200">{{ selectedEquipamiento.siglasLocal || '---' }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Canal en Servicio</p>
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full" [ngClass]="selectedEquipamiento.canalActivo === 'CH1' ? 'bg-sky-400' : 'bg-purple-400'"></div>
                  <p class="text-lg font-bold" [ngClass]="selectedEquipamiento.canalActivo === 'CH1' ? 'text-sky-400' : 'text-purple-400'">
                    {{ selectedEquipamiento.canalActivo || 'CH1' }}
                  </p>
                </div>
              </div>
            </div>

            <div class="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
              <h4 class="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <lucide-icon [name]="History" [size]="14"></lucide-icon>
                Historial de Mantenimientos
              </h4>
              <div class="space-y-3">
                <div class="flex justify-between items-center text-xs p-3 bg-slate-950/50 rounded-xl border border-white/5">
                  <span class="text-slate-400">2026-01-15</span>
                  <span class="font-bold text-emerald-400 italic">MANT. PREVENTIVO OK</span>
                </div>
                <div class="flex justify-between items-center text-xs p-3 bg-slate-950/50 rounded-xl border border-white/5">
                  <span class="text-slate-400">2025-12-10</span>
                  <span class="font-bold text-amber-400 italic">CAMBIO DE FILTROS</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="p-8 bg-black/20 flex gap-4">
            <button (click)="showDetailsModal = false" class="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all">
              Cerrar Ficha
            </button>
            <button (click)="reportarFalla(selectedEquipamiento)" class="flex-1 py-4 bg-red-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-red-500 transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2">
              <lucide-icon [name]="Sparkles" [size]="16"></lucide-icon>
              Reportar Falla
            </button>
            <button (click)="showDetailsModal = false; conmutarCanales(selectedEquipamiento)" class="flex-1 py-4 bg-sky-500 text-black font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/20">
              Conmutar
            </button>
          </div>
        </div>
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
  private vigilanciaService: VigilanciaService = inject(VigilanciaService);
  private authService: AuthService = inject(AuthService);
  private toastService: ToastService = inject(ToastService);
  private aiService: AiAssistantService = inject(AiAssistantService);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  equipamientos: Vigilancia[] = [];
  loading = true;
  showConfirmModal = false;
  showDetailsModal = false;
  selectedEquipamiento: Vigilancia | null = null;

  readonly Radar = Radar;
  readonly MapPin = MapPin;
  readonly Activity = Activity;
  readonly Shield = Shield;
  readonly AlertTriangle = AlertTriangle;
  readonly CheckCircle = CheckCircle;
  readonly RefreshCw = RefreshCw;
  readonly History = History;
  readonly Sparkles = Sparkles;
  readonly X = X;

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
    const nuevoCanal = this.selectedEquipamiento.canalActivo === 'CH2' ? 'CH1' : 'CH2';

    this.toastService.info(`Conmutando a ${nuevoCanal} para ${this.selectedEquipamiento.ubicacion}...`, 'Procesando');

    // Simular proceso y actualizar activo
    setTimeout(() => {
      if (this.selectedEquipamiento) {
        this.selectedEquipamiento.canalActivo = nuevoCanal;
        this.toastService.success(`Ahora operando en ${nuevoCanal}`, 'Conmutación Exitosa');
        this.cdr.markForCheck();
      }
    }, 1500);
  }

  verDetalles(eq: Vigilancia) {
    this.selectedEquipamiento = eq;
    this.showDetailsModal = true;
    this.cdr.markForCheck();
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

  reportarFalla(eq: Vigilancia) {
    const prompt = `Hola EANA AI. Deseo reportar una FALLA técnica en el equipo de VIGILANCIA: ${eq.ubicacion} (${eq.modelo}). Sistema: ${eq.sistema}. Región: ${eq.fir}. ID: ${eq.idApSig}. Por favor, ayúdame a generar una Orden de Trabajo (OT) técnica para este radar describiendo una falla en el procesamiento de blancos o en la etapa de RF, y sugiere los pasos de diagnóstico Senior según normativa CNS.`;
    this.aiService.openWithPrompt(prompt);
  }
}
