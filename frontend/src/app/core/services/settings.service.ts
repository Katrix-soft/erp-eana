import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SettingsService {
    private http = inject(HttpClient);
    private readonly baseUrl = '/api/v1/settings';

    getSettings(): Observable<any> {
        return this.http.get<any>(this.baseUrl);
    }

    updateSettings(key: string, value: any): Observable<any> {
        return this.http.post<any>(this.baseUrl, { key, value });
    }
}
