
import { Component, inject, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EnergiaService, TableroElectrico, ComponenteTablero } from '../../../core/services/energia.service';
import { LucideAngularModule, ChevronLeft, Zap, Shield, Settings, Info, MapPin, Activity, CheckCircle, AlertTriangle, Cpu, Box, LayoutGrid, List, Sparkles } from 'lucide-angular';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
    selector: 'app-tablero-detalle',
    standalone: true,
    imports: [CommonModule, LucideAngularModule, RouterModule, SkeletonLoaderComponent],
    template: `
    <div class="min-h-screen bg-slate-950 p-4 md:p-8 space-y-8">
      <!-- Top Navigation -->
      <div class="flex items-center gap-4 animate-in slide-in-from-left duration-500">
        <button 
          routerLink="/energia" 
          [queryParams]="{ tipo: 'TABLERO' }"
          class="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all border border-transparent hover:border-white/10">
          <lucide-icon [name]="ChevronLeft" [size]="24"></lucide-icon>
        </button>
        <div>
          <h1 class="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            {{ tablero?.nombre || 'Cargando Tablero...' }}
            <span *ngIf="tablero" [ngClass]="getStatusBadgeClass(tablero.estado)" class="text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border">
                {{ tablero.estado }}
            </span>
          </h1>
          <p class="text-slate-400 flex items-center gap-2 mt-1">
            <lucide-icon [name]="MapPin" [size]="14" class="text-blue-500"></lucide-icon>
            {{ tablero?.aeropuerto?.nombre }} - {{ tablero?.ubicacion }}
          </p>
        </div>
      </div>

      <div *ngIf="loading" class="space-y-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <app-skeleton-loader *ngFor="let i of [1,2,3,4]" class="h-32 rounded-3xl"></app-skeleton-loader>
        </div>
        <app-skeleton-loader class="h-96 rounded-[3rem]"></app-skeleton-loader>
      </div>

      <ng-container *ngIf="!loading && tablero">
        <!-- Dashboard Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in zoom-in duration-500 delay-100">
          <div class="bg-slate-900/50 border border-white/5 rounded-3xl p-6 flex flex-col justify-between group hover:border-blue-500/30 transition-all duration-300">
            <div class="flex justify-between items-start">
                <div class="p-3 bg-blue-500/10 rounded-2xl text-blue-400 group-hover:scale-110 transition-transform">
                    <lucide-icon [name]="Cpu" [size]="24"></lucide-icon>
                </div>
            </div>
            <div class="mt-4">
                <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Componentes</p>
                <p class="text-3xl font-black text-white">{{ tablero.componentes?.length || 0 }}</p>
            </div>
          </div>

          <div class="bg-slate-900/50 border border-white/5 rounded-3xl p-6 flex flex-col justify-between group hover:border-emerald-500/30 transition-all duration-300">
            <div class="flex justify-between items-start">
                <div class="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 group-hover:scale-110 transition-transform">
                    <lucide-icon [name]="Zap" [size]="24"></lucide-icon>
                </div>
            </div>
            <div class="mt-4">
                <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Térmicas / Protecciones</p>
                <p class="text-3xl font-black text-white">{{ getCountByType('TERMICA') }}</p>
            </div>
          </div>

          <div class="bg-slate-900/50 border border-white/5 rounded-3xl p-6 flex flex-col justify-between group hover:border-purple-500/30 transition-all duration-300">
            <div class="flex justify-between items-start">
                <div class="p-3 bg-purple-500/10 rounded-2xl text-purple-400 group-hover:scale-110 transition-transform">
                    <lucide-icon [name]="Shield" [size]="24"></lucide-icon>
                </div>
            </div>
            <div class="mt-4">
                <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Disyuntores</p>
                <p class="text-3xl font-black text-white">{{ getCountByType('DISYUNTOR') }}</p>
            </div>
          </div>

          <div class="bg-slate-900/50 border border-white/5 rounded-3xl p-6 flex flex-col justify-between group hover:border-yellow-500/30 transition-all duration-300">
            <div class="flex justify-between items-start">
                <div class="p-3 bg-yellow-500/10 rounded-2xl text-yellow-400 group-hover:scale-110 transition-transform">
                    <lucide-icon [name]="Activity" [size]="24"></lucide-icon>
                </div>
            </div>
            <div class="mt-4">
                <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Protección Sobretensión</p>
                <p class="text-3xl font-black text-white">{{ getCountByType('PROTECCION_SOBRE_TENSION') }}</p>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="bg-slate-900/40 border border-white/10 rounded-[3rem] overflow-hidden backdrop-blur-md animate-in fade-in slide-in-from-bottom-10 duration-700 delay-200">
            <div class="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h3 class="text-xl font-black text-white tracking-tight flex items-center gap-2">
                        <lucide-icon [name]="LayoutGrid" class="text-blue-500" [size]="20"></lucide-icon>
                        Esquema de Distribución
                    </h3>
                    <p class="text-slate-500 text-sm mt-1">Haga clic en un componente para ver detalles técnicos adicionales.</p>
                </div>
                
                <div class="flex items-center gap-2 bg-slate-950/50 p-1.5 rounded-2xl border border-white/5">
                    <button 
                        (click)="viewMode = 'grid'"
                        [class]="viewMode === 'grid' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'"
                        class="p-2.5 rounded-xl transition-all duration-300">
                        <lucide-icon [name]="LayoutGrid" [size]="18"></lucide-icon>
                    </button>
                    <button 
                        (click)="viewMode = 'list'"
                        [class]="viewMode === 'list' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'"
                        class="p-2.5 rounded-xl transition-all duration-300">
                        <lucide-icon [name]="List" [size]="18"></lucide-icon>
                    </button>
                </div>
            </div>

            <div class="p-8">
                <!-- GRID VIEW -->
                <div *ngIf="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    <div *ngFor="let comp of tablero.componentes" 
                        class="group p-6 bg-slate-900 border border-white/5 rounded-[2rem] hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/5 cursor-pointer">
                        <div class="flex justify-between items-start mb-4">
                            <div [ngClass]="getCompIconBgClass(comp.tipo)" class="p-2.5 rounded-2xl">
                                <lucide-icon [name]="getCompIcon(comp.tipo)" [size]="20"></lucide-icon>
                            </div>
                            <span class="text-[10px] font-mono font-black text-slate-500 uppercase tracking-tighter bg-white/5 px-2 py-0.5 rounded">
                                {{ comp.amperaje || 'N/A' }}
                            </span>
                        </div>
                        <h4 class="text-white font-bold group-hover:text-blue-400 transition-colors uppercase truncate" [title]="comp.nombre">
                            {{ comp.nombre }}
                        </h4>
                        <p class="text-slate-500 text-[10px] uppercase font-black tracking-widest mt-1">
                            {{ comp.tipo.replace('_', ' ') }}
                        </p>
                        
                        <div class="mt-4 pt-4 border-t border-white/5 space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div class="flex items-center justify-between text-[10px]">
                                <span class="text-slate-600 font-bold">Marca:</span>
                                <span class="text-slate-400">{{ comp.marca || '---' }}</span>
                            </div>
                            <div class="flex items-center justify-between text-[10px]">
                                <span class="text-slate-600 font-bold">Polos:</span>
                                <span class="text-slate-400">{{ comp.polos || '---' }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- LIST VIEW -->
                <div *ngIf="viewMode === 'list'" class="space-y-4">
                    <div *ngFor="let comp of tablero.componentes" 
                        class="group flex items-center gap-6 p-4 bg-slate-900/50 border border-white/5 rounded-2xl hover:bg-slate-900 transition-all duration-200">
                        <div [ngClass]="getCompIconBgClass(comp.tipo)" class="p-3 rounded-xl shrink-0">
                            <lucide-icon [name]="getCompIcon(comp.tipo)" [size]="20"></lucide-icon>
                        </div>
                        <div class="flex-1">
                            <h4 class="text-white font-bold text-lg leading-none">{{ comp.nombre }}</h4>
                            <p class="text-slate-500 text-xs mt-1 uppercase tracking-widest font-black">{{ comp.tipo.replace('_', ' ') }}</p>
                        </div>
                        <div class="hidden md:block">
                            <p class="text-slate-500 text-[10px] uppercase font-black tracking-widest text-right">Potencia / Polos</p>
                            <p class="text-white font-mono text-sm text-right">{{ comp.amperaje || '---' }} / {{ comp.polos || '---' }}P</p>
                        </div>
                        <div class="hidden md:block border-l border-white/5 pl-6 h-10 flex flex-col justify-center">
                            <p class="text-slate-500 text-[10px] uppercase font-black tracking-widest">Equipamiento</p>
                            <p class="text-white text-sm font-bold">{{ comp.marca }} {{ comp.modelo || '' }}</p>
                        </div>
                        <lucide-icon [name]="Info" [size]="18" class="text-slate-600 group-hover:text-blue-400 transition-colors ml-4"></lucide-icon>
                    </div>
                </div>
            </div>
        </div>

        <!-- Descriptive footer / Summary -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-300">
            <div class="p-8 bg-slate-900/30 border border-white/5 rounded-[2.5rem] space-y-4">
                <h4 class="text-white font-black uppercase tracking-widest text-xs flex items-center gap-2">
                    <lucide-icon [name]="Info" [size]="14" class="text-blue-500"></lucide-icon>
                    Descripción del Tablero
                </h4>
                <p class="text-slate-400 leading-relaxed italic">
                    {{ tablero.descripcion || 'No hay una descripción detallada registrada para este tablero eléctrico central.' }}
                </p>
            </div>
            <div class="p-8 bg-slate-900/30 border border-white/5 rounded-[2.5rem] flex items-center justify-between group">
                <div>
                    <h4 class="text-white font-black uppercase tracking-widest text-xs flex items-center gap-2 mb-2">
                        <lucide-icon [name]="Activity" [size]="14" class="text-yellow-500"></lucide-icon>
                        Historial de Intervenciones
                    </h4>
                    <p class="text-slate-500 text-sm">Última revisión técnica registrada: <span class="text-slate-300 font-bold">{{ tablero.createdAt | date:'dd/MM/yyyy' }}</span></p>
                </div>
                <button class="bg-yellow-500/10 hover:bg-yellow-500 text-yellow-500 hover:text-white p-4 rounded-2xl transition-all duration-300 group-hover:scale-105">
                    <lucide-icon [name]="Sparkles" [size]="20"></lucide-icon>
                </button>
            </div>
        </div>
      </ng-container>
    </div>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableroDetalleComponent implements OnInit {
    private energiaService = inject(EnergiaService);
    private route = inject(ActivatedRoute);
    private cdr = inject(ChangeDetectorRef);

    tablero: TableroElectrico | null = null;
    loading = true;
    viewMode: 'grid' | 'list' = 'grid';

    // Icons
    readonly ChevronLeft = ChevronLeft;
    readonly Zap = Zap;
    readonly Shield = Shield;
    readonly Settings = Settings;
    readonly Info = Info;
    readonly MapPin = MapPin;
    readonly Activity = Activity;
    readonly CheckCircle = CheckCircle;
    readonly AlertTriangle = AlertTriangle;
    readonly Cpu = Cpu;
    readonly Box = Box;
    readonly LayoutGrid = LayoutGrid;
    readonly List = List;
    readonly Sparkles = Sparkles;

    ngOnInit() {
        this.route.params.subscribe(params => {
            const id = +params['id'];
            if (id) {
                this.loadTablero(id);
            }
        });
    }

    loadTablero(id: number) {
        this.loading = true;
        this.energiaService.getTablero(id).subscribe({
            next: (data) => {
                this.tablero = data;
                this.loading = false;
                this.cdr.markForCheck();
            },
            error: (err) => {
                console.error('Error loading tablero details:', err);
                this.loading = false;
                this.cdr.markForCheck();
            }
        });
    }

    getCountByType(tipo: string): number {
        return this.tablero?.componentes?.filter(c => c.tipo === tipo).length || 0;
    }

    getStatusBadgeClass(estado: string) {
        switch (estado) {
            case 'OK': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'NOVEDAD': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
            case 'FUERA_SERVICIO': return 'bg-red-500/10 text-red-400 border-red-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    }

    getCompIcon(tipo: string) {
        switch (tipo) {
            case 'TERMICA': return Zap;
            case 'DISYUNTOR': return Shield;
            case 'PROTECCION_SOBRE_TENSION': return Activity;
            default: return Box;
        }
    }

    getCompIconBgClass(tipo: string) {
        switch (tipo) {
            case 'TERMICA': return 'bg-emerald-500/10 text-emerald-400';
            case 'DISYUNTOR': return 'bg-purple-500/10 text-purple-400';
            case 'PROTECCION_SOBRE_TENSION': return 'bg-yellow-500/10 text-yellow-400';
            default: return 'bg-blue-500/10 text-blue-400';
        }
    }
}
