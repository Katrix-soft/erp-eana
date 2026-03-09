import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { LucideAngularModule, User, Mail, Shield, MapPin, LogOut, Lock, Eye, EyeOff, Save, X, Edit, Fingerprint, CheckCircle, Trash2 } from 'lucide-angular';

interface UserProfile {
  id: number;
  email: string;
  role: string;
  personal?: {
    nombre: string;
    apellido: string;
    sector?: string;
    aeropuerto?: { nombre: string };
    fir?: { nombre: string };
    puesto?: { nombre: string };
  };
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  user: UserProfile | null = null;
  loading = true;

  // Forms
  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  // UI State
  editingProfile = false;
  changingPassword = false;
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  // Messages
  successMessage = '';
  errorMessage = '';

  // Icons
  readonly Mail = Mail;
  readonly Shield = Shield;
  readonly MapPin = MapPin;
  readonly LogOut = LogOut;
  readonly Lock = Lock;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;
  readonly Save = Save;
  readonly X = X;
  readonly Edit = Edit;
  readonly User = User;
  readonly Fingerprint = Fingerprint;
  readonly CheckCircle = CheckCircle;
  readonly Trash2 = Trash2;

  // Biométrico
  hasPasskey = false;
  passkeyCount = 0;
  biometricLoading = false;
  biometricMessage = '';
  biometricError = '';
  biometricAvailable = false;

  ngOnInit() {
    this.initForms();
    this.loadInitialData();
    this.loadProfile();
    this.checkBiometricStatus();
  }

  initForms() {
    this.profileForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  loadInitialData() {
    const authUser = this.authService.userValue;
    if (authUser) {
      this.user = {
        id: authUser.id || 0,
        email: authUser.email || '',
        role: authUser.role,
        personal: authUser.context ? {
          nombre: authUser.context.nombre,
          apellido: authUser.context.apellido,
          sector: authUser.context.sector,
          aeropuerto: authUser.context.aeropuerto ? { nombre: authUser.context.aeropuerto } : undefined,
          puesto: authUser.context.puesto ? { nombre: authUser.context.puesto } : undefined
        } : undefined
      };

      this.profileForm.patchValue({
        nombre: this.user.personal?.nombre || '',
        apellido: this.user.personal?.apellido || '',
        email: this.user.email
      });

      this.loading = false; // Ya tenemos datos para mostrar
    }
  }

  loadProfile() {
    this.http.get<UserProfile>('/api/v1/auth/profile').subscribe({
      next: (user) => {
        this.user = user;
        this.profileForm.patchValue({
          nombre: this.user.personal?.nombre || '',
          apellido: this.user.personal?.apellido || '',
          email: this.user.email
        });
        this.loading = false;
      },
      error: (error) => {
        // Si ya cargamos datos iniciales, no mostramos error aquí
        if (!this.user) {
          this.errorMessage = 'Error al cargar el perfil';
          this.loading = false;
        }
      }
    });
  }

  toggleEditProfile() {
    this.editingProfile = !this.editingProfile;
    if (!this.editingProfile) {
      // Reset form if canceling
      this.profileForm.patchValue({
        nombre: this.user?.personal?.nombre || '',
        apellido: this.user?.personal?.apellido || '',
        email: this.user?.email || ''
      });
    }
    this.clearMessages();
  }

  saveProfile() {
    if (this.profileForm.invalid) return;

    this.http.put('/api/v1/auth/profile', this.profileForm.value).subscribe({
      next: () => {
        this.successMessage = 'Perfil actualizado correctamente';
        this.editingProfile = false;
        this.loadProfile();
        setTimeout(() => this.clearMessages(), 3000);
      },
      error: (error: any) => {
        this.errorMessage = error.error?.message || 'Error al actualizar el perfil';
        setTimeout(() => this.clearMessages(), 5000);
      }
    });
  }

  toggleChangePassword() {
    this.changingPassword = !this.changingPassword;
    if (!this.changingPassword) {
      this.passwordForm.reset();
    }
    this.clearMessages();
  }

  changePassword() {
    if (this.passwordForm.invalid) {
      this.errorMessage = 'Por favor completa todos los campos correctamente';
      return;
    }

    this.http.post('/api/v1/auth/change-password', this.passwordForm.value).subscribe({
      next: () => {
        this.successMessage = 'Contraseña actualizada correctamente';
        this.changingPassword = false;
        this.passwordForm.reset();
        setTimeout(() => this.clearMessages(), 3000);
      },
      error: (error: any) => {
        this.errorMessage = error.error?.message || 'Error al cambiar la contraseña';
        setTimeout(() => this.clearMessages(), 5000);
      }
    });
  }

  clearMessages() {
    this.successMessage = '';
    this.errorMessage = '';
  }

  logout() {
    this.authService.logout();
  }

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      'ADMIN': 'Administrador',
      'CNS_NACIONAL': 'CNS Nacional',
      'JEFE_COORDINADOR': 'Jefe Coordinador',
      'TECNICO': 'Técnico'
    };
    return labels[role] || role;
  }

  // ══════════════════════════════════════════
  // MéTODOS BIOMéTRICOS
  // ══════════════════════════════════════════

  private async checkBiometricStatus() {
    // Verificar soporte hardware
    if (window.PublicKeyCredential) {
      this.biometricAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }

    // Verificar si el usuario ya tiene registrado un passkey
    const userId = this.authService.userValue?.id;
    if (userId) {
      this.authService.checkPasskeyStatus(userId).subscribe({
        next: (res) => {
          this.hasPasskey = res.hasPasskey;
          this.passkeyCount = res.count;
        }
      });
    }
  }

  registerPasskey() {
    this.biometricLoading = true;
    this.biometricMessage = '';
    this.biometricError = '';

    this.authService.registerPasskey().subscribe({
      next: (res) => {
        this.biometricLoading = false;
        this.biometricMessage = res.message || 'Biométrico registrado exitosamente.';
        this.hasPasskey = true;
        this.passkeyCount++;
        setTimeout(() => this.biometricMessage = '', 5000);
      },
      error: (err) => {
        this.biometricLoading = false;
        if (err.name === 'NotAllowedError') {
          this.biometricError = 'Registro cancelado o tiempo agotado.';
        } else {
          this.biometricError = err.error?.message || 'Error al registrar el biométrico.';
        }
        setTimeout(() => this.biometricError = '', 5000);
      }
    });
  }

  removePasskeys() {
    if (!confirm('¿Está seguro que desea eliminar todos los dispositivos biométricos registrados?')) return;

    this.biometricLoading = true;
    this.authService.removePasskeys().subscribe({
      next: () => {
        this.biometricLoading = false;
        this.biometricMessage = 'Dispositivos biométricos eliminados correctamente.';
        this.hasPasskey = false;
        this.passkeyCount = 0;
        setTimeout(() => this.biometricMessage = '', 4000);
      },
      error: (err) => {
        this.biometricLoading = false;
        this.biometricError = err.error?.message || 'Error al eliminar los biométricos.';
        setTimeout(() => this.biometricError = '', 5000);
      }
    });
  }
}
