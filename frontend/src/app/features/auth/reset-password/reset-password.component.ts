import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-angular';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <!-- Background Image Layer - CAMBIA LA URL AQUÍ PARA CAMBIAR EL FONDO -->
      <div class="absolute inset-0 z-0">
        <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop" 
             class="w-full h-full object-cover">
        <!-- Overlay oscuro para resaltar el formulario -->
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]"></div>
      </div>

      <div class="relative z-10 w-full max-w-md">
        
        <!-- Success State -->
        <div *ngIf="resetSuccess" class="bg-white rounded-2xl shadow-2xl p-8 text-center animate-in fade-in slide-in-from-bottom-4">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <lucide-icon [name]="CheckCircle" [size]="32" class="text-green-600"></lucide-icon>
          </div>
          <h2 class="text-2xl font-bold text-slate-800 mb-2">¡Contraseña Actualizada!</h2>
          <p class="text-slate-600 mb-6">
            Tu contraseña ha sido restablecida correctamente. Ya puedes iniciar sesión.
          </p>
          <button 
            (click)="router.navigate(['/login'])"
            class="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-semibold">
            Ir al Login
          </button>
        </div>

        <!-- Error State -->
        <div *ngIf="tokenInvalid" class="bg-white rounded-2xl shadow-2xl p-8 text-center animate-in fade-in slide-in-from-bottom-4">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <lucide-icon [name]="AlertCircle" [size]="32" class="text-red-600"></lucide-icon>
          </div>
          <h2 class="text-2xl font-bold text-slate-800 mb-2">Token Inválido</h2>
          <p class="text-slate-600 mb-6">
            El enlace de recuperación es inválido o ha expirado. Por favor, solicita uno nuevo.
          </p>
          <button 
            (click)="router.navigate(['/forgot-password'])"
            class="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-semibold">
            Solicitar Nuevo Enlace
          </button>
        </div>

        <!-- Form State -->
        <div *ngIf="!resetSuccess && !tokenInvalid" class="bg-white rounded-2xl shadow-2xl p-8 animate-in fade-in slide-in-from-bottom-4">
          <div class="text-center mb-8">
            <div class="mb-6">
              <img src="/assets/logo_atsep.png" alt="EANA Logo" class="w-24 h-24 mx-auto object-contain" />
            </div>
            <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <lucide-icon [name]="Lock" [size]="32" class="text-blue-600"></lucide-icon>
            </div>
            <h1 class="text-3xl font-bold text-slate-800 mb-2">Nueva Contraseña</h1>
            <p class="text-slate-600">
              Ingresa tu nueva contraseña para restablecer el acceso a tu cuenta.
            </p>
          </div>

          <form [formGroup]="resetForm" (ngSubmit)="resetPassword()" class="space-y-4">
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-2">Nueva Contraseña</label>
              <div class="relative">
                <lucide-icon [name]="Lock" [size]="20" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></lucide-icon>
                <input 
                  [type]="showPassword ? 'text' : 'password'" 
                  formControlName="newPassword"
                  class="w-full pl-11 pr-12 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 bg-white"
                  placeholder="Mínimo 8 caracteres">
                <button 
                  type="button"
                  (click)="showPassword = !showPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <lucide-icon [name]="showPassword ? EyeOff : Eye" [size]="20"></lucide-icon>
                </button>
              </div>
              <p *ngIf="resetForm.get('newPassword')?.invalid && resetForm.get('newPassword')?.touched" 
                 class="text-red-600 text-sm mt-1">La contraseña debe tener al menos 8 caracteres</p>
            </div>

            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-2">Confirmar Contraseña</label>
              <div class="relative">
                <lucide-icon [name]="Lock" [size]="20" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></lucide-icon>
                <input 
                  [type]="showConfirmPassword ? 'text' : 'password'" 
                  formControlName="confirmPassword"
                  class="w-full pl-11 pr-12 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 bg-white"
                  placeholder="Repite la contraseña">
                <button 
                  type="button"
                  (click)="showConfirmPassword = !showConfirmPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <lucide-icon [name]="showConfirmPassword ? EyeOff : Eye" [size]="20"></lucide-icon>
                </button>
              </div>
              <p *ngIf="resetForm.errors?.['mismatch'] && resetForm.get('confirmPassword')?.touched" 
                 class="text-red-600 text-sm mt-1">Las contraseñas no coinciden</p>
            </div>

            <div *ngIf="errorMessage" class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm">
              {{ errorMessage }}
            </div>

            <button 
              type="submit"
              [disabled]="resetForm.invalid || loading"
              class="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl transition-colors font-semibold shadow-md">
              <lucide-icon *ngIf="!loading" [name]="Lock" [size]="20"></lucide-icon>
              <div *ngIf="loading" class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              {{ loading ? 'Actualizando...' : 'Restablecer Contraseña' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slide-in-from-bottom-4 {
      from { transform: translateY(1rem); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .animate-in {
      animation-duration: 0.3s;
      animation-fill-mode: both;
    }
    .fade-in { animation-name: fade-in; }
    .slide-in-from-bottom-4 { animation-name: slide-in-from-bottom-4; }
  `]
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  router = inject(Router);

  resetForm: FormGroup;
  loading = false;
  resetSuccess = false;
  tokenInvalid = false;
  errorMessage = '';
  showPassword = false;
  showConfirmPassword = false;
  token = '';

  readonly Lock = Lock;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;
  readonly CheckCircle = CheckCircle;
  readonly AlertCircle = AlertCircle;

  constructor() {
    this.resetForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.tokenInvalid = true;
    }
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  async resetPassword() {
    if (this.resetForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';

    try {
      await this.http.post('/api/v1/auth/reset-password', {
        token: this.token,
        newPassword: this.resetForm.value.newPassword
      }).toPromise();
      this.resetSuccess = true;
    } catch (error: any) {
      if (error.status === 400) {
        this.tokenInvalid = true;
      } else {
        this.errorMessage = error.error?.message || 'Error al restablecer la contraseña';
      }
    } finally {
      this.loading = false;
    }
  }
}
