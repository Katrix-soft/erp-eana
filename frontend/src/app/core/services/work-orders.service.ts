import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { WorkOrder } from '../models/work-order.model';

@Injectable({
    providedIn: 'root'
})
export class WorkOrdersService {
    private apiUrl = '/api/v1/work-orders';


    constructor(private http: HttpClient) { }

    getAll(filters?: any): Observable<WorkOrder[]> {
        return this.http.get<WorkOrder[]>(this.apiUrl, { params: filters });
    }

    getById(id: number): Observable<WorkOrder> {
        return this.http.get<WorkOrder>(`${this.apiUrl}/${id}`);
    }

    update(id: number, data: Partial<WorkOrder>): Observable<WorkOrder> {
        return this.http.put<WorkOrder>(`${this.apiUrl}/${id}`, data);
    }

    delete(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }

    exportPdf(id: number): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/export/${id}`, { responseType: 'blob' });
    }
}
