import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

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

    private userSignal = signal<User | null>(this.getInitialUser());
    user = this.userSignal.asReadonly();
    user$ = toObservable(this.userSignal);
    isAuthenticated = computed(() => !!this.userSignal());

    private isLoadingSignal = signal<boolean>(false);
    loading = this.isLoadingSignal.asReadonly();
    loading$ = toObservable(this.isLoadingSignal);

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
        return this.userSignal();
    }

    login(email: string, password: string) {
        this.isLoadingSignal.set(true);
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
                    this.userSignal.set(user);
                    this.router.navigate(['/dashboard']);
                },
                error: (err) => {
                    console.error('Login failed', err);
                    this.isLoadingSignal.set(false);
                },
                complete: () => this.isLoadingSignal.set(false)
            })
        );
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('email');
        localStorage.removeItem('userId');
        localStorage.removeItem('context');
        this.userSignal.set(null);
        this.router.navigate(['/login']);
    }

    checkDefaultPasswordHint(identifier: string) {
        return this.http.get<{ showHint: boolean }>(`/api/v1/auth/check-status/${identifier}`);
    }
}
