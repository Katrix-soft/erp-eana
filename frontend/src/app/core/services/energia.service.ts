import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Energia {
    id: number;
    nombre?: string;
    tipo?: string;
    marca?: string;
    modelo?: string;
    numeroSerie?: string;
    activoFijo?: string;
    referencia?: string;
    grupo?: string;
    siglasLocal?: string;
    oaci?: string;
    sistema?: string;
    potencia?: string;
    idApSig?: string;
    observaciones?: string;
    estado: 'OK' | 'NOVEDAD' | 'FUERA_SERVICIO';
    aeropuertoId?: number;
    firId?: number;
    aeropuerto?: any;
    firRel?: any;
}

@Injectable({
    providedIn: 'root'
})
export class EnergiaService {
    private http: HttpClient = inject(HttpClient);
    private apiUrl = '/api/v1/energia';

    getEquipamientos(filters?: { aeropuerto?: string, fir?: string }): Observable<Energia[]> {
        let params = new HttpParams();
        if (filters?.aeropuerto) params = params.set('aeropuerto', filters.aeropuerto);
        if (filters?.fir) params = params.set('fir', filters.fir);

        return this.http.get<Energia[]>(this.apiUrl, { params });
    }

    getEquipamiento(id: number): Observable<Energia> {
        return this.http.get<Energia>(`${this.apiUrl}/${id}`);
    }

    updateStatus(id: number, estado: string): Observable<Energia> {
        return this.http.patch<Energia>(`${this.apiUrl}/${id}/estado`, { estado });
    }
}
