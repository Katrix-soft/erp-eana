import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Notification {
    id: number;
    message: string;
    type: string;
    read: boolean;
    createdAt: string;
    aeropuerto?: { codigo: string; nombre: string; };
    fir?: { nombre: string; };
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private http = inject(HttpClient);
    private baseUrl = '/api/v1';

    getNotifications(): Observable<Notification[]> {
        return this.http.get<Notification[]>(`${this.baseUrl}/notifications`);
    }

    markAsRead(id: number): Observable<void> {
        return this.http.put<void>(`${this.baseUrl}/notifications/${id}/read`, {});
    }

    markAllAsRead(): Observable<void> {
        return this.http.put<void>(`${this.baseUrl}/notifications/read-all`, {});
    }

    create(message: string, type: string = 'INFO', extra?: { aeropuertoId?: number, firId?: number }): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/notifications`, { message, type, ...extra });
    }
}
