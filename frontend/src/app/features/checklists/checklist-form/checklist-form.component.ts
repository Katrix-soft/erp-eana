import { Component, inject, OnInit } from '@angular/core';
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
    loading = false;
    mode: 'create' | 'edit' | 'view' = 'create';
    id: string | null = null;
    showSuccessModal = false;
    users: any[] = [];
    localUsers: any[] = [];
    regionalUsers: any[] = [];
    user$ = this.authService.user$;

    readonly Save = Save;
    readonly ArrowLeft = ArrowLeft;
    readonly Printer = Printer;
    readonly CheckCircle = CheckCircle;
    readonly Edit = Edit;
    readonly ChevronDown = ChevronDown;
    readonly AlertTriangle = AlertTriangle;
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
            this.id = params.get('id');
            if (this.id) {
                this.mode = this.route.snapshot.data['mode'] || 'view';
                this.loadChecklist();
            } else {
                this.mode = 'create';
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
            // New fields for modern checklist steps
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
            const id = parseInt(vhfId);
            this.form.patchValue({ equipoId: id });

            // Cargar info del equipo para vincularlo correctamente
            this.equipmentService.getEquipmentById(id).subscribe({
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
        this.authService.user$.subscribe(user => {
            if (user) {
                this.equipmentService.getUsers().subscribe(users => {
                    this.users = users.map(u => ({
                        ...u,
                        nombre: u.personal?.nombre || '',
                        apellido: u.personal?.apellido || u.email,
                        aeropuertoCodigo: u.personal?.aeropuerto?.codigo,
                        firNombre: u.personal?.fir?.nombre,
                        personal: u.personal
                    }));

                    // Si ya tenemos parámetros de estación o un checklist cargado, filtramos
                    const station = this.form.get('estacion')?.value || this.route.snapshot.queryParamMap.get('station');
                    if (station) {
                        this.filterUsersForStation({ estacion: station });
                    }
                });
            }
        });
    }

    loadChecklist() {
        if (!this.id) return;
        this.loading = true;
        this.checklistService.getChecklist(this.id).subscribe({
            next: (data) => {
                const { fecha, ...rest } = data;
                this.form.patchValue({
                    ...rest,
                    fecha: fecha ? fecha.split('T')[0] : ''
                });

                // Una vez cargado el checklist, filtrat los usuarios según la ubicación del equipo
                this.filterUsersForStation(data);

                if (this.mode === 'view') {
                    this.form.disable();
                }
                this.loading = false;
            },
            error: (err) => {
                console.error(err);
                this.loading = false;
                this.router.navigate(['/checklists']);
            }
        });
    }

    private filterUsersForStation(checklist: any) {
        if (!this.users.length) return;

        // Extraer aeródromo y FIR del equipo/estación
        const stationAero = checklist.aeropuerto?.codigo || checklist.equipo?.vhf?.aeropuerto || '';
        const stationFir = checklist.aeropuerto?.fir?.nombre || checklist.equipo?.vhf?.fir || '';

        // TÉCNICOS LOCALES: Los asignados a este aeropuerto específico
        this.localUsers = this.users.filter(u =>
            u.aeropuertoCodigo === stationAero ||
            (u.personal?.aeropuerto?.nombre && checklist.estacion.toUpperCase().includes(u.personal.aeropuerto.nombre.toUpperCase()))
        );

        // TÉCNICOS REGIONALES: Los del centro regional (Mendoza/DOZ)
        this.regionalUsers = this.users.filter(u =>
            u.firNombre === stationFir ||
            ['DOZ', 'MENDOZA'].includes(u.firNombre?.toUpperCase()) ||
            ['DOZ', 'MENDOZA'].includes(u.personal?.fir?.nombre?.toUpperCase())
        );

        // Fallback: Si no hay específicos, mostrar todos para no bloquear el proceso
        if (this.localUsers.length === 0) this.localUsers = this.users;
        if (this.regionalUsers.length === 0) this.regionalUsers = this.users;
    }

    onSubmit() {
        if (this.form.invalid) return;

        this.loading = true;
        const formData = this.form.getRawValue();
        const payload = {
            ...formData,
            fecha: new Date(formData.fecha).toISOString()
        };

        const user = this.authService.userValue;

        // Auto-fill metadata if missing
        if (user) {
            // Asignar el ID del técnico desde el contexto del usuario logueado
            if (!payload.tecnicoId) {
                payload.tecnicoId = user.context?.id || user.id;
            }

            if (user.role === 'TECNICO' && !payload.firmaTecnico) {
                const signerName = user.context?.nombre && user.context?.apellido
                    ? `${user.context.nombre} ${user.context.apellido}`
                    : user.email;
                payload.firmaTecnico = signerName;
                payload.fechaFirmaTecnico = new Date().toISOString();
            }
        }

        const request = (this.mode === 'edit' && this.id)
            ? this.checklistService.updateChecklist(this.id, payload)
            : this.checklistService.postChecklist(payload);

        request.subscribe({
            next: () => {
                this.showSuccessModal = true;
                this.loading = false;
            },
            error: (err) => {
                console.error(err);
                this.loading = false;
            }
        });
    }

    handleSign(role: 'TECNICO' | 'COORDINADOR' | 'REGIONAL' | 'LOCAL', name: string) {
        const now = new Date().toISOString();
        if (role === 'TECNICO') {
            this.form.patchValue({ firmaTecnico: name, fechaFirmaTecnico: now });
        } else if (role === 'COORDINADOR') {
            this.form.patchValue({ firmaCoordinador: name, fechaFirmaCoordinador: now });
        } else if (role === 'LOCAL') {
            this.form.patchValue({ firma_digital_local: name });
        } else if (role === 'REGIONAL') {
            this.form.patchValue({ firma_digital_regional: name });
        }
    }

    handleSuccessClose() {
        this.showSuccessModal = false;
        this.router.navigate(['/checklists']);
    }

    print() {
        window.print();
    }

    get isView() { return this.mode === 'view'; }
}
