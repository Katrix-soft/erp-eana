import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule, Mail, Lock, ArrowLeft, CheckCircle } from 'lucide-angular';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <!-- Background Image Layer - CAMBIA LA URL AQUÍ PARA CAMBIAR EL FONDO -->
      <div class="absolute inset-0 z-0">
        <img src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop" 
             class="w-full h-full object-cover">
        <!-- Overlay oscuro para resaltar el formulario -->
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]"></div>
      </div>

      <div class="relative z-10 w-full max-w-md">
        
        <!-- Success State -->
        <div *ngIf="emailSent" class="bg-white rounded-2xl shadow-2xl p-8 text-center animate-in fade-in slide-in-from-bottom-4">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <lucide-icon [name]="CheckCircle" [size]="32" class="text-green-600"></lucide-icon>
          </div>
          <h2 class="text-2xl font-bold text-slate-800 mb-2">¡Email Enviado!</h2>
          <p class="text-slate-600 mb-6">
            Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.
          </p>
          <button 
            (click)="router.navigate(['/login'])"
            class="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-semibold">
            <lucide-icon [name]="ArrowLeft" [size]="20"></lucide-icon>
            Volver al Login
          </button>
        </div>

        <!-- Form State -->
        <div *ngIf="!emailSent" class="bg-white rounded-2xl shadow-2xl p-8 animate-in fade-in slide-in-from-bottom-4">
          <div class="text-center mb-8">
            <div class="mb-6">
              <img src="/assets/logo_atsep.png" alt="EANA Logo" class="w-24 h-24 mx-auto object-contain" />
            </div>
            <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <lucide-icon [name]="Lock" [size]="32" class="text-blue-600"></lucide-icon>
            </div>
            <h1 class="text-3xl font-bold text-slate-800 mb-2">¿Olvidaste tu contraseña?</h1>
            <p class="text-slate-600">
              Ingresa tu usuario o email y te enviaremos un enlace para restablecerla.
            </p>
          </div>

          <form [formGroup]="forgotForm" (ngSubmit)="sendResetEmail()" class="space-y-4">
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-2">Usuario o Email</label>
              <div class="relative">
                <lucide-icon [name]="Mail" [size]="20" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></lucide-icon>
                <input 
                  type="text" 
                  formControlName="email"
                  class="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 bg-white"
                  placeholder="ej: asanchez o asanchez@eana.com.ar">
              </div>
              <p *ngIf="forgotForm.get('email')?.invalid && forgotForm.get('email')?.touched" 
                 class="text-red-600 text-sm mt-1">Este campo es requerido</p>
            </div>

            <div *ngIf="errorMessage" class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm">
              {{ errorMessage }}
            </div>

            <button 
              type="submit"
              [disabled]="forgotForm.invalid || loading"
              class="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl transition-colors font-semibold shadow-md">
              <lucide-icon *ngIf="!loading" [name]="Mail" [size]="20"></lucide-icon>
              <div *ngIf="loading" class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              {{ loading ? 'Enviando...' : 'Enviar Enlace' }}
            </button>

            <button 
              type="button"
              (click)="router.navigate(['/login'])"
              class="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors font-semibold">
              <lucide-icon [name]="ArrowLeft" [size]="20"></lucide-icon>
              Volver al Login
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
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  router = inject(Router);

  forgotForm: FormGroup;
  loading = false;
  emailSent = false;
  errorMessage = '';

  readonly Mail = Mail;
  readonly Lock = Lock;
  readonly ArrowLeft = ArrowLeft;
  readonly CheckCircle = CheckCircle;

  constructor() {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required]]
    });
  }

  async sendResetEmail() {
    if (this.forgotForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';

    try {
      await this.http.post('/api/v1/auth/forgot-password', this.forgotForm.value).toPromise();
      this.emailSent = true;
    } catch (error: any) {
      this.errorMessage = error.error?.message || 'Error al enviar el email';
    } finally {
      this.loading = false;
    }
  }
}
