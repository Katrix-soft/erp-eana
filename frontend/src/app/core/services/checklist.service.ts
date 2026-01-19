import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ChecklistService {
    private http = inject(HttpClient);
    private baseUrl = '/api/v1';

    getChecklists(): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/checklists`);
    }

    getChecklist(id: string): Observable<any> {
        return this.http.get<any>(`${this.baseUrl}/checklists/${id}`);
    }

    createChecklist(data: any): Observable<any> {
        return this.http.get<any>(`${this.baseUrl}/checklists`, { params: data }); // Backend uses GET for creation in some cases? No, usually POST.
    }

    postChecklist(data: any): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/checklists`, data);
    }

    updateChecklist(id: string, data: any): Observable<any> {
        return this.http.put<any>(`${this.baseUrl}/checklists/${id}`, data);
    }

    deleteChecklist(id: string): Observable<any> {
        return this.http.delete<any>(`${this.baseUrl}/checklists/${id}`);
    }
}
