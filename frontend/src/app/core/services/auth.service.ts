import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, from, switchMap, throwError } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import {
    startRegistration,
    startAuthentication,
} from '@simplewebauthn/browser';

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

    // ============================================
    // LOGIN CLÁSICO
    // ============================================
    login(email: string, password: string) {
        this.isLoadingSignal.set(true);
        return this.http.post<any>('/api/v1/auth/login', { email, password }).pipe(
            tap({
                next: (data) => {
                    this.processLoginResponse(data);
                },
                error: (err) => {
                    console.error('Login failed', err);
                    this.isLoadingSignal.set(false);
                },
                complete: () => this.isLoadingSignal.set(false)
            })
        );
    }

    // ============================================
    // LOGIN BIOMÉTRICO (WebAuthn / Passkey)
    // ============================================

    /**
     * Verificar si el usuario tiene biométrico registrado
     */
    checkPasskeyStatus(userId: number) {
        return this.http.get<{ hasPasskey: boolean; count: number }>(
            `/api/v1/auth/passkey/status/${userId}`
        );
    }

    /**
     * AUTENTICACIÓN BIOMÉTRICA: Login con huella/Face ID
     * Flujo: obtener opciones → autenticar en dispositivo → verificar en servidor
     */
    loginWithPasskey(userId: number) {
        this.isLoadingSignal.set(true);

        // Paso 1: Obtener opciones del servidor
        return this.http.post<any>('/api/v1/auth/passkey/auth/options', { userId }).pipe(
            switchMap(options => {
                // Paso 2: Pedir autenticación al dispositivo (biométrico)
                return from(startAuthentication(options));
            }),
            switchMap(assertionResponse => {
                // Paso 3: Verificar en servidor y obtener JWT
                return this.http.post<any>('/api/v1/auth/passkey/auth/verify', {
                    userId,
                    response: assertionResponse,
                });
            }),
            tap({
                next: (data) => {
                    this.processLoginResponse(data);
                },
                error: (err) => {
                    console.error('Biometric login failed', err);
                    this.isLoadingSignal.set(false);
                },
                complete: () => this.isLoadingSignal.set(false)
            })
        );
    }

    /**
     * REGISTRO BIOMÉTRICO: Registrar nueva huella/Face ID
     * Solo disponible cuando el usuario ya está logueado
     */
    registerPasskey() {
        // Paso 1: Obtener opciones de registro
        return this.http.post<any>('/api/v1/auth/passkey/register/options', {}).pipe(
            switchMap(options => {
                // Paso 2: Crear credencial en el dispositivo
                return from(startRegistration(options));
            }),
            switchMap(attestationResponse => {
                // Paso 3: Verificar y guardar en servidor
                return this.http.post<any>('/api/v1/auth/passkey/register/verify', {
                    response: attestationResponse,
                });
            })
        );
    }

    /**
     * Eliminar todos los biométricos registrados
     */
    removePasskeys() {
        return this.http.delete<any>('/api/v1/auth/passkey/remove');
    }

    // ============================================
    // HELPERS
    // ============================================

    /**
     * Procesar respuesta de login (igual para clásico y biométrico)
     */
    private processLoginResponse(data: any) {
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

    /**
     * Resolver userId desde email o username (para el flujo biométrico)
     */
    resolveUserIdFromIdentifier(identifier: string) {
        return this.http.get<{ userId: number | null }>(`/api/v1/auth/resolve-user/${encodeURIComponent(identifier)}`);
    }
}
