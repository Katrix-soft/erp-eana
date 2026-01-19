import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuditLog } from '../models/audit-log.model';

@Injectable({
    providedIn: 'root'
})
export class AuditService {
    private apiUrl = '/api/v1/audit';

    constructor(private http: HttpClient) { }

    getAll(): Observable<AuditLog[]> {
        return this.http.get<AuditLog[]>(this.apiUrl);
    }

    getByEntity(entity: string, id: number): Observable<AuditLog[]> {
        return this.http.get<AuditLog[]>(`${this.apiUrl}/entity/${entity}/${id}`);
    }
}
