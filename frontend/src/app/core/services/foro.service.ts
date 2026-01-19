import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ForoPost {
    id: number;
    titulo: string;
    contenido: string;
    autorId: number;
    aeropuertoId?: number;
    firId?: number;
    sector?: string;
    equipoId?: number;
    resuelto: boolean;
    vistas: number;
    imagenes: string[];
    createdAt: string;
    updatedAt: string;
    autor: {
        id: number;
        email: string;
        personal?: {
            nombre: string;
            apellido: string;
        };
    };
    aeropuerto?: {
        id: number;
        nombre: string;
    };
    fir?: {
        id: number;
        nombre: string;
    };
    equipo?: {
        id: number;
        marca: string;
        modelo: string;
    };
    _count?: {
        comentarios: number;
    };
    comentarios?: ForoComment[];
}

export interface ForoComment {
    id: number;
    postId: number;
    autorId: number;
    contenido: string;
    imagenes: string[];
    createdAt: string;
    updatedAt: string;
    autor: {
        id: number;
        email: string;
        personal?: {
            nombre: string;
            apellido: string;
        };
    };
}

export interface CreateForoPostDto {
    titulo: string;
    contenido: string;
    aeropuertoId?: number;
    firId?: number;
    sector?: string;
    equipoId?: number;
    imagenes?: string[];
    resuelto?: boolean;
}

export interface CreateForoCommentDto {
    contenido: string;
    imagenes?: string[];
}

@Injectable({
    providedIn: 'root'
})
export class ForoService {
    private apiUrl = `${environment.apiUrl}/foro`;

    constructor(private http: HttpClient) { }

    createPost(dto: CreateForoPostDto): Observable<ForoPost> {
        return this.http.post<ForoPost>(`${this.apiUrl}/posts`, dto);
    }

    getPosts(filters?: {
        aeropuertoId?: number;
        firId?: number;
        sector?: string;
        resuelto?: boolean;
        page?: number;
        limit?: number;
    }): Observable<ForoPost[]> {
        let params = new HttpParams();

        if (filters) {
            if (filters.aeropuertoId) params = params.set('aeropuertoId', filters.aeropuertoId.toString());
            if (filters.firId) params = params.set('firId', filters.firId.toString());
            if (filters.sector) params = params.set('sector', filters.sector);
            if (filters.resuelto !== undefined) params = params.set('resuelto', filters.resuelto.toString());
            if (filters.page) params = params.set('page', filters.page.toString());
            if (filters.limit) params = params.set('limit', filters.limit.toString());
        }

        return this.http.get<ForoPost[]>(`${this.apiUrl}/posts`, { params });
    }

    getPost(id: number): Observable<ForoPost> {
        return this.http.get<ForoPost>(`${this.apiUrl}/posts/${id}`);
    }

    updatePost(id: number, dto: Partial<CreateForoPostDto>): Observable<ForoPost> {
        return this.http.put<ForoPost>(`${this.apiUrl}/posts/${id}`, dto);
    }

    deletePost(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/posts/${id}`);
    }

    createComment(postId: number, dto: CreateForoCommentDto): Observable<ForoComment> {
        return this.http.post<ForoComment>(`${this.apiUrl}/posts/${postId}/comments`, dto);
    }

    deleteComment(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/comments/${id}`);
    }
}
