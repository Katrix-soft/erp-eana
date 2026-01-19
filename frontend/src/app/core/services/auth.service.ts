import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, tap } from 'rxjs';

export interface User {
    token: string;
    role: string;
    email?: string;
    id?: number;
    context?: any;
    personal?: {
        nombre: string;
        apellido: string;
    };
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private http = inject(HttpClient);
    private router = inject(Router);

    private userSubject = new BehaviorSubject<User | null>(this.getInitialUser());
    user$ = this.userSubject.asObservable();

    loading$ = new BehaviorSubject<boolean>(false);

    constructor() { }

    private getInitialUser(): User | null {
        if (typeof window === 'undefined') return null;

        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        const email = localStorage.getItem('email');
        const contextStr = localStorage.getItem('context');
        const context = contextStr ? JSON.parse(contextStr) : null;
        const userId = localStorage.getItem('userId');

        if (token && role) {
            return {
                token,
                role,
                email: email || undefined,
                id: userId ? parseInt(userId) : undefined,
                context
            };
        }
        return null;
    }

    get userValue() {
        return this.userSubject.value;
    }

    login(email: string, password: string) {
        this.loading$.next(true);
        return this.http.post<any>('/api/v1/auth/login', { email, password }).pipe(
            tap({
                next: (data) => {
                    const token = data.access_token;
                    const userData = data.user;

                    localStorage.setItem('token', token);
                    localStorage.setItem('role', userData.role);
                    localStorage.setItem('email', userData.email);
                    localStorage.setItem('userId', userData.id.toString());
                    if (userData.context) {
                        localStorage.setItem('context', JSON.stringify(userData.context));
                    }

                    const user: User = {
                        token,
                        role: userData.role,
                        email: userData.email,
                        id: userData.id,
                        context: userData.context
                    };
                    this.userSubject.next(user);
                    this.router.navigate(['/dashboard']);
                },
                error: (err) => {
                    console.error('Login failed', err);
                    this.loading$.next(false);
                },
                complete: () => this.loading$.next(false)
            })
        );
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('email');
        localStorage.removeItem('userId');
        localStorage.removeItem('context');
        this.userSubject.next(null);
        this.router.navigate(['/login']);
    }

    checkDefaultPasswordHint(identifier: string) {
        return this.http.get<{ showHint: boolean }>(`/api/v1/auth/check-status/${identifier}`);
    }
}
