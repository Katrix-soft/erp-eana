import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: number;
    message: string;
    type: ToastType;
    title?: string;
    duration?: number;
}

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    private toasts = new BehaviorSubject<Toast[]>([]);
    toasts$ = this.toasts.asObservable();
    private counter = 0;

    show(message: string, type: ToastType = 'info', title?: string, duration: number = 5000) {
        const id = this.counter++;
        const toast: Toast = { id, message, type, title, duration };

        this.toasts.next([...this.toasts.value, toast]);

        if (duration > 0) {
            setTimeout(() => this.remove(id), duration);
        }
    }

    success(message: string, title: string = 'Éxito') {
        this.show(message, 'success', title);
    }

    error(message: string, title: string = 'Error') {
        this.show(message, 'error', title);
    }

    warning(message: string, title: string = 'Advertencia') {
        this.show(message, 'warning', title);
    }

    info(message: string, title: string = 'Información') {
        this.show(message, 'info', title);
    }

    remove(id: number) {
        this.toasts.next(this.toasts.value.filter(t => t.id !== id));
    }
}
