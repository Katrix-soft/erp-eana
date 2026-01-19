import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interfaces mirroring the backend DTOs
export interface VorData {
    fecha: string;
    equipo: string;
    azimut: number;
    error: number;
    tecnico: string;
}

export interface DocData {
    nombre: string;
    tipo: string;
    fecha: string;
    size: string;
}

export interface HistoryData {
    evento: string;
    type: 'ALERT' | 'OK';
    descripcion: string;
    responsable: string;
    fecha: string;
}

@Injectable({
    providedIn: 'root'
})
export class NavegacionService {
    private http = inject(HttpClient);
    private readonly apiUrl = '/api/v1/navegacion';

    getVorData(): Observable<VorData[]> {
        return this.http.get<VorData[]>(`${this.apiUrl}/vor-data`);
    }

    getDocs(): Observable<DocData[]> {
        return this.http.get<DocData[]>(`${this.apiUrl}/docs`);
    }

    getHistory(): Observable<HistoryData[]> {
        return this.http.get<HistoryData[]>(`${this.apiUrl}/history`);
    }

    updateSystem(id: number, data: any): Observable<any> {
        return this.http.patch<any>(`${this.apiUrl}/system/${id}`, data);
    }
}
