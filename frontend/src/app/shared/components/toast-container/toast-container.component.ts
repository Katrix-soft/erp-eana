import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../core/services/toast.service';
import { LucideAngularModule, CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-angular';

@Component({
    selector: 'app-toast-container',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    template: `
    <div class="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      <div *ngFor="let toast of toasts$ | async; trackBy: trackById"
           class="pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-2xl min-w-[320px] max-w-md animate-toast-in transition-all duration-300 relative group"
           [ngClass]="getToastClasses(toast)">
        
        <div class="mt-0.5">
          <lucide-icon [name]="getIcon(toast)" [size]="20"></lucide-icon>
        </div>

        <div class="flex-1">
          <h4 class="text-sm font-bold uppercase tracking-wider mb-1" [ngClass]="getTitleClasses(toast)">
            {{ toast.title || getDefaultTitle(toast) }}
          </h4>
          <p class="text-sm opacity-90 leading-snug">{{ toast.message }}</p>
        </div>

        <button (click)="remove(toast.id)" class="opacity-0 group-hover:opacity-100 p-1 hover:bg-black/10 rounded-lg transition-all absolute top-2 right-2">
          <lucide-icon [name]="X" [size]="16"></lucide-icon>
        </button>

        <!-- Progress bar -->
        <div *ngIf="toast.duration" 
             class="absolute bottom-0 left-0 h-1 bg-current opacity-20 transition-all linear"
             [style.width]="'0%'"
             [style.animation]="'progress ' + toast.duration + 'ms linear forwards'">
        </div>
      </div>
    </div>
  `,
    styles: [`
    @keyframes toast-in {
      from { transform: translateX(100%) scale(0.9); opacity: 0; }
      to { transform: translateX(0) scale(1); opacity: 1; }
    }
    @keyframes progress {
      from { width: 100%; }
      to { width: 0%; }
    }
    .animate-toast-in {
      animation: toast-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `]
})
export class ToastContainerComponent {
    private toastService = inject(ToastService);
    toasts$ = this.toastService.toasts$;

    readonly X = X;

    trackById(index: number, toast: Toast) {
        return toast.id;
    }

    remove(id: number) {
        this.toastService.remove(id);
    }

    getIcon(toast: Toast) {
        switch (toast.type) {
            case 'success': return CheckCircle;
            case 'error': return XCircle;
            case 'warning': return AlertTriangle;
            default: return Info;
        }
    }

    getToastClasses(toast: Toast) {
        switch (toast.type) {
            case 'success': return 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100 backdrop-blur-xl';
            case 'error': return 'bg-red-950/90 border-red-500/50 text-red-100 backdrop-blur-xl';
            case 'warning': return 'bg-amber-950/90 border-amber-500/50 text-amber-100 backdrop-blur-xl';
            default: return 'bg-slate-900/90 border-slate-700/50 text-slate-100 backdrop-blur-xl';
        }
    }

    getTitleClasses(toast: Toast) {
        switch (toast.type) {
            case 'success': return 'text-emerald-400';
            case 'error': return 'text-red-400';
            case 'warning': return 'text-amber-400';
            default: return 'text-blue-400';
        }
    }

    getDefaultTitle(toast: Toast) {
        switch (toast.type) {
            case 'success': return 'Completado';
            case 'error': return 'Error';
            case 'warning': return 'Atención';
            default: return 'Notificación';
        }
    }
}
