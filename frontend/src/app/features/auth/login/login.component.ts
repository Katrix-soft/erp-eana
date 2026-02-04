import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LucideAngularModule, Plane, User, Lock, ShieldCheck } from 'lucide-angular';
import { debounceTime, distinctUntilChanged, switchMap, of, startWith, interval } from 'rxjs';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule, RouterModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css'
})
export class LoginComponent {
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

    ngOnInit() {
        this.loginForm.get('email')?.valueChanges.pipe(
            startWith(''),
            debounceTime(300),
            distinctUntilChanged(),
            switchMap(value => {
                const identifier = value?.trim();
                if (!identifier || identifier.length < 3) return of({ showHint: false });
                return this.authService.checkDefaultPasswordHint(identifier);
            })
        ).subscribe({
            next: res => this.showDefaultPasswordHint = res.showHint,
            error: () => this.showDefaultPasswordHint = false
        });
    }

    readonly Plane = Plane;
    readonly User = User;
    readonly Lock = Lock;
    readonly ShieldCheck = ShieldCheck;

    onSubmit() {
        if (this.loginForm.valid && !this.isBlocked) {
            this.isLoading = true;
            this.errorMessage = '';
            this.showErrorScreen = false;
            const { email, password } = this.loginForm.value;

            console.log('Intentando login para:', email);
            this.authService.login(email!.trim(), password!).subscribe({
                next: (res) => {
                    console.log('Login exitoso:', res);
                    this.isLoading = false;
                    this.router.navigate(['/dashboard']);
                },
                error: (err) => {
                    console.error('Error en LoginComponent:', err);
                    this.isLoading = false;
                    this.showErrorScreen = true;

                    // Manejar rate limiting (429)
                    if (err.status === 429) {
                        this.isBlocked = true;
                        this.retryAfter = err.error?.retryAfter || 300;
                        this.retryCountdown = this.retryAfter;
                        this.errorMessage = `Demasiados intentos fallidos. Por favor espere ${this.formatTime(this.retryAfter)}`;

                        // Iniciar countdown
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
                    } else if (err.status === 401) {
                        this.errorMessage = 'Usuario o contraseña incorrectos. Por favor, intente nuevamente.';
                    } else if (err.status === 404) {
                        this.errorMessage = 'El servidor de autenticación no está disponible.';
                    } else {
                        this.errorMessage = 'Error de conexión con el servidor. Por favor, intente más tarde.';
                    }
                }
            });
        }
    }

    formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins > 0) {
            return `${mins} minuto${mins > 1 ? 's' : ''} ${secs} segundo${secs !== 1 ? 's' : ''}`;
        }
        return `${secs} segundo${secs !== 1 ? 's' : ''}`;
    }

    retry() {
        if (!this.isBlocked) {
            this.showErrorScreen = false;
            this.errorMessage = '';
            this.loginForm.reset();
        }
    }

}
