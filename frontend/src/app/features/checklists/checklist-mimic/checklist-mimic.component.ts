import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, ArrowLeft, Power, AlertTriangle, CheckCircle, Activity, Server, ShieldAlert, Edit, AlertCircle, XCircle, Printer, Plus } from 'lucide-angular';
import { firstValueFrom } from 'rxjs';
import { ChecklistSteps } from '../../../shared/components/checklist-steps/checklist-steps';

interface ChecklistData {
    id: number;
    estacion: string;
    fecha: string;
    estado: 'OPERATIVO' | 'PRECAUCION' | 'FALLA';
    firmaTecnico: string;
    firmaLocal?: string;
    firmaRegional?: string;
    observaciones: string;
    tableroElectrico: 'cumple' | 'no_cumple' | 'SI' | 'NO';
    limpieza: 'cumple' | 'no_cumple' | 'SI' | 'NO';
    alAire: boolean;
    sistemaIrradiante: 'cumple' | 'no_cumple' | 'SI' | 'NO';
    cableadoRf: 'cumple' | 'no_cumple' | 'SI' | 'NO';
    balizamiento: 'cumple' | 'no_cumple' | 'SI' | 'NO';
    cabezaControl: 'cumple' | 'no_cumple' | 'SI' | 'NO';
    switchEthernet?: 'cumple' | 'no_cumple' | 'SI' | 'NO';
    estadoBaterias?: 'cumple' | 'no_cumple' | 'SI' | 'NO';
    comunicacionesId?: number;
    aeropuerto?: {
        codigo: string;
        nombre: string;
        fir?: {
            nombre: string;
        }
    };
    equipo?: any;
    equipoRole?: 'EQUIPO 1' | 'EQUIPO 2';
    partner?: any;
    partnerStatus?: string;
    partnerStatusClass?: string;

    // Technical Measurements
    vRectificador?: string;
    v1hora?: string;
    modulacion?: string;
    modulacionObs?: string;
    roeLocal?: string;
    roeExterno?: string;
    potenciaLocal?: string;
    potenciaExterno?: string;
    pisoRuido?: string;
    pisoRuidoObs?: string;
    squelch?: string;
    squelchObs?: string;
    puestaTierra?: string;
    puestaTierraObs?: string;
    diasSinAlternancia?: string;
}

@Component({
    selector: 'app-checklist-mimic',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, ChecklistSteps],
    templateUrl: './checklist-mimic.component.html',
    styles: [`
        :host {
            display: block;
            min-height: 100vh;
            background-color: rgb(2 6 23);
            color: rgb(226 232 240);
            font-family: 'Courier New', monospace;
        }

        @media print {
            :host {
                display: block !important;
                background: white !important;
                padding: 0 !important;
                min-height: auto !important;
            }

            body {
                background: white !important;
                color: black !important;
                padding: 0 !important;
                margin: 0 !important;
            }

            .print\:hidden {
                display: none !important;
            }

            .print\:block {
                display: block !important;
            }

            table {
                border-collapse: collapse !important;
                width: 100% !important;
            }

            th, td {
                border: 1px solid black !important;
            }

            .font-script {
                font-family: 'Homemade Apple', cursive;
            }
        }
    `]
})
export class ChecklistMimicComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private http = inject(HttpClient);
    private cdr = inject(ChangeDetectorRef);
    private toastService = inject(ToastService);
    private fb = inject(FormBuilder);

    readonly ArrowLeft = ArrowLeft;
    readonly Power = Power;
    readonly AlertTriangle = AlertTriangle;
    readonly CheckCircle = CheckCircle;
    readonly Activity = Activity;
    readonly Server = Server;
    readonly ShieldAlert = ShieldAlert;
    readonly Edit = Edit;
    readonly AlertCircle = AlertCircle;
    readonly XCircle = XCircle;
    readonly Printer = Printer;
    readonly Plus = Plus;

    checklist: ChecklistData | null = null;
    loading = true;
    isEditing = false;
    showPartnerActions = false;

    // Auth context
    currentUser: any = null;
    userRoleInStation: 'local' | 'regional' | 'none' = 'none';

    form!: FormGroup;

    fieldLabels: Record<string, string> = {
        tableroElectrico: 'Tablero Eléctrico',
        limpieza: 'Limpieza General',
        sistemaIrradiante: 'Sistema Irradiante',
        cableadoRf: 'Cableado y Conectores',
        balizamiento: 'Balizamiento Nocturno',
        cabezaControl: 'Cabeza de Control',
        switchEthernet: 'Switch Ethernet',
        estadoBaterias: 'Sistema de Energía'
    };

    ngOnInit() {
        this.initForm();
        this.currentUser = this.authService.userValue;
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.loadChecklist(id);
        }
    }

    initForm() {
        this.form = this.fb.group({
            tablero_electrico: ['SI'],
            limpieza: ['SI'],
            al_aire: [true],
            sistema_irradiante: ['SI'],
            cableado_rf: ['SI'],
            balizamiento: ['SI'],
            cabeza_control: ['SI'],
            switch_ethernet: ['SI'],
            sistema_energia: ['SI'],
            estado_operativo: [''],
            observaciones: ['']
        });

        // Logica de calculo automatico de estado
        this.form.valueChanges.subscribe(val => {
            const fields = [
                'tablero_electrico', 'limpieza', 'sistema_irradiante',
                'cableado_rf', 'balizamiento', 'cabeza_control',
                'switch_ethernet', 'sistema_energia'
            ];

            const total = fields.length;
            const passing = fields.filter(f => val[f] === 'SI').length;
            const percentage = passing / total;

            // Calculo de porcentaje solo para referencia o logging, pero NO forzar estado
            // El usuario debe tener control total del estado final (OPERATIVO/PRECAUCION/FALLA)
            // independientemente de los items individuales.

            /* Lógica eliminada para evitar bloqueo de UI
            if (percentage >= 0.8) {
                if (val.estado_operativo !== 'OPERATIVO') {
                    this.form.patchValue(
                        { estado_operativo: 'OPERATIVO' },
                        { emitEvent: false }
                    );
                    if (this.checklist) this.checklist.estado = 'OPERATIVO';
                }
            }
            */
        });
    }

    async loadChecklist(id: string) {
        console.log('🚀 loadChecklist INICIADO para ID:', id);
        this.loading = true;
        this.cdr.detectChanges();

        try {
            console.log('📡 Realizando petición HTTP para el checklist...');
            const response = await firstValueFrom(this.http.get<any>(`/api/v1/checklists/${id}`));
            console.log('📥 Datos recibidos:', response);

            if (!response) {
                throw new Error('Respuesta del servidor vacía');
            }

            // Mapeo defensivo de campos (soporta camelCase y snake_case del backend)
            this.checklist = {
                id: response.id || parseInt(id),
                estacion: response.estacion || 'Mendoza - DOZ',
                fecha: response.fecha || new Date().toISOString(),
                estado: (response.estado || 'OPERATIVO') as any,
                firmaTecnico: response.firmaTecnico || response.firma_tecnico || '',
                firmaLocal: response.firmaLocal || response.firma_local || '',
                firmaRegional: response.firmaRegional || response.firma_regional || '',
                observaciones: response.observaciones || '',
                tableroElectrico: (response.tableroElectrico || response.tablero_electrico || 'cumple') as any,
                limpieza: (response.limpieza || response.limpieza_general || 'cumple') as any,
                alAire: response.alAire !== undefined ? response.alAire : (response.al_aire !== undefined ? response.al_aire : true),
                sistemaIrradiante: (response.sistemaIrradiante || response.sistema_irradiante || 'cumple') as any,
                cableadoRf: (response.cableadoRf || response.cableado_rf || response.cableado || 'cumple') as any,
                balizamiento: (response.balizamiento || 'cumple') as any,
                cabezaControl: (response.cabezaControl || response.cabeza_control || 'cumple') as any,
                switchEthernet: (response.switchEthernet || response.switch_ethernet || 'cumple') as any,
                estadoBaterias: (response.estadoBaterias || response.estado_baterias || 'cumple') as any,
                comunicacionesId: response.comunicacionesId || response.equipoId,
                equipo: response.equipo,
                partner: null as any,
                // Technical Measurements Mapping
                vRectificador: response.vRectificador || response.v_rectificador || '27,1 v',
                v1hora: response.v1hora || response.v_1hora || '24,3 v',
                modulacion: response.modulacion || '',
                modulacionObs: response.modulacionObs || response.modulacion_obs || '',
                roeLocal: response.roeLocal || response.roe_local || '',
                roeExterno: response.roeExterno || response.roe_externo || '',
                potenciaLocal: response.potenciaLocal || response.potencia_local || '',
                potenciaExterno: response.potenciaExterno || response.potencia_externo || '',
                pisoRuido: response.pisoRuido || response.piso_ruido || '',
                pisoRuidoObs: response.pisoRuidoObs || response.piso_ruido_obs || '',
                squelch: response.squelch || '',
                squelchObs: response.squelchObs || response.squelch_obs || '',
                puestaTierra: response.puestaTierra || response.puesta_tierra || '',
                puestaTierraObs: response.puestaTierraObs || response.puesta_tierra_obs || '',
                diasSinAlternancia: response.diasSinAlternancia || response.dias_sin_alternancia || ''
            };

            // Intentar detectar par/rol si hay equipo
            if (this.checklist.equipo && this.checklist.equipo.vhfId) {
                const freq = this.checklist.equipo.frecuencias?.[0]?.frecuencia;
                if (freq) {
                    // Buscar hermanos para determinar rol y estado del par
                    const siblings = await firstValueFrom(
                        this.http.get<any[]>(`/api/v1/vhf-equipos?aeropuerto=${this.checklist.equipo.vhf.aeropuerto}`)
                    );

                    const pair = siblings.filter(s =>
                        s.frecuencia === freq &&
                        s.vhfId === this.checklist?.equipo?.vhfId
                    ).sort((a, b) => a.id - b.id);

                    if (pair.length > 1) {
                        const index = pair.findIndex(p => p.id === this.checklist?.equipo?.id);
                        this.checklist.equipoRole = index === 0 ? 'EQUIPO 1' : 'EQUIPO 2';

                        const partner = pair.find(p => p.id !== this.checklist?.equipo?.id);
                        if (partner) {
                            (this.checklist as any).partner = partner;
                            const pStatus = partner.estado || 'OK';
                            this.checklist.partnerStatus = pStatus === 'OK' ? 'OPERATIVO' : (pStatus === 'NOVEDAD' ? 'CON NOVEDAD' : 'FALLA');
                            this.checklist.partnerStatusClass = pStatus === 'OK' ? 'text-emerald-400' : (pStatus === 'NOVEDAD' ? 'text-amber-400' : 'text-red-400');
                        }
                    } else {
                        this.checklist.equipoRole = 'EQUIPO 1';
                    }
                }
            }

            console.log('🎯 Checklist mapeado con éxito:', this.checklist);
            this.determineUserRole();
            this.updateFormData();
        } catch (error: any) {
            console.error('❌ Error en loadChecklist:', error);
            if (error.status === 404) {
                console.warn('⚠️ Checklist no encontrado, creando objeto local nuevo');
                this.checklist = {
                    id: parseInt(id),
                    estacion: 'Nueva Estación',
                    fecha: new Date().toISOString(),
                    estado: 'OPERATIVO',
                    firmaTecnico: '',
                    observaciones: '',
                    tableroElectrico: 'cumple',
                    limpieza: 'cumple',
                    alAire: true,
                    sistemaIrradiante: 'cumple',
                    cableadoRf: 'cumple',
                    balizamiento: 'cumple',
                    cabezaControl: 'cumple'
                };
                this.updateFormData();
                this.isEditing = true;
            } else {
                this.toastService.error(`No se pudo cargar el reporte ${id}.`);
            }
        } finally {
            // Usamos setTimeout para asegurar que la actualización de loading ocurra después de que los datos estén listos
            setTimeout(() => {
                this.loading = false;
                this.cdr.detectChanges();
                console.log('✨ Carga finalizada satisfactoriamente. Loading:', this.loading);
            }, 50);
        }
    }

    updateFormData() {
        if (this.checklist && !this.isEditing) {
            this.form.patchValue({
                estado_operativo: this.checklist.estado || '',
                observaciones: this.checklist.observaciones || '',
                tablero_electrico: this.mapToForm(this.checklist.tableroElectrico),
                limpieza: this.mapToForm(this.checklist.limpieza),
                al_aire: this.checklist.alAire !== undefined ? this.checklist.alAire : true,
                sistema_irradiante: this.mapToForm(this.checklist.sistemaIrradiante),
                cableado_rf: this.mapToForm(this.checklist.cableadoRf),
                balizamiento: this.mapToForm(this.checklist.balizamiento),
                cabeza_control: this.mapToForm(this.checklist.cabezaControl),
                switch_ethernet: this.mapToForm(this.checklist.switchEthernet || 'cumple'),
                sistema_energia: this.mapToForm(this.checklist.estadoBaterias || 'cumple'),
                // Note: Firma local/regional handled by signAs() but stored in checklist object
            });
        }
    }

    mapToForm(val: string): string {
        return val === 'cumple' || val === 'SI' ? 'SI' : 'NO';
    }

    mapToApi(val: string): 'cumple' | 'no_cumple' {
        return val === 'SI' ? 'cumple' : 'no_cumple';
    }

    handleStatusChange(newStatus: 'OPERATIVO' | 'PRECAUCION' | 'FALLA') {
        if (!this.isEditing || !this.checklist) return;
        this.form.patchValue({ estado_operativo: newStatus });
        this.checklist.estado = newStatus;
    }

    async handlePartnerStatusChange(newStatus: 'OPERATIVO' | 'PRECAUCION' | 'FALLA') {
        const partner = (this.checklist as any)?.partner;
        if (!partner) return;

        let equipoEstado: 'OK' | 'NOVEDAD' | 'FUERA_SERVICIO' = 'OK';
        if (newStatus === 'FALLA') equipoEstado = 'FUERA_SERVICIO';
        else if (newStatus === 'PRECAUCION') equipoEstado = 'NOVEDAD';

        try {
            await firstValueFrom(
                this.http.patch(`/api/v1/vhf-equipos/${partner.id}`, { estado: equipoEstado })
            );

            // Actualizar vista local
            this.checklist!.partnerStatus = newStatus;
            this.checklist!.partnerStatusClass = newStatus === 'OPERATIVO' ? 'text-emerald-400' : (newStatus === 'PRECAUCION' ? 'text-amber-400' : 'text-red-400');

            this.toastService.success(`Estado del ${this.checklist?.equipoRole === 'EQUIPO 1' ? 'Equipo 2' : 'Equipo 1'} acualizado.`);
        } catch (e) {
            this.toastService.error('Error al actualizar equipo de respaldo');
        }
    }

    async handleSave() {
        if (!this.checklist) return;

        try {
            const formVal = this.form.value;
            const dataToSend: any = {
                observaciones: formVal.observaciones,
                estado: formVal.estado_operativo || this.checklist.estado,
                alAire: formVal.al_aire,
                tableroElectrico: this.mapToApi(formVal.tablero_electrico),
                limpieza: this.mapToApi(formVal.limpieza),
                sistemaIrradiante: this.mapToApi(formVal.sistema_irradiante),
                cableadoRf: this.mapToApi(formVal.cableado_rf),
                balizamiento: this.mapToApi(formVal.balizamiento),
                cabezaControl: this.mapToApi(formVal.cabeza_control),
                switchEthernet: this.mapToApi(formVal.switch_ethernet),
                estadoBaterias: this.mapToApi(formVal.sistema_energia),
            };

            const updated = await firstValueFrom(
                this.http.patch<ChecklistData>(
                    `/api/v1/checklists/${this.checklist.id}`,
                    dataToSend
                )
            );

            this.checklist = updated!;
            this.isEditing = false;
            this.toastService.success('El checklist ha sido guardado exitosamente.');
        } catch (error) {
            console.error('Error saving checklist:', error);
            this.toastService.error('Ocurrió un error al intentar guardar los cambios.');
        }
    }


    getStatusColor(status: string): string {
        switch (status) {
            case 'OPERATIVO': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
            case 'PRECAUCION': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
            case 'FALLA': return 'text-red-500 bg-red-500/10 border-red-500/20';
            default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
        }
    }

    getStatusGradient(status: string): string {
        switch (status) {
            case 'OPERATIVO': return 'from-emerald-500 to-emerald-600';
            case 'PRECAUCION': return 'from-amber-500 to-amber-600';
            case 'FALLA': return 'from-red-500 to-red-600';
            default: return 'from-slate-500 to-slate-600';
        }
    }

    getFailures(): [string, any][] {
        if (!this.checklist) return [];

        // If editing, read from Form to give live feedback
        if (this.isEditing && this.form) {
            const formVal = this.form.value;
            const failures: [string, any][] = [];

            // Map Form Keys (snake_case) to Label Keys (camelCase)
            const map: Record<string, string> = {
                'tablero_electrico': 'tableroElectrico',
                'limpieza': 'limpieza',
                'sistema_irradiante': 'sistemaIrradiante',
                'cableado_rf': 'cableadoRf',
                'balizamiento': 'balizamiento',
                'cabeza_control': 'cabezaControl',
                'switch_ethernet': 'switchEthernet',
                'sistema_energia': 'estadoBaterias'
            };

            Object.keys(map).forEach(formKey => {
                if (formVal[formKey] === 'NO') {
                    failures.push([map[formKey], 'no_cumple']);
                }
            });
            return failures;
        }

        // View Mode: Read from Object
        return Object.entries(this.checklist).filter(([key, value]) =>
            Object.keys(this.fieldLabels).includes(key) && value === 'no_cumple'
        );
    }

    private authService = inject(AuthService);

    goBack() {
        const user = this.authService.userValue as any;
        const isGlobalAdmin = user?.role === 'ADMIN';

        // Priorizar el contexto del usuario (donde está asignado realmente)
        // Solo los ADMIN globales pueden navegar libremente sin ser forzados a un contexto
        if (user?.context?.aeropuertoCodigo && !isGlobalAdmin) {
            this.router.navigate(['/comunicaciones'], {
                queryParams: {
                    aeropuerto: user.context.aeropuertoCodigo,
                    fir: user.context.fir
                }
            });
            return;
        }

        // Si es de REGIONAL (Mendoza) pero no tiene aeropuerto fijo
        if (user?.context?.fir && !isGlobalAdmin) {
            this.router.navigate(['/comunicaciones'], {
                queryParams: {
                    fir: user.context.fir
                }
            });
            return;
        }

        // Fallback al dato del checklist si el usuario es Admin o no tiene contexto
        if (this.checklist?.aeropuerto) {
            const queryParams: any = {};
            if (this.checklist.aeropuerto.codigo) queryParams.aeropuerto = this.checklist.aeropuerto.codigo;
            if (this.checklist.aeropuerto.fir?.nombre) queryParams.fir = this.checklist.aeropuerto.fir.nombre;

            this.router.navigate(['/comunicaciones'], { queryParams });
        } else {
            this.router.navigate(['/comunicaciones']);
        }
    }

    print() {
        window.print();
    }

    determineUserRole() {
        if (!this.currentUser || !this.checklist) {
            this.userRoleInStation = 'none';
            return;
        }

        const userAirport = this.currentUser.context?.aeropuertoCodigo;
        const stationAirport = this.checklist.equipo?.vhf?.aeropuerto || this.checklist.aeropuerto?.codigo || this.checklist.estacion.split('-')[1]?.trim();

        const userAirportName = this.currentUser.context?.aeropuerto?.toUpperCase();
        const stationName = this.checklist.estacion.toUpperCase();

        // Si el usuario es del mismo aeropuerto que el equipo -> LOCAL
        if ((userAirport && stationAirport && userAirport === stationAirport) ||
            (userAirportName && stationName && stationName.includes(userAirportName))) {
            this.userRoleInStation = 'local';
            return;
        }

        // Si el usuario es de MENDOZA (FIR) y estamos viendo un equipo de su FIR -> REGIONAL
        const userFir = this.currentUser.context?.fir?.toUpperCase();
        if (userFir === 'MENDOZA' || userFir === 'DOZ') {
            this.userRoleInStation = 'regional';
        } else {
            this.userRoleInStation = 'none';
        }
    }

    async signAs(type: 'local' | 'regional') {
        if (!this.checklist || !this.currentUser) return;

        const fullName = `${this.currentUser.context?.nombre} ${this.currentUser.context?.apellido}`;
        const update: any = {};

        if (type === 'local') {
            update.firmaLocal = fullName;
            this.checklist.firmaLocal = fullName;
        } else {
            update.firmaRegional = fullName;
            this.checklist.firmaRegional = fullName;
        }

        try {
            await firstValueFrom(this.http.patch(`/api/v1/checklists/${this.checklist.id}`, update));
            this.toastService.success(`Firmado como Técnico ${type === 'local' ? 'Local' : 'Regional'}`);
        } catch (e) {
            this.toastService.error('Error al firmar el documento');
        }
    }

    createNewFromThis() {
        if (!this.checklist) return;
        this.router.navigate(['/checklists/new'], {
            queryParams: {
                station: this.checklist.estacion,
                vhfId: this.checklist.comunicacionesId
            }
        });
    }
}
