import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, shareReplay } from 'rxjs/operators';
import { CacheService } from './cache.service';

@Injectable({
    providedIn: 'root'
})
export class EquipmentService {
    private http = inject(HttpClient);
    private cache = inject(CacheService);
    private readonly baseUrl = '/api/v1';

    getStats(): Observable<any[]> {
        const cacheKey = 'equipment:stats';
        const cached = this.cache.get<any[]>(cacheKey, 10 * 60 * 1000); // 10 min

        if (cached) {
            return of(cached);
        }

        return this.http.get<any[]>(`${this.baseUrl}/equipos/statistics`).pipe(
            tap(data => this.cache.set(cacheKey, data)),
            shareReplay(1)
        );
    }

    getEquipments(params: any = {}): Observable<any[]> {
        const cacheKey = `equipments:${JSON.stringify(params)}`;
        const cached = this.cache.get<any[]>(cacheKey);

        if (cached) {
            return of(cached);
        }

        return this.http.get<any[]>(`${this.baseUrl}/vhf-equipos`, { params }).pipe(
            tap(data => this.cache.set(cacheKey, data)),
            shareReplay(1)
        );
    }

    getUnifiedEquipments(params: any = {}): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/equipos`, { params });
    }

    getEquipmentById(id: number | string): Observable<any> {
        return this.http.get<any>(`${this.baseUrl}/equipos/${id}`);
    }

    getVhf(): Observable<any[]> {
        const cacheKey = 'vhf:all';
        const cached = this.cache.get<any[]>(cacheKey, 10 * 60 * 1000); // 10 min

        if (cached) {
            return of(cached);
        }

        return this.http.get<any[]>(`${this.baseUrl}/vhf`).pipe(
            tap(data => this.cache.set(cacheKey, data)),
            shareReplay(1)
        );
    }

    getAeropuertos(): Observable<any[]> {
        const cacheKey = 'aeropuertos:all';
        const cached = this.cache.get<any[]>(cacheKey, 30 * 60 * 1000); // 30 min

        if (cached) {
            return of(cached);
        }

        return this.http.get<any[]>(`${this.baseUrl}/aeropuertos`).pipe(
            tap(data => this.cache.set(cacheKey, data)),
            shareReplay(1)
        );
    }

    getChannels(): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/canales`);
    }

    getFrequencies(): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/frecuencias`);
    }

    getNotifications(): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/notifications`);
    }

    getUsers(): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/users`);
    }

    createEquipment(data: any): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/vhf-equipos`, data).pipe(
            tap(() => {
                // Invalidar cache al crear
                this.cache.invalidate('equipments');
                this.cache.invalidate('equipment:stats');
            })
        );
    }

    updateEquipment(id: number, data: any): Observable<any> {
        return this.http.put<any>(`${this.baseUrl}/vhf-equipos/${id}`, data).pipe(
            tap(() => {
                // Invalidar cache al actualizar
                this.cache.invalidate('equipments');
                this.cache.invalidate('equipment:stats');
            })
        );
    }

    deleteEquipment(id: number): Observable<any> {
        return this.http.delete<any>(`${this.baseUrl}/vhf-equipos/${id}`).pipe(
            tap(() => {
                // Invalidar cache al eliminar
                this.cache.invalidate('equipments');
                this.cache.invalidate('equipment:stats');
            })
        );
    }
}
