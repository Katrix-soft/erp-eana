import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, X, AlertTriangle, CheckCircle, Info, HelpCircle } from 'lucide-angular';

export type ConfirmType = 'danger' | 'warning' | 'success' | 'info';

@Component({
    selector: 'app-confirm-modal',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div class="bg-slate-900 border border-slate-800 rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        
        <div class="p-8 text-center">
          <!-- Icon -->
          <div class="mb-6 flex justify-center">
            <div class="w-20 h-20 rounded-3xl flex items-center justify-center animate-bounce-subtle" [ngClass]="getIconBgClass()">
              <lucide-icon [name]="getIcon()" [size]="40" [class]="getIconColorClass()"></lucide-icon>
            </div>
          </div>

          <!-- Content -->
          <h2 class="text-2xl font-bold text-white mb-2">{{ title }}</h2>
          <p class="text-slate-400 leading-relaxed">{{ message }}</p>
        </div>

        <!-- Actions -->
        <div class="p-6 bg-slate-950/50 border-t border-slate-800 flex flex-col sm:flex-row gap-3">
          <button (click)="onCancel.emit()" 
                  class="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-all active:scale-95">
            {{ cancelText }}
          </button>
          <button (click)="onConfirm.emit()" 
                  class="flex-1 px-6 py-4 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 active:brightness-90 hover:scale-[1.02]"
                  [ngClass]="getConfirmBtnClass()">
            {{ confirmText }}
          </button>
        </div>

      </div>
    </div>
  `,
    styles: [`
    @keyframes bounce-subtle {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    .animate-bounce-subtle {
      animation: bounce-subtle 3s ease-in-out infinite;
    }
  `]
})
export class ConfirmModalComponent {
    @Input() isOpen = false;
    @Input() title = '¿Estás seguro?';
    @Input() message = 'Esta acción no se puede deshacer.';
    @Input() confirmText = 'Confirmar';
    @Input() cancelText = 'Cancelar';
    @Input() type: ConfirmType = 'warning';

    @Output() onConfirm = new EventEmitter<void>();
    @Output() onCancel = new EventEmitter<void>();

    getIcon() {
        switch (this.type) {
            case 'danger': return AlertTriangle;
            case 'success': return CheckCircle;
            case 'info': return Info;
            default: return HelpCircle;
        }
    }

    getIconBgClass() {
        switch (this.type) {
            case 'danger': return 'bg-red-500/10';
            case 'success': return 'bg-emerald-500/10';
            case 'info': return 'bg-blue-500/10';
            default: return 'bg-amber-500/10';
        }
    }

    getIconColorClass() {
        switch (this.type) {
            case 'danger': return 'text-red-500';
            case 'success': return 'text-emerald-500';
            case 'info': return 'text-blue-500';
            default: return 'text-amber-500';
        }
    }

    getConfirmBtnClass() {
        switch (this.type) {
            case 'danger': return 'bg-red-600 hover:bg-red-700 shadow-red-600/20';
            case 'success': return 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20';
            case 'info': return 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20';
            default: return 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20 text-black';
        }
    }
}
