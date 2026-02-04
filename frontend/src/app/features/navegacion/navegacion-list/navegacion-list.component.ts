import { Component, inject, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EquipmentService } from '../../../core/services/equipment.service';
import { AuthService } from '../../../core/services/auth.service';
import { take } from 'rxjs';
import { NavPanelComponent } from '../components/nav-panel/nav-panel.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { VorTableComponent } from '../components/vor-table/vor-table.component';
import { DocsTableComponent } from '../components/docs-table/docs-table.component';
import { HistoryTableComponent } from '../components/history-table/history-table.component';
import { LucideAngularModule, Signal, FileText, CheckSquare, Activity, History, ArrowLeft } from 'lucide-angular';

type NavView = 'MENU' | 'CHECKLIST' | 'VOR' | 'DOCS' | 'HISTORY';

@Component({
    selector: 'app-navegacion-list',
    standalone: true,
    imports: [
        CommonModule,
        NavPanelComponent,
        SkeletonLoaderComponent,
        LucideAngularModule,
        VorTableComponent,
        DocsTableComponent,
        HistoryTableComponent
    ],
    template: `
    <div class="min-h-screen bg-slate-950 p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 transition-colors duration-500 overflow-x-hidden">
        
        <!-- Header -->
        <div class="flex items-center justify-between animate-in slide-in-from-top duration-500 mb-4 md:mb-0">
            <div class="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
                <button *ngIf="currentView !== 'MENU'" (click)="setView('MENU')" 
                    class="p-2 md:p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors flex-shrink-0">
                    <lucide-icon [name]="ArrowLeft" [size]="20"></lucide-icon>
                </button>
                
                <div class="min-w-0 flex-1">
                   <h1 class="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white tracking-tight drop-shadow-md truncate">
                       {{ getTitle() }}
                   </h1>
                   <p *ngIf="currentView === 'MENU'" class="text-sky-50/70 text-xs sm:text-sm md:text-base font-medium drop-shadow-sm truncate">Seleccione una tarea para comenzar</p>
                </div>
            </div>
        </div>

        <!-- MAIN MENU VIEW -->
        <div *ngIf="currentView === 'MENU'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6 pt-2 md:pt-4 lg:pt-8 animate-in fade-in zoom-in duration-500 pb-6 md:pb-10">
             
             <!-- Checklist Card -->
             <button (click)="setView('CHECKLIST')" 
                class="group relative h-36 sm:h-40 md:h-44 lg:h-48 bg-gradient-to-r from-[#594bf3] to-[#7f71fc] rounded-xl md:rounded-2xl lg:rounded-3xl shadow-lg hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all border border-white/10 overflow-hidden text-left p-4 sm:p-5 md:p-6">
                 <div class="absolute right-0 top-0 p-3 sm:p-4 md:p-6 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                     <lucide-icon [name]="CheckSquare" [size]="60"></lucide-icon>
                 </div>
                 <div class="relative z-10 h-full flex flex-col justify-between">
                     <h2 class="text-lg sm:text-xl md:text-2xl font-bold text-white leading-tight">Checklist<br> Radioayudas</h2>
                     <p class="text-indigo-200 text-[10px] sm:text-xs md:text-sm font-medium">(ILS / VOR / DME / NDB)</p>
                 </div>
             </button>

             <!-- Docs Card -->
             <button (click)="setView('DOCS')" 
                class="group relative h-36 sm:h-40 md:h-44 lg:h-48 bg-gradient-to-r from-[#0d6efd] to-[#0a58ca] rounded-xl md:rounded-2xl lg:rounded-3xl shadow-lg hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all border border-white/10 overflow-hidden text-left p-4 sm:p-5 md:p-6">
                 <div class="absolute right-0 top-0 p-3 sm:p-4 md:p-6 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                     <lucide-icon [name]="FileText" [size]="60"></lucide-icon>
                 </div>
                 <div class="relative z-10 h-full flex flex-col justify-center">
                     <h2 class="text-lg sm:text-xl md:text-2xl font-bold text-white leading-tight">Gestión<br> Documental</h2>
                 </div>
             </button>

             <!-- History Card -->
             <button (click)="setView('HISTORY')" 
                class="group relative h-36 sm:h-40 md:h-44 lg:h-48 bg-[#191c24] rounded-xl md:rounded-2xl lg:rounded-3xl shadow-lg hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all border border-white/10 overflow-hidden text-left p-4 sm:p-5 md:p-6">
                 <div class="absolute right-0 top-0 p-3 sm:p-4 md:p-6 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                     <lucide-icon [name]="History" [size]="60"></lucide-icon>
                 </div>
                 <div class="relative z-10 h-full flex flex-col justify-center">
                     <h2 class="text-lg sm:text-xl md:text-2xl font-bold text-white leading-tight">Historial<br> Digital</h2>
                     <p class="text-slate-300 font-medium text-[9px] sm:text-[10px] mt-1 bg-black/20 w-fit px-2 py-0.5 sm:py-1 rounded">Beta</p>
                 </div>
             </button>

             <!-- VOR Error Card -->
             <button (click)="setView('VOR')" 
                class="group relative h-36 sm:h-40 md:h-44 lg:h-48 bg-gradient-to-r from-[#a05ce8] to-[#8d3ce3] rounded-xl md:rounded-2xl lg:rounded-3xl shadow-lg hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all border border-white/10 overflow-hidden text-left p-4 sm:p-5 md:p-6">
                 <div class="absolute right-0 top-0 p-3 sm:p-4 md:p-6 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                     <lucide-icon [name]="Activity" [size]="60"></lucide-icon>
                 </div>
                 <div class="relative z-10 h-full flex flex-col justify-center">
                     <h2 class="text-lg sm:text-xl md:text-2xl font-bold text-white leading-tight">VOR - Curva<br> de Error</h2>
                     <p class="text-violet-200 text-[10px] sm:text-xs md:text-sm font-medium">Distribuido</p>
                 </div>
             </button>

        </div>

        <!-- Illustrations (Tower) - Decorative -->



        <!-- SUB VIEWS -->
        <div *ngIf="currentView !== 'MENU'" class="relative flex-1 pb-10">
            
            <!-- CHECKLISTS / EQUIPOS VIEW -->
            <div *ngIf="currentView === 'CHECKLIST'">
                <!-- Loading State -->
                <div *ngIf="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                     <app-skeleton-loader *ngFor="let i of [1,2,3,4]" class="h-48 rounded-xl"></app-skeleton-loader>
                </div>
                <!-- Content -->
                <div *ngIf="!loading">
                    <app-nav-panel [equipments]="data"></app-nav-panel>
                    <div *ngIf="data.length === 0" class="flex flex-col items-center justify-center py-20 text-slate-500">
                        <lucide-icon [name]="Signal" [size]="48" class="mb-4 opacity-20"></lucide-icon>
                        <p class="text-lg font-medium">No se encontraron equipos de navegación.</p>
                    </div>
                </div>
            </div>

            <!-- DOCS VIEW -->
            <app-docs-table *ngIf="currentView === 'DOCS'"></app-docs-table>

            <!-- VOR VIEW -->
            <app-vor-table *ngIf="currentView === 'VOR'"></app-vor-table>

            <!-- HISTORY VIEW -->
            <app-history-table *ngIf="currentView === 'HISTORY'"></app-history-table>

        </div>

    </div>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavegacionListComponent implements OnInit {
    private equipmentService = inject(EquipmentService);
    private authService = inject(AuthService);
    private cdr = inject(ChangeDetectorRef);

    data: any[] = [];
    loading = true;
    currentView: NavView = 'MENU';

    readonly Signal = Signal;
    readonly FileText = FileText;
    readonly CheckSquare = CheckSquare;
    readonly Activity = Activity;
    readonly History = History;
    readonly ArrowLeft = ArrowLeft;

    ngOnInit() {
        this.loadData();
    }

    setView(view: NavView) {
        this.currentView = view;
        this.cdr.markForCheck();
    }

    getTitle(): string {
        switch (this.currentView) {
            case 'MENU': return 'Tareas Navegación';
            case 'CHECKLIST': return 'Radioayudas';
            case 'DOCS': return 'Documentación';
            case 'VOR': return 'Análisis VOR';
            case 'HISTORY': return 'Historial';
            default: return 'Navegación';
        }
    }

    loadData() {
        this.loading = true;

        this.authService.user$.pipe(take(1)).subscribe(user => {
            const filters: any = { sector: 'NAVEGACION' };

            if (user?.role !== 'ADMIN') {
                if (user?.context?.aeropuertoCodigo) {
                    filters.aeropuerto = user.context.aeropuertoCodigo;
                } else if (user?.context?.fir) {
                    filters.fir = user.context.fir;
                }
            }

            this.equipmentService.getUnifiedEquipments(filters).subscribe({
                next: (data) => {
                    console.log('📡 Navigation Data (Filtered):', data);
                    this.data = data;
                    this.loading = false;
                    this.cdr.markForCheck();
                },
                error: (err) => {
                    console.error('Error loading navigation:', err);
                    this.loading = false;
                    this.cdr.markForCheck();
                }
            });
        });
    }
}
