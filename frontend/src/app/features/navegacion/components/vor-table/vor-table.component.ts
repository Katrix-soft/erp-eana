import { Component, inject, OnInit, signal, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Activity, Calendar, Download, RefreshCw, ChevronLeft, AlertTriangle, CheckCircle, Info, Sparkles } from 'lucide-angular';
import { VorService, VorMeasurement } from '../../../../core/services/vor.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
    selector: 'app-vor-table',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    template: `
<div class="bg-slate-900/40 backdrop-blur-2xl rounded-3xl border border-white/5 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
    <div class="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="flex items-start gap-4">
            <div class="p-4 bg-blue-500/10 text-blue-400 rounded-2xl shadow-inner shadow-blue-500/10">
                <lucide-icon [name]="Activity" [size]="32"></lucide-icon>
            </div>
            <div>
                <h2 class="text-2xl font-black text-white uppercase tracking-tight">VOR - Curva de Error Distribuido</h2>
                <p class="text-slate-400 font-medium mt-1">Mediciones y análisis de propagación</p>
            </div>
        </div>
        
        <button (click)="exportCSV()" 
            class="group flex items-center gap-2 px-6 py-3 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-lg shadow-blue-500/5">
            <lucide-icon [name]="Download" [size]="18" class="group-hover:-translate-y-0.5 transition-transform"></lucide-icon>
            Exportar CSV
        </button>
    </div>

    <div *ngIf="loading()" class="py-40 flex flex-col items-center justify-center">
        <lucide-icon [name]="RefreshCw" class="text-blue-500 animate-spin mb-4" [size]="48"></lucide-icon>
        <p class="text-slate-500 font-black uppercase tracking-widest animate-pulse">Analizando mediciones...</p>
    </div>

    <div *ngIf="!loading()" class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
            <thead>
                <tr class="bg-slate-950/30">
                    <th class="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 border-b border-white/5">Fecha</th>
                    <th class="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 border-b border-white/5">Equipo / VOR</th>
                    <th class="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 border-b border-white/5">Azimut</th>
                    <th class="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 border-b border-white/5">Error Medido</th>
                    <th class="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 border-b border-white/5">Técnico</th>
                    <th class="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 border-b border-white/5 text-right">Acciones</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
                <tr *ngFor="let m of measurements()" class="hover:bg-white/[0.02] transition-colors group">
                    <td class="px-8 py-5">
                        <span class="text-sm font-bold text-slate-300">{{ m.fecha | date:'yyyy-MM-dd' }}</span>
                    </td>
                    <td class="px-8 py-5">
                        <span class="text-sm font-black text-white tracking-tight uppercase group-hover:text-blue-400 transition-colors">{{ m.equipoVor }}</span>
                    </td>
                    <td class="px-8 py-5">
                        <span class="text-sm font-medium text-slate-400 font-mono bg-slate-950/40 px-2 py-1 rounded-lg border border-white/5">{{ m.azimut }}°</span>
                    </td>
                    <td class="px-8 py-5">
                        <span class="text-sm font-black flex items-center gap-2" 
                            [ngClass]="m.errorMedido > 2 ? 'text-red-500' : (m.errorMedido > 1 ? 'text-amber-400' : 'text-emerald-400')">
                            {{ m.errorMedido > 0 ? '+' : '' }}{{ m.errorMedido }}°
                        </span>
                    </td>
                    <td class="px-8 py-5">
                        <span class="text-sm font-medium text-slate-400">{{ m.tecnico }}</span>
                    </td>
                    <td class="px-8 py-5 text-right">
                        <button (click)="openChart(m)" 
                            class="text-xs font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-all hover:scale-105 active:scale-95">
                            Ver Gráfico
                        </button>
                    </td>
                </tr>
            </tbody>
        </table>
        
        <div *ngIf="measurements().length === 0" class="py-20 text-center">
            <lucide-icon [name]="Activity" [size]="48" class="text-slate-800 mx-auto mb-4 opacity-10"></lucide-icon>
            <p class="text-slate-600 font-black uppercase tracking-widest italic">No se encontraron mediciones registradas</p>
        </div>
        
        <div class="px-8 py-4 bg-slate-950/20 text-center border-t border-white/5">
            <p class="text-[10px] font-black text-slate-700 uppercase tracking-[0.5em]">Datos sincronizados en tiempo real · CNS/EANA Navigation System</p>
        </div>
    </div>
</div>

<!-- Modal -->
<div *ngIf="showChartModal()" 
    class="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 animate-in fade-in zoom-in duration-300">
    <div (click)="closeModal()" class="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"></div>
    
    <div class="relative w-full max-w-6xl bg-slate-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        <div class="p-6 md:p-8 flex items-center justify-between border-b border-white/5">
            <div>
                <h3 class="text-2xl font-black text-white tracking-tight uppercase">Curva de Error VOR</h3>
                <p class="text-slate-400 text-sm font-medium uppercase tracking-widest">Distribución espacial del error medido</p>
            </div>
            <button (click)="closeModal()" class="p-3 hover:bg-white/5 rounded-2xl transition-colors text-slate-400 group">
                <lucide-icon [name]="ChevronLeft" [size]="24" class="rotate-180 group-hover:translate-x-0.5 transition-transform"></lucide-icon>
            </button>
        </div>
        
        <div class="flex-1 p-6 md:p-8 overflow-y-auto">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div class="lg:col-span-2 space-y-6">
                    <div class="bg-slate-950/40 p-6 rounded-3xl border border-white/5">
                         <div class="h-[400px] w-full">
                            <canvas #chartCanvas></canvas>
                         </div>
                    </div>
                </div>

                <div class="flex flex-col gap-6">
                    <div class="bg-blue-600/10 p-6 rounded-3xl border border-blue-500/20 relative overflow-hidden group h-full flex flex-col">
                        <div class="absolute -right-4 -top-4 opacity-10">
                             <lucide-icon [name]="Sparkles" [size]="120" class="text-blue-400"></lucide-icon>
                        </div>
                        
                        <div class="relative z-10 flex flex-col h-full">
                            <div class="flex items-center gap-3 mb-6">
                                <div class="p-2.5 bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20">
                                    <lucide-icon [name]="Sparkles" [size]="20"></lucide-icon>
                                </div>
                                <h4 class="text-lg font-black text-white uppercase tracking-tight">Análisis Predictivo IA</h4>
                            </div>

                            <div *ngIf="analyzing()" class="flex-1 flex flex-col items-center justify-center py-10">
                                <lucide-icon [name]="RefreshCw" class="text-blue-400 animate-spin mb-4" [size]="32"></lucide-icon>
                                <p class="text-xs font-black text-blue-300 uppercase tracking-[0.2em] animate-pulse text-center">Consultando Gemini...</p>
                            </div>

                            <div *ngIf="!analyzing() && aiAnalysis()" class="flex-1 overflow-y-auto pr-2">
                                <div class="prose prose-invert prose-sm max-w-none text-blue-100/80 font-medium leading-relaxed whitespace-pre-wrap">
                                    {{ aiAnalysis() }}
                                </div>
                            </div>

                            <div class="mt-6 pt-4 border-t border-blue-500/20 flex items-start gap-3">
                                <lucide-icon [name]="Info" [size]="16" class="text-blue-400 shrink-0"></lucide-icon>
                                <p class="text-[9px] font-bold text-blue-400/60 uppercase leading-normal">
                                    Nota: Este análisis es generado por IA para APOYO TÉCNICO. La decisión final corresponde siempre al criterio del inspector CNS.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="p-6 bg-slate-950/40 border-t border-white/5 flex justify-end">
            <button (click)="closeModal()" 
                class="px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all">
                Cerrar Visualización
            </button>
        </div>
    </div>
</div>
`,
    styles: [`
        :host { display: block; }
        tbody tr { animation: slideUpRow 0.3s ease-out forwards; opacity: 0; }
        @keyframes slideUpRow { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    `]
})
export class VorTableComponent implements OnInit {
    private vorService = inject(VorService);
    private cdr = inject(ChangeDetectorRef);

    measurements = signal<VorMeasurement[]>([]);
    loading = signal(true);
    showChartModal = signal(false);
    aiAnalysis = signal<string | null>(null);
    analyzing = signal(false);

    @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
    chart: Chart | null = null;

    readonly Activity = Activity;
    readonly Download = Download;
    readonly RefreshCw = RefreshCw;
    readonly ChevronLeft = ChevronLeft;
    readonly Sparkles = Sparkles;
    readonly Info = Info;

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.loading.set(true);
        this.vorService.getMeasurements().subscribe({
            next: (data) => {
                this.measurements.set(data);
                this.loading.set(false);
                this.cdr.detectChanges();
            },
            error: () => {
                this.loading.set(false);
                this.cdr.detectChanges();
            }
        });
    }

    exportCSV() {
        if (this.measurements().length === 0) return;

        const rows = this.measurements().map(m => ({
            Fecha: m.fecha.split('T')[0],
            Equipo: m.equipoVor,
            Azimut: m.azimut + '°',
            Error: m.errorMedido + '°',
        }));

        const header = Object.keys(rows[0]).join(',');
        const csvContent = rows.map(row => Object.values(row).join(',')).join('\n');
        const blob = new Blob([header + '\n' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'analisis_vor.csv');
        link.click();
    }

    openChart(measurement: VorMeasurement) {
        this.showChartModal.set(true);
        this.aiAnalysis.set(null);
        setTimeout(() => {
            this.renderChart(measurement);
            this.runAIAnalysis(measurement);
        }, 100);
    }

    runAIAnalysis(measurement: VorMeasurement) {
        this.analyzing.set(true);
        const dayData = this.measurements().filter(m =>
            m.fecha.split('T')[0] === measurement.fecha.split('T')[0] &&
            m.equipoVor === measurement.equipoVor
        ).sort((a, b) => a.azimut - b.azimut);

        this.vorService.analyzeMeasurements(dayData).subscribe({
            next: (analysis) => {
                this.aiAnalysis.set(analysis);
                this.analyzing.set(false);
                this.cdr.detectChanges();
            },
            error: () => {
                this.aiAnalysis.set('No se pudo obtener el análisis de IA.');
                this.analyzing.set(false);
                this.cdr.detectChanges();
            }
        });
    }

    closeModal() {
        this.showChartModal.set(false);
        this.aiAnalysis.set(null);
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }

    renderChart(measurement: VorMeasurement) {
        if (!this.chartCanvas) return;
        const ctx = this.chartCanvas.nativeElement.getContext('2d');
        if (!ctx) return;

        if (this.chart) this.chart.destroy();

        const dayData = this.measurements().filter(m =>
            m.fecha.split('T')[0] === measurement.fecha.split('T')[0] &&
            m.equipoVor === measurement.equipoVor
        ).sort((a, b) => a.azimut - b.azimut);

        const labels = dayData.map(m => m.azimut + '°');
        const values = dayData.map(m => m.errorMedido);

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Error (°)',
                    data: values,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 6,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                },
                scales: {
                    y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
                    x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } }
                }
            }
        });
    }
}
