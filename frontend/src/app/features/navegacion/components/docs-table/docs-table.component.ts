import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, FileText, Download, Eye, Clock } from 'lucide-angular';
import { NavegacionService, DocData } from '../../../../core/services/navegacion.service';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-docs-table',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    template: `
    <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl animate-in fade-in duration-500">
        <div class="p-6 border-b border-slate-800 bg-slate-900/50">
            <h3 class="text-lg font-bold text-white flex items-center gap-2">
                <lucide-icon [name]="FileText" class="text-blue-400"></lucide-icon>
                Gestión Documental
            </h3>
            <p class="text-sm text-slate-400">Manuales, procedimientos y reportes técnicos</p>
        </div>
        
        <div class="overflow-x-auto">
            <table class="w-full text-left text-sm text-slate-400">
                <thead class="bg-slate-950/50 text-xs uppercase font-bold text-slate-500">
                    <tr>
                        <th class="px-6 py-4">Documento</th>
                        <th class="px-6 py-4">Tipo</th>
                        <th class="px-6 py-4">Fecha Actualización</th>
                        <th class="px-6 py-4">Tamaño</th>
                        <th class="px-6 py-4 text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-800">
                    <tr *ngFor="let item of data$ | async" class="hover:bg-slate-800/30 transition-colors">
                        <td class="px-6 py-4">
                            <div class="flex items-center gap-3">
                                <div class="p-2 bg-slate-800 rounded-lg text-slate-400">
                                    <lucide-icon [name]="FileText" [size]="18"></lucide-icon>
                                </div>
                                <span class="font-medium text-white">{{ item.nombre }}</span>
                            </div>
                        </td>
                        <td class="px-6 py-4">
                            <span class="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs font-bold uppercase">{{ item.tipo }}</span>
                        </td>
                        <td class="px-6 py-4 flex items-center gap-2">
                             <lucide-icon [name]="Clock" [size]="14"></lucide-icon>
                             {{ item.fecha }}
                        </td>
                        <td class="px-6 py-4 font-mono">{{ item.size }}</td>
                        <td class="px-6 py-4 text-right">
                            <div class="flex items-center justify-end gap-2">
                                <button class="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                                    <lucide-icon [name]="Eye" [size]="18"></lucide-icon>
                                </button>
                                <button class="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-400 transition-colors">
                                    <lucide-icon [name]="Download" [size]="18"></lucide-icon>
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
  `
})
export class DocsTableComponent {
    private navService = inject(NavegacionService);

    readonly FileText = FileText;
    readonly Download = Download;
    readonly Eye = Eye;
    readonly Clock = Clock;

    data$: Observable<DocData[]> = this.navService.getDocs();
}
