import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface VorMeasurement {
    id: number;
    fecha: string;
    equipoVor: string;
    azimut: number;
    errorMedido: number;
    tecnico: string;
    aeropuertoId?: number;
    aeropuerto?: any;
}

@Injectable({
    providedIn: 'root'
})
export class VorService {
    private http = inject(HttpClient);
    private apiUrl = '/api/v1/vor';

    getMeasurements(): Observable<VorMeasurement[]> {
        return this.http.get<VorMeasurement[]>(this.apiUrl);
    }

    createMeasurement(data: any): Observable<VorMeasurement> {
        return this.http.post<VorMeasurement>(this.apiUrl, data);
    }

    analyzeMeasurements(data: any[]): Observable<string> {
        return this.http.post(`${this.apiUrl}/analyze`, data, { responseType: 'text' });
    }
}
