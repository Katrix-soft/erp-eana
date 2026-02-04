import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LucideAngularModule, Save, ArrowLeft, Printer, CheckCircle, Edit, ChevronDown, AlertTriangle } from 'lucide-angular';
import { ChecklistService } from '../../../core/services/checklist.service';
import { AuthService } from '../../../core/services/auth.service';
import { EquipmentService } from '../../../core/services/equipment.service';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ChecklistSteps } from '../../../shared/components/checklist-steps/checklist-steps';

@Component({
    selector: 'app-checklist-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, LucideAngularModule, ModalComponent, ChecklistSteps],
    templateUrl: './checklist-form.component.html',
    styleUrls: ['./checklist-form.component.css']
})
export class ChecklistFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private route = inject(ActivatedRoute);
    public router = inject(Router);
    private checklistService = inject(ChecklistService);
    private authService = inject(AuthService);
    private equipmentService = inject(EquipmentService);

    form!: FormGroup;
    loading = signal(false);
    mode = signal<'create' | 'edit' | 'view'>('create');
    id = signal<string | null>(null);
    showSuccessModal = signal(false);

    users = signal<any[]>([]);
    localUsers = signal<any[]>([]);
    regionalUsers = signal<any[]>([]);

    user = this.authService.user;
    isView = computed(() => this.mode() === 'view');

    readonly icons = { Save, ArrowLeft, Printer, CheckCircle, Edit, ChevronDown, AlertTriangle };
    now = new Date();

    mainItems = [
        { label: 'Verificar conmutación de equipos principal /duplicado, control local / remoto - telemetría / RCMS del equipamiento.', name: 'conmutacion', type: 'check' },
        { label: 'Verificar estado general de cargador y baterías.', name: 'estado_baterias', type: 'check' },
        { label: 'Verificación Sistema Irradiante VHF/UHF (Estado general / Limpieza).', name: 'sistema_irradiante', type: 'check' },
        { label: 'Verificar cableado, conectores y protectores gaseosos de RF.', name: 'cableado_rf', type: 'check' },
        { label: 'Verificar balizamiento nocturno (baliza, fotocélula / timer).', name: 'balizamiento', type: 'check' },
        { label: 'Verificar switch/s.', name: 'switch_ethernet', type: 'check' },
        { label: 'Verificar cabeza de control y micrófono dinámico (funcionamiento, conexionado)', name: 'cabeza_control', type: 'check' },
        { label: 'Verificar funcionamiento de equipo EM100 - Medición del espectro radioeléctrico', name: 'em100', type: 'check' },
        { label: 'Limpieza del equipamiento externo e interno en general.', name: 'limpieza', type: 'check' },
        { label: 'Verificar tablero eléctrico general.', name: 'tablero_electrico', type: 'check' },
        { label: 'Descargar, documentar reporte digital de curvas y parámetros de funcionamiento', name: 'reporte_digital', type: 'check' },
    ];

    ngOnInit() {
        this.initForm();
        this.route.paramMap.subscribe(params => {
            const idParam = params.get('id');
            this.id.set(idParam);

            if (idParam) {
                this.mode.set(this.route.snapshot.data['mode'] || 'view');
                this.loadChecklist();
            } else {
                this.mode.set('create');
                this.setDefaults();
            }
        });

        this.loadUsers();
    }

    initForm() {
        const controls: any = {
            estacion: ['', Validators.required],
            fecha: [new Date().toISOString().split('T')[0], Validators.required],
            folio: ['060'],
            v_rectificador: ['27,1 v'],
            v_1hora: ['24,3 v'],
            modulacion: [''],
            modulacion_obs: ['#1: 92% EQUIPO #2: 90%'],
            roe_local: ['1.3'],
            roe_externo: ['1.4'],
            potencia_local: ['17'],
            potencia_externo: ['20'],
            piso_ruido: [''],
            piso_ruido_obs: ['#1: 112db / #2: 108db'],
            squelch: [''],
            squelch_obs: ['#1: 120db / #2: 120db'],
            puesta_tierra: [''],
            dias_sin_alternancia: ['20424 dias'],
            al_aire: [false],
            estado_operativo: [''],
            sistema_energia: ['SI'],
            firmaTecnico: [''],
            fechaFirmaTecnico: [''],
            firmaCoordinador: [''],
            fechaFirmaCoordinador: [''],
            firma_digital_local: [''],
            firma_digital_regional: [''],
            tecnicoId: [null],
            equipoId: [null],
            aeropuertoId: [null],
            estado: ['OPERATIVO'],
            observaciones: ['']
        };

        this.mainItems.forEach(item => {
            controls[item.name] = ['SI'];
            controls[`${item.name}_obs`] = [''];
        });

        this.form = this.fb.group(controls);
    }

    setDefaults() {
        const station = this.route.snapshot.queryParamMap.get('station');
        const vhfId = this.route.snapshot.queryParamMap.get('vhfId');

        if (station) {
            this.form.patchValue({ estacion: station });
        }
        if (vhfId) {
            const idValue = parseInt(vhfId);
            this.form.patchValue({ equipoId: idValue });

            this.equipmentService.getEquipmentById(idValue).subscribe({
                next: (equipo) => {
                    if (equipo) {
                        this.form.patchValue({
                            aeropuertoId: equipo.vhf?.aeropuertoId || equipo.aeropuertoId,
                            estacion: equipo.vhf?.sitio || equipo.vhf?.aeropuerto || equipo.sitio || this.form.get('estacion')?.value
                        });
                        this.filterUsersForStation(equipo);
                    }
                }
            });
        }
    }

    loadUsers() {
        // Usar el valor del signal de authService
        if (this.authService.user()) {
            this.equipmentService.getUsers().subscribe(usersData => {
                const mappedUsers = usersData.map(u => ({
                    ...u,
                    nombre: u.personal?.nombre || '',
                    apellido: u.personal?.apellido || u.email,
                    aeropuertoCodigo: u.personal?.aeropuerto?.codigo,
                    firNombre: u.personal?.fir?.nombre,
                    personal: u.personal
                }));
                this.users.set(mappedUsers);

                const station = this.form.get('estacion')?.value || this.route.snapshot.queryParamMap.get('station');
                if (station) {
                    this.filterUsersForStation({ estacion: station });
                }
            });
        }
    }

    loadChecklist() {
        if (!this.id()) return;
        this.loading.set(true);
        this.checklistService.getChecklist(this.id()!).subscribe({
            next: (data) => {
                const { fecha, ...rest } = data;
                this.form.patchValue({
                    ...rest,
                    fecha: fecha ? fecha.split('T')[0] : ''
                });

                this.filterUsersForStation(data);

                if (this.isView()) {
                    this.form.disable();
                }
                this.loading.set(false);
            },
            error: (err) => {
                console.error(err);
                this.loading.set(false);
                this.router.navigate(['/checklists']);
            }
        });
    }

    private filterUsersForStation(checklist: any) {
        const allUsers = this.users();
        if (!allUsers.length) return;

        const stationAero = checklist.aeropuerto?.codigo || checklist.equipo?.vhf?.aeropuerto || '';
        const stationFir = checklist.aeropuerto?.fir?.nombre || checklist.equipo?.vhf?.fir || '';

        const locals = allUsers.filter(u =>
            u.aeropuertoCodigo === stationAero ||
            (u.personal?.aeropuerto?.nombre && checklist.estacion.toUpperCase().includes(u.personal.aeropuerto.nombre.toUpperCase()))
        );
        this.localUsers.set(locals.length ? locals : allUsers);

        const regionals = allUsers.filter(u =>
            u.firNombre === stationFir ||
            ['DOZ', 'MENDOZA'].includes(u.firNombre?.toUpperCase()) ||
            ['DOZ', 'MENDOZA'].includes(u.personal?.fir?.nombre?.toUpperCase())
        );
        this.regionalUsers.set(regionals.length ? regionals : allUsers);
    }

    onSubmit() {
        if (this.form.invalid) return;

        this.loading.set(true);
        const formData = this.form.getRawValue();
        const payload = {
            ...formData,
            fecha: new Date(formData.fecha).toISOString()
        };

        const userVal = this.authService.userValue;

        if (userVal) {
            if (!payload.tecnicoId) {
                payload.tecnicoId = userVal.context?.id || userVal.id;
            }

            if (userVal.role === 'TECNICO' && !payload.firmaTecnico) {
                const signerName = userVal.context?.nombre && userVal.context?.apellido
                    ? `${userVal.context.nombre} ${userVal.context.apellido}`
                    : userVal.email;
                payload.firmaTecnico = signerName;
                payload.fechaFirmaTecnico = new Date().toISOString();
            }
        }

        const request = (this.mode() === 'edit' && this.id())
            ? this.checklistService.updateChecklist(this.id()!, payload)
            : this.checklistService.postChecklist(payload);

        request.subscribe({
            next: () => {
                this.showSuccessModal.set(true);
                this.loading.set(false);
            },
            error: (err) => {
                console.error(err);
                this.loading.set(false);
            }
        });
    }

    handleSign(role: 'TECNICO' | 'COORDINADOR' | 'REGIONAL' | 'LOCAL', name: string) {
        const nowStr = new Date().toISOString();
        if (role === 'TECNICO') {
            this.form.patchValue({ firmaTecnico: name, fechaFirmaTecnico: nowStr });
        } else if (role === 'COORDINADOR') {
            this.form.patchValue({ firmaCoordinador: name, fechaFirmaCoordinador: nowStr });
        } else if (role === 'LOCAL') {
            this.form.patchValue({ firma_digital_local: name });
        } else if (role === 'REGIONAL') {
            this.form.patchValue({ firma_digital_regional: name });
        }
    }

    handleSuccessClose() {
        this.showSuccessModal.set(false);
        this.router.navigate(['/checklists']);
    }

    print() {
        window.print();
    }
}
