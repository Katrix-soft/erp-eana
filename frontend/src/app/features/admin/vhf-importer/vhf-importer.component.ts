import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule, Upload, FileSpreadsheet, CheckCircle, XCircle, Loader2 } from 'lucide-angular';
import { ToastService } from '../../../core/services/toast.service';
import * as XLSX from 'xlsx';

interface ImportProgress {
    total: number;
    current: number;
    status: 'idle' | 'processing' | 'success' | 'error';
    message: string;
}

@Component({
    selector: 'app-vhf-importer',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    template: `
        <div class="px-4 py-8 lg:px-8 bg-slate-950 min-h-screen">
            <!-- Premium Header -->
            <div class="glass-card rounded-[2.5rem] p-8 mb-10 border border-white/5 shadow-2xl animate-slide-up relative overflow-hidden">
                <div class="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px]"></div>
                
                <div class="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
                    <div class="space-y-2">
                        <h1 class="text-3xl md:text-5xl font-black text-white tracking-tight flex items-center gap-4">
                            <div class="w-2 h-12 bg-gradient-to-b from-blue-500 to-blue-700 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)]"></div>
                            Importador VHF
                        </h1>
                        <p class="text-slate-400 text-sm md:text-base font-medium pl-6 border-l border-slate-800/50">
                            Carga masiva de equipamiento aeronáutico mediante Excel.
                        </p>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- Dropzone Section -->
                <div class="lg:col-span-2 space-y-8">
                    <div class="glass-card rounded-[2.5rem] p-10 border border-white/5 shadow-2xl animate-slide-up" style="animation-delay: 0.1s">
                        <div class="flex flex-col items-center text-center space-y-6">
                            <div class="w-24 h-24 bg-blue-600/10 rounded-3xl flex items-center justify-center border border-blue-500/20 shadow-inner group transition-all">
                                <lucide-icon [name]="FileSpreadsheet" [size]="48" class="text-blue-500 group-hover:scale-110 transition-transform"></lucide-icon>
                            </div>
                            
                            <div class="space-y-2">
                                <h2 class="text-2xl font-black text-white uppercase tracking-wider">Cargar Documento</h2>
                                <p class="text-slate-500 text-sm">Arrastre su archivo .xlsx o seleccione desde su equipo</p>
                            </div>

                            <div class="w-full max-w-md">
                                <div class="relative group cursor-pointer">
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls"
                                        (change)="handleFileChange($event)"
                                        class="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                                    />
                                    <div class="border-2 border-dashed border-slate-800 group-hover:border-blue-500/50 rounded-2xl py-12 transition-all bg-slate-900/40 group-hover:bg-blue-600/5">
                                        <lucide-icon [name]="Upload" [size]="32" class="mx-auto text-slate-700 group-hover:text-blue-400 mb-4 transition-colors"></lucide-icon>
                                        <p class="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                                            {{ file ? file.name : 'Click para examinar' }}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button
                                *ngIf="file"
                                (click)="processExcel()"
                                [disabled]="progress.status === 'processing'"
                                class="w-full max-w-xs bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-900/40 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                <lucide-icon *ngIf="progress.status === 'processing'" [name]="Loader2" [size]="20" class="animate-spin"></lucide-icon>
                                <lucide-icon *ngIf="progress.status !== 'processing'" [name]="Upload" [size]="20" class="group-hover:translate-y-[-2px] transition-transform"></lucide-icon>
                                <span class="font-black uppercase tracking-[0.2em] text-xs">
                                    {{ progress.status === 'processing' ? 'Procesando API' : 'Iniciar Importación' }}
                                </span>
                            </button>
                        </div>
                    </div>

                    <!-- Status Display -->
                    <div *ngIf="progress.status !== 'idle'" class="glass-card rounded-[2.5rem] p-8 border border-white/5 animate-slide-up" style="animation-delay: 0.2s">
                        <div class="flex flex-col gap-6">
                            <div class="flex justify-between items-center">
                                <div class="flex items-center gap-3">
                                    <div class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                    <span class="text-sm font-black text-white uppercase tracking-widest">{{ progress.message }}</span>
                                </div>
                                <span *ngIf="progress.status === 'processing'" class="text-[10px] font-black font-mono text-slate-500">
                                    {{ progress.current }} / {{ progress.total }} REGISTROS
                                </span>
                            </div>

                            <div *ngIf="progress.status === 'processing' && progress.total > 0" class="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-white/5 lg:w-4/5 xl:w-2/3">
                                <div
                                    class="bg-gradient-to-r from-blue-700 to-blue-400 h-full transition-all duration-300 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                                    [style.width.%]="(progress.current / progress.total) * 100"
                                ></div>
                            </div>

                            <div *ngIf="progress.status === 'success'" class="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-4 text-emerald-400">
                                <lucide-icon [name]="CheckCircle" [size]="24"></lucide-icon>
                                <div>
                                    <p class="font-black uppercase tracking-widest text-xs">Transacción Completa</p>
                                    <p class="text-[11px] text-emerald-400/70">{{ progress.message }}</p>
                                </div>
                            </div>

                            <div *ngIf="progress.status === 'error'" class="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-4 text-red-500">
                                <lucide-icon [name]="XCircle" [size]="24"></lucide-icon>
                                <div>
                                    <p class="font-black uppercase tracking-widest text-xs">Fallo en la Sincronización</p>
                                    <p class="text-[11px] text-red-500/70">{{ progress.message }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Info Section -->
                <div class="space-y-8 animate-slide-up" style="animation-delay: 0.3s">
                    <div class="glass-card rounded-[2.5rem] p-8 border border-white/5 h-full">
                        <h3 class="text-xs font-black text-blue-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                             <div class="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                             Requisitos Técnicos
                        </h3>
                        
                        <div class="space-y-6">
                            <div class="flex gap-4">
                                <div class="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                                    <span class="text-[10px] font-black text-slate-500">01</span>
                                </div>
                                <p class="text-slate-400 text-xs leading-relaxed font-medium">Formato compatible: <span class="text-white">Excel Standard (.xlsx, .xls)</span></p>
                            </div>
                            
                            <div class="flex gap-4">
                                <div class="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                                    <span class="text-[10px] font-black text-slate-500">02</span>
                                </div>
                                <div class="space-y-2">
                                    <p class="text-slate-400 text-xs font-medium">Columnas Mandatarias:</p>
                                    <div class="flex flex-wrap gap-1.5">
                                        <span class="bg-slate-900 border border-white/5 rounded-md px-2 py-1 text-[9px] text-slate-500 font-bold">FIR</span>
                                        <span class="bg-slate-900 border border-white/5 rounded-md px-2 py-1 text-[9px] text-slate-500 font-bold">Sitio</span>
                                        <span class="bg-slate-900 border border-white/5 rounded-md px-2 py-1 text-[9px] text-slate-500 font-bold">Marca</span>
                                        <span class="bg-slate-900 border border-white/5 rounded-md px-2 py-1 text-[9px] text-slate-500 font-bold">Modelo</span>
                                        <span class="bg-slate-900 border border-white/5 rounded-md px-2 py-1 text-[9px] text-slate-500 font-bold">Canal</span>
                                    </div>
                                </div>
                            </div>

                            <div class="flex gap-4">
                                <div class="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                                    <span class="text-[10px] font-black text-slate-500">03</span>
                                </div>
                                <p class="text-slate-400 text-xs leading-relaxed font-medium">Automatización: El sistema creará automáticamente <span class="text-blue-400">Sitios, Equipos, Canales y Frecuencias</span> asociados.</p>
                            </div>
                        </div>

                        <div class="mt-10 p-4 border border-blue-500/20 bg-blue-500/5 rounded-2xl">
                             <p class="text-[10px] text-blue-400 font-bold uppercase tracking-[0.2em]">Nota de Seguridad</p>
                             <p class="text-slate-500 text-[10px] leading-relaxed mt-2">Los números de serie duplicados serán omitidos o actualizados según la lógica de integridad de la base de datos.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
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
export class VhfImporterComponent {
    readonly Upload = Upload;
    readonly FileSpreadsheet = FileSpreadsheet;
    readonly CheckCircle = CheckCircle;
    readonly XCircle = XCircle;
    readonly Loader2 = Loader2;

    file: File | null = null;
    progress: ImportProgress = {
        total: 0,
        current: 0,
        status: 'idle',
        message: ''
    };

    constructor(
        private http: HttpClient,
        private toastService: ToastService
    ) { }

    handleFileChange(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            this.file = input.files[0];
            this.progress = { total: 0, current: 0, status: 'idle', message: '' };
        }
    }

    async processExcel() {
        if (!this.file) {
            this.toastService.warning('Por favor selecciona un archivo');
            return;
        }

        this.progress = { total: 0, current: 0, status: 'processing', message: 'Leyendo archivo...' };

        try {
            const data = await this.file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

            this.progress = { ...this.progress, total: jsonData.length, message: 'Procesando datos...' };

            // Agrupar por sitio
            const sitesMap = new Map<string, any>();

            for (let i = 0; i < jsonData.length; i++) {
                const row = jsonData[i];
                const siteKey = `${row['FIR']}-${row['Sitio']}`;

                if (!sitesMap.has(siteKey)) {
                    sitesMap.set(siteKey, {
                        fir: row['FIR'],
                        aeropuerto: row['Desginador 3 Letras'] || row['FIR'],
                        sitio: row['Sitio'],
                        equipos: []
                    });
                }

                const site = sitesMap.get(siteKey);
                site.equipos.push({
                    tipoEquipo: row['EAVA/TWR'] || 'TWR',
                    marca: row['Marca'] || 'Sin Marca',
                    modelo: row['Modelo'] || 'Sin Modelo',
                    numeroSerie: row['Nro de Serie'] || `S/N-${i}`,
                    tecnologia: row['Tecnologia'] || null,
                    activoFijo: row['Activo Fijo'] || null,
                    canal: row['Canal'] || 'N/A',
                    tipo: row['Tipo'] || 'Main',
                    frecuencia: parseFloat(String(row['Frecuencia [MHz]'] || '0').replace(',', '.'))
                });

                this.progress = { ...this.progress, current: i + 1 };
            }

            // Enviar datos al backend
            this.progress = { ...this.progress, message: 'Enviando datos al servidor...' };

            const sites = Array.from(sitesMap.values());
            let successCount = 0;
            let errorCount = 0;

            for (const site of sites) {
                try {
                    // 1. Crear o buscar VHF (sitio)
                    let vhfId: number;
                    try {
                        const vhfResponse = await this.http.post<any>('/api/v1/vhf', {
                            fir: site.fir,
                            aeropuerto: site.aeropuerto,
                            sitio: site.sitio
                        }).toPromise();
                        vhfId = vhfResponse.id;
                    } catch {
                        // Si falla, intentar buscar existente
                        const existing = await this.http.get<any[]>(`/api/v1/vhf?fir=${site.fir}&sitio=${site.sitio}`).toPromise();
                        if (existing && existing.length > 0) {
                            vhfId = existing[0].id;
                        } else {
                            continue;
                        }
                    }

                    // 2. Crear equipos
                    for (const eq of site.equipos) {
                        try {
                            const equipoResponse = await this.http.post<any>('/api/v1/vhf-equipos', {
                                vhfId,
                                tipoEquipo: eq.tipoEquipo,
                                marca: eq.marca,
                                modelo: eq.modelo,
                                numeroSerie: eq.numeroSerie,
                                tecnologia: eq.tecnologia,
                                activoFijo: eq.activoFijo
                            }).toPromise();

                            const equipoId = equipoResponse.id;

                            // 3. Crear canal
                            const canalResponse = await this.http.post<any>('/api/v1/canales', {
                                equipoVhfId: equipoId,
                                canal: eq.canal,
                                tipo: eq.tipo
                            }).toPromise();

                            const canalId = canalResponse.id;

                            // 4. Crear frecuencia
                            if (eq.frecuencia > 0) {
                                await this.http.post('/api/v1/frecuencias', {
                                    frecuencia: eq.frecuencia,
                                    canalId,
                                    equipoVhfId: equipoId
                                }).toPromise();
                            }

                            successCount++;
                        } catch (error) {
                            console.error('Error creando equipo:', error);
                            errorCount++;
                        }
                    }
                } catch (error) {
                    console.error('Error creando sitio:', error);
                    errorCount++;
                }
            }

            this.progress = {
                total: jsonData.length,
                current: jsonData.length,
                status: 'success',
                message: `Importación completada: ${successCount} exitosos, ${errorCount} errores`
            };

        } catch (error) {
            console.error('Error procesando archivo:', error);
            this.progress = {
                total: 0,
                current: 0,
                status: 'error',
                message: 'Error al procesar el archivo'
            };
        }
    }
}
