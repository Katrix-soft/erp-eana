import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, X } from 'lucide-angular';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-500">
      <div class="bg-slate-900/80 border border-white/5 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 backdrop-blur-3xl">
        <div class="flex items-center justify-between p-8 border-b border-white/[0.03]">
          <h2 class="text-2xl font-black text-white tracking-tight">{{ title }}</h2>
          <button (click)="onClose.emit()" class="p-3 text-slate-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all">
            <lucide-icon [name]="X" size="24"></lucide-icon>
          </button>
        </div>
        <div class="p-8">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Output() onClose = new EventEmitter<void>();

  readonly X = X;
}
