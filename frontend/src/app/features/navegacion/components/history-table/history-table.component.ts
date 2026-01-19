import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, History, AlertTriangle, CheckCircle, User } from 'lucide-angular';
import { NavegacionService, HistoryData } from '../../../../core/services/navegacion.service';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-history-table',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    template: `
    <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl animate-in fade-in duration-500">
        <div class="p-6 border-b border-slate-800 bg-slate-900/50">
            <h3 class="text-lg font-bold text-white flex items-center gap-2">
                <lucide-icon [name]="History" class="text-blue-400"></lucide-icon>
                Historial Digital
            </h3>
            <p class="text-sm text-slate-400">Registro de eventos y novedades (Modo Lectura)</p>
        </div>
        
        <div class="overflow-x-auto">
            <table class="w-full text-left text-sm text-slate-400">
                <thead class="bg-slate-950/50 text-xs uppercase font-bold text-slate-500">
                    <tr>
                        <th class="px-6 py-4">Evento</th>
                        <th class="px-6 py-4">Descripción</th>
                        <th class="px-6 py-4">Responsable</th>
                        <th class="px-6 py-4">Fecha</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-800">
                    <tr *ngFor="let item of data$ | async" class="hover:bg-slate-800/30 transition-colors">
                        <td class="px-6 py-4">
                            <span class="flex items-center gap-2 font-bold" [ngClass]="item.type === 'ALERT' ? 'text-amber-400' : 'text-emerald-400'">
                                <lucide-icon [name]="item.type === 'ALERT' ? AlertTriangle : CheckCircle" [size]="16"></lucide-icon>
                                {{ item.evento }}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-slate-300">{{ item.descripcion }}</td>
                        <td class="px-6 py-4 flex items-center gap-2">
                            <lucide-icon [name]="User" [size]="14"></lucide-icon>
                            {{ item.responsable }}
                        </td>
                        <td class="px-6 py-4 font-mono text-xs">{{ item.fecha }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div class="p-4 bg-amber-500/10 border-t border-amber-500/20 text-center text-xs font-bold text-amber-500">
            ⚠️ Módulo en fase de prueba - No utilizar como registro oficial
        </div>
    </div>
  `
})
export class HistoryTableComponent {
    private navService = inject(NavegacionService);

    readonly History = History;
    readonly AlertTriangle = AlertTriangle;
    readonly CheckCircle = CheckCircle;
    readonly User = User;

    data$: Observable<HistoryData[]> = this.navService.getHistory();
}
