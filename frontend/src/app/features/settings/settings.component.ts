import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SettingsService } from '../../core/services/settings.service';
import { ToastService } from '../../core/services/toast.service';
import { LucideAngularModule, Save, Clock, AlertTriangle } from 'lucide-angular';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
    templateUrl: './settings.component.html',
    styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
    private fb = inject(FormBuilder);
    private settingsService = inject(SettingsService);
    private toastService = inject(ToastService);

    form: FormGroup;
    loading = true;
    saving = false;

    readonly Save = Save;
    readonly Clock = Clock;
    readonly AlertTriangle = AlertTriangle;

    constructor() {
        this.form = this.fb.group({
            checklist_expiration_days: [30, [Validators.required, Validators.min(1)]]
        });
    }

    ngOnInit() {
        this.loadSettings();
    }

    loadSettings() {
        this.settingsService.getSettings().subscribe({
            next: (data: any) => {
                if (data.checklist_expiration_days) {
                    this.form.patchValue({
                        checklist_expiration_days: data.checklist_expiration_days
                    });
                }
                this.loading = false;
            },
            error: (err: any) => {
                console.error(err);
                this.loading = false;
            }
        });
    }

    onSubmit() {
        if (this.form.invalid) return;

        this.saving = true;
        this.settingsService.updateSettings('checklist_expiration_days', this.form.value.checklist_expiration_days).subscribe({
            next: () => {
                this.saving = false;
                this.toastService.success('Configuración guardada correctamente');
            },
            error: (err: any) => {
                console.error(err);
                this.saving = false;
                this.toastService.error('Error al guardar la configuración');
            }
        });
    }
}
