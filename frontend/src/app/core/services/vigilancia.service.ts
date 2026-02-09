
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Vigilancia {
    id: number;
    referencia?: string;
    definicion?: string;
    modelo?: string;
    certificadores?: string;
    sistema?: string;
    fir?: string;
    siglasLocal?: string;
    ubicacion?: string;
    idApSig?: string;
    estado: 'OK' | 'NOVEDAD' | 'FUERA_SERVICIO';
    aeropuertoId?: number;
    firId?: number;
    canalActivo?: 'CH1' | 'CH2';
    aeropuerto?: any;
    firRel?: any;
}

@Injectable({
    providedIn: 'root'
})
export class VigilanciaService {
    private http: HttpClient = inject(HttpClient);
    private apiUrl = '/api/v1/vigilancia';

    getEquipamientos(filters?: { aeropuerto?: string, fir?: string }): Observable<Vigilancia[]> {
        let params = new HttpParams();
        if (filters?.aeropuerto) params = params.set('aeropuerto', filters.aeropuerto);
        if (filters?.fir) params = params.set('fir', filters.fir);

        return this.http.get<Vigilancia[]>(this.apiUrl, { params });
    }

    getEquipamiento(id: number): Observable<Vigilancia> {
        return this.http.get<Vigilancia>(`${this.apiUrl}/${id}`);
    }

    updateStatus(id: number, estado: string): Observable<Vigilancia> {
        return this.http.patch<Vigilancia>(`${this.apiUrl}/${id}/estado`, { estado });
    }
}
