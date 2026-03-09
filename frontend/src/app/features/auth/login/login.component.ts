import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LucideAngularModule, Plane, User, Lock, ShieldCheck, Fingerprint, Loader } from 'lucide-angular';
import { debounceTime, distinctUntilChanged, switchMap, of, startWith, interval, Subscription } from 'rxjs';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule, RouterModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css'
})
export class LoginComponent implements OnDestroy {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private router = inject(Router);

    loginForm = this.fb.group({
        email: ['', [Validators.required]],
        password: ['', [Validators.required]]
    });

    isLoading = false;
    errorMessage = '';
    showErrorScreen = false;
    showDefaultPasswordHint = false;

    // Rate limiting
    isBlocked = false;
    retryAfter = 0;
    retryCountdown = 0;

    // Biométrico
    isBiometricLoading = false;
    biometricAvailable = false;
    biometricError = '';
    showBiometricSection = false;
    resolvedUserId: number | null = null;

    private subs: Subscription[] = [];

    readonly Plane = Plane;
    readonly User = User;
    readonly Lock = Lock;
    readonly ShieldCheck = ShieldCheck;
    readonly Fingerprint = Fingerprint;
    readonly Loader = Loader;

    ngOnInit() {
        // Verificar soporte WebAuthn
        this.checkBiometricSupport();

        const lastEmail = localStorage.getItem('lastEmail');
        if (lastEmail) {
            this.loginForm.patchValue({ email: lastEmail });
        }

        // Detectar usuario al tipear para mostrar botón biométrico
        const emailSub = this.loginForm.get('email')?.valueChanges.pipe(
            startWith(lastEmail || ''),
            debounceTime(500),
            distinctUntilChanged(),
            switchMap(value => {
                const identifier = value?.trim();
                if (!identifier || identifier.length < 3) {
                    this.showBiometricSection = false;
                    this.resolvedUserId = null;
                    return of({ showHint: false });
                }
                return this.authService.checkDefaultPasswordHint(identifier);
            })
        ).subscribe({
            next: res => this.showDefaultPasswordHint = res.showHint,
            error: () => this.showDefaultPasswordHint = false
        });

        if (emailSub) this.subs.push(emailSub);
    }

    ngOnDestroy() {
        this.subs.forEach(s => s.unsubscribe());
    }

    biometricSupportReason = '';

    private async checkBiometricSupport() {
        if (!window.isSecureContext) {
            console.warn('WebAuthn requiere HTTPS');
            this.biometricAvailable = false;
            this.biometricSupportReason = 'Requiere enlace HTTPS.';
            return;
        }
        if (window.PublicKeyCredential) {
            this.biometricAvailable = true;
        } else {
            this.biometricAvailable = false;
            this.biometricSupportReason = 'Este navegador no soporta el sensor.';
        }
    }

    onSubmit() {
        if (this.loginForm.valid && !this.isBlocked) {
            this.isLoading = true;
            this.errorMessage = '';
            this.showErrorScreen = false;
            const { email, password } = this.loginForm.value;

            localStorage.setItem('lastEmail', email!.trim());

            const sub = this.authService.login(email!.trim(), password!).subscribe({
                next: () => {
                    this.isLoading = false;
                    this.router.navigate(['/dashboard']);
                },
                error: (err) => {
                    this.isLoading = false;
                    this.showErrorScreen = true;

                    if (err.status === 429) {
                        this.isBlocked = true;
                        this.retryAfter = err.error?.retryAfter || 300;
                        this.retryCountdown = this.retryAfter;
                        this.errorMessage = `Demasiados intentos fallidos. Por favor espere ${this.formatTime(this.retryAfter)}`;

                        const timer = interval(1000).subscribe(() => {
                            this.retryCountdown--;
                            if (this.retryCountdown <= 0) {
                                this.isBlocked = false;
                                this.showErrorScreen = false;
                                timer.unsubscribe();
                            } else {
                                this.errorMessage = `Demasiados intentos fallidos. Por favor espere ${this.formatTime(this.retryCountdown)}`;
                            }
                        });
                        this.subs.push(timer);
                    } else if (err.status === 401) {
                        this.errorMessage = 'Usuario o contraseña incorrectos.';
                    } else if (err.status === 404) {
                        this.errorMessage = 'El servidor de autenticación no está disponible.';
                    } else {
                        this.errorMessage = 'Error de conexión con el servidor.';
                    }
                }
            });
            this.subs.push(sub);
        }
    }

    /**
     * Login biométrico con userId
     * El usuario debe ingresar su ID de usuario (mostrado en el perfil)
     */
    async loginWithBiometric() {
        if (!this.resolvedUserId) {
            // Intentar resolver el userId del campo email
            const emailVal = this.loginForm.get('email')?.value?.trim();
            if (!emailVal) {
                this.biometricError = 'Por favor ingrese su usuario o email primero para usar el biométrico.';
                return;
            }
            // Buscar userId por email/username via backend
            await this.resolveUserIdFromIdentifier(emailVal);
        }

        if (!this.resolvedUserId) return;

        this.isBiometricLoading = true;
        this.biometricError = '';

        const sub = this.authService.loginWithPasskey(this.resolvedUserId).subscribe({
            next: () => {
                this.isBiometricLoading = false;
                const emailVal = this.loginForm.get('email')?.value?.trim();
                if (emailVal) localStorage.setItem('lastEmail', emailVal);
                this.router.navigate(['/dashboard']);
            },
            error: (err) => {
                this.isBiometricLoading = false;
                if (err.name === 'NotAllowedError') {
                    this.biometricError = 'Autenticación biométrica cancelada o tiempo agotado.';
                } else if (err.status === 400) {
                    const msg = err.error?.message || '';
                    if (msg.includes('No hay biométrico')) {
                        this.biometricError = 'No tiene biométrico registrado. Inicie sesión con contraseña y regístrelo desde su perfil.';
                    } else {
                        this.biometricError = msg || 'Error al iniciar autenticación biométrica.';
                    }
                } else {
                    this.biometricError = err.error?.message || 'Error en autenticación biométrica.';
                }
            }
        });
        this.subs.push(sub);
    }

    private async resolveUserIdFromIdentifier(identifier: string) {
        // Llamar endpoint para obtener userId desde el identifier
        try {
            const result = await this.authService.resolveUserIdFromIdentifier(identifier).toPromise();
            if (result?.userId) {
                this.resolvedUserId = result.userId;
                // Verificar si tiene passkey
                const statusResult = await this.authService.checkPasskeyStatus(this.resolvedUserId).toPromise();
                if (!statusResult?.hasPasskey) {
                    this.biometricError = 'No tiene biométrico registrado para este usuario. Inicie sesión con contraseña y regístrelo desde su perfil.';
                    this.resolvedUserId = null;
                }
            }
        } catch (err) {
            this.biometricError = 'No se pudo encontrar el usuario. Verifique su usuario o email.';
        }
    }

    formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins > 0) {
            return `${mins} minuto${mins > 1 ? 's' : ''} ${secs}s`;
        }
        return `${secs} segundo${secs !== 1 ? 's' : ''}`;
    }

    retry() {
        if (!this.isBlocked) {
            this.showErrorScreen = false;
            this.errorMessage = '';
            this.biometricError = '';
            this.loginForm.reset();
        }
    }
}
