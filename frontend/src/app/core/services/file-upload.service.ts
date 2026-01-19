
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UploadResponse {
    url: string;
    filename: string;
    originalName: string;
    mimeType: string;
}

@Injectable({
    providedIn: 'root'
})
export class FileUploadService {
    private apiUrl = `${environment.apiUrl}/upload`;

    constructor(private http: HttpClient) { }

    uploadFile(file: File): Observable<UploadResponse> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<UploadResponse>(this.apiUrl, formData);
    }
}
