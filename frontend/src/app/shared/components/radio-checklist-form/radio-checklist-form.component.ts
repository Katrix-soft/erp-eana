import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import { inject } from '@angular/core';

@Component({
    selector: 'app-radio-checklist-form',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="w-full max-w-4xl mx-auto">
            <div class="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
                <h2 class="text-xl font-bold text-slate-800 mb-6 border-b pb-4">
                    Checklist Técnico - {{ radioName }}
                </h2>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <!-- Toggle Al Aire / Reserva -->
                    <div class="flex items-center justify-between md:col-span-1 p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <div class="flex items-center gap-4">
                            <span class="text-sm font-bold" [ngClass]="isChecked ? 'text-blue-600' : 'text-slate-400'">Al Aire</span>
                            <div class="relative inline-block w-14 align-middle select-none">
                                <input
                                    type="checkbox"
                                    [id]="'toggle-' + radioId"
                                    [(ngModel)]="isChecked"
                                    class="absolute block w-7 h-7 rounded-full bg-white border-4 appearance-none cursor-pointer duration-300 ease-in-out top-0 transition-all"
                                    [ngClass]="isChecked ? 'right-0 border-blue-600' : 'left-0 border-gray-300'"
                                />
                                <label
                                    [for]="'toggle-' + radioId"
                                    class="block overflow-hidden h-7 rounded-full cursor-pointer transition-colors duration-300"
                                    [ngClass]="isChecked ? 'bg-blue-600' : 'bg-gray-300'">
                                </label>
                            </div>
                            <span class="text-sm font-bold" [ngClass]="!isChecked ? 'text-blue-600' : 'text-slate-400'">Reserva</span>
                        </div>
                    </div>

                    <!-- Estado Operativo -->
                    <div class="flex flex-col gap-2 md:col-span-1">
                        <label class="text-xs font-bold text-blue-900 uppercase tracking-wider">Estado Operativo</label>
                        <select [(ngModel)]="formData.estadoOperativo" class="w-full p-3 text-sm border border-blue-900/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-700 bg-white shadow-sm transition-all hover:border-blue-400">
                            <option value="">Seleccionar Estado...</option>
                            <option value="OPERATIVO">OPERATIVO</option>
                            <option value="FALLA">CON FALLA</option>
                            <option value="MANTENIMIENTO">MANTENIMIENTO</option>
                        </select>
                    </div>

                    <!-- ROE -->
                    <div class="flex flex-col gap-2">
                        <label class="text-xs font-bold text-blue-900 uppercase tracking-wider">ROE</label>
                        <input type="text" [(ngModel)]="formData.roe" class="w-full p-3 text-sm border border-blue-900/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-700 shadow-sm transition-all hover:border-blue-400 placeholder-slate-300" placeholder="Ej: 1.2" />
                    </div>

                    <!-- Nivel de piso de ruido -->
                    <div class="flex flex-col gap-2">
                        <label class="text-xs font-bold text-blue-900 uppercase tracking-wider">Nivel de piso de ruido [dBm]</label>
                        <input type="text" [(ngModel)]="formData.nivelRuido" class="w-full p-3 text-sm border border-blue-900/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-700 shadow-sm transition-all hover:border-blue-400 placeholder-slate-300" placeholder="Ej: -95" />
                    </div>

                    <!-- Profundidad de modulación -->
                    <div class="flex flex-col gap-2">
                        <label class="text-xs font-bold text-blue-900 uppercase tracking-wider">Profundidad de modulación [%]</label>
                        <input type="text" [(ngModel)]="formData.modulacion" class="w-full p-3 text-sm border border-blue-900/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-700 shadow-sm transition-all hover:border-blue-400 placeholder-slate-300" placeholder="Ej: 85" />
                    </div>

                    <!-- Nivel de squelch -->
                    <div class="flex flex-col gap-2">
                        <label class="text-xs font-bold text-blue-900 uppercase tracking-wider">Nivel de squelch [dBm]</label>
                        <input type="text" [(ngModel)]="formData.squelch" class="w-full p-3 text-sm border border-blue-900/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-700 shadow-sm transition-all hover:border-blue-400 placeholder-slate-300" placeholder="Ej: -107" />
                    </div>

                    <!-- Puesta a tierra -->
                    <div class="flex flex-col gap-2">
                        <label class="text-xs font-bold text-blue-900 uppercase tracking-wider">Puesta a tierra [Ohm]</label>
                        <input type="text" [(ngModel)]="formData.puestaTierra" class="w-full p-3 text-sm border border-blue-900/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-700 shadow-sm transition-all hover:border-blue-400 placeholder-slate-300" placeholder="Ej: 5" />
                    </div>

                    <!-- Dias Sin Alternancia -->
                    <div class="flex flex-col gap-2">
                        <label class="text-xs font-bold text-blue-900 uppercase tracking-wider">Dias Sin Alternancia</label>
                        <input type="text" value="0 dias" readonly class="w-full p-3 text-sm border border-blue-900/20 rounded-lg outline-none text-slate-700 bg-slate-50" />
                    </div>

                    <!-- Observaciones -->
                    <div class="flex flex-col gap-2 md:col-span-2">
                        <label class="text-xs font-bold text-blue-900 uppercase tracking-wider">Observaciones</label>
                        <textarea [(ngModel)]="formData.observaciones" rows="4" class="w-full p-3 text-sm border border-blue-900/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-700 shadow-sm transition-all hover:border-blue-400 resize-none placeholder-slate-300" placeholder="Ingrese observaciones adicionales aquí..."></textarea>
                    </div>

                    <!-- Botones de Acción -->
                    <div class="md:col-span-2 flex justify-end gap-4 mt-4 pt-4 border-t border-slate-100">
                        <button (click)="onCancel()" class="px-6 py-2.5 rounded-lg text-slate-600 font-semibold hover:bg-slate-100 transition-colors">
                            Cancelar
                        </button>
                        <button (click)="onSave()" class="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-md hover:shadow-lg transition-all active:scale-95">
                            Guardar Checklist
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: []
})
export class RadioChecklistFormComponent {
    @Input() radioId: number = 0;
    @Input() radioName: string = '';
    @Input() isMain: boolean = false;

    private toastService = inject(ToastService);
    isChecked: boolean = false;

    formData = {
        estadoOperativo: '',
        roe: '',
        nivelRuido: '',
        modulacion: '',
        squelch: '',
        puestaTierra: '',
        observaciones: ''
    };

    ngOnInit() {
        this.isChecked = this.isMain;
    }

    onCancel() {
        // Reset form or navigate back
        this.formData = {
            estadoOperativo: '',
            roe: '',
            nivelRuido: '',
            modulacion: '',
            squelch: '',
            puestaTierra: '',
            observaciones: ''
        };
    }

    onSave() {
        console.log('Saving checklist:', {
            radioId: this.radioId,
            alAire: this.isChecked,
            ...this.formData
        });
        // Here you would call an API service to save the data
        this.toastService.success('Checklist guardado correctamente');
    }
}
