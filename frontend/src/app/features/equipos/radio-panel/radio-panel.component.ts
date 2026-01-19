import { Component, inject, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';
import { LucideAngularModule, Search, Filter, ArrowUpDown, MapPin, ChevronRight, Signal } from 'lucide-angular';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { firstValueFrom } from 'rxjs';

interface Radio {
  id: number;
  frequency: number;
  name: string;
  activeSide: 'MAIN' | 'STANDBY';
  onAirSide: 'MAIN' | 'STANDBY';
  estado: string;
  status: string;
  model?: string;
  tipoEquipo?: string;
  userId?: number;
  aeropuerto?: any;
  hasMain: boolean;
  hasStandby: boolean;
  main?: any;
  standby?: any;
  secondaryStatusLabel?: string;
  secondaryStatusClass?: string;
  lastChecklistDate?: string;
  checklistWarning?: string;
  daysSinceChecklist?: number;
}

@Component({
  selector: 'app-radio-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, ConfirmModalComponent],
  templateUrl: './radio-panel.component.html',
  styleUrls: ['./radio-panel.component.css']
})
export class RadioPanelComponent implements OnInit {
  private _equipos: any[] = [];

  @Input() set equipos(value: any[]) {
    console.log('📦 app-radio-panel: Input equipos received', value?.length);
    this._equipos = value || [];
    this.rawEquipos = [...this._equipos];
    if (this._equipos.length > 0) {
      this.processRadios(this._equipos);
      this.loading = false;
    }
  }

  get equipos(): any[] {
    return this._equipos;
  }

  @Input() airportFilter: string = 'ALL';
  @Input() statusFilter: string = 'ALL';
  @Input() roleFilter: string = 'ALL';

  @Output() equipmentClick = new EventEmitter<number>();

  radios: Radio[] = [];
  rawEquipos: any[] = [];
  loading: boolean = true;
  searchTerm: string = '';
  sortBy: 'STATUS' | 'FREQ' | 'NAME' = 'STATUS';

  // Iconos para Lucide
  readonly Search = Search;
  readonly ArrowUpDown = ArrowUpDown;
  readonly ChevronRight = ChevronRight;
  readonly Signal = Signal;

  showConfirmModal = false;
  pendingRadio: Radio | null = null;
  confirmModalTitle = 'Confirmar Cambio de Equipo';
  confirmModalMessage = '¿Está seguro que desea cambiar el equipo que se encuentra AL AIRE?';

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notificationService = inject(NotificationService);

  ESTADO_LABELS: any = {
    'OK': 'OPERATIVO',
    'NOVEDAD': 'CON NOVEDAD',
    'FUERA_SERVICIO': 'FUERA DE SERVICIO'
  };

  getStateClass(estado: string): string {
    switch (estado) {
      case 'OK': return 'bg-green-500';
      case 'NOVEDAD': return 'bg-yellow-400';
      case 'FUERA_SERVICIO': return 'bg-red-500';
      default: return 'bg-slate-100';
    }
  }

  getStatusColor(estado: string): string {
    switch (estado) {
      case 'OK': return 'green';
      case 'NOVEDAD': return 'yellow';
      case 'FUERA_SERVICIO': return 'red';
      default: return 'slate';
    }
  }

  getCardStyles(estado: string) {
    const isOK = estado === 'OK';
    const isNov = estado === 'NOVEDAD';
    const isFS = estado === 'FUERA_SERVICIO';

    return {
      'border-green-500/30 shadow-green-500/10': isOK,
      'border-yellow-500/30 shadow-yellow-500/10': isNov,
      'border-red-500/30 shadow-red-500/10': isFS,
      'border-slate-800/50': !isOK && !isNov && !isFS
    };
  }

  getBumperStyles(estado: string) {
    switch (estado) {
      case 'OK': return 'from-green-500 to-green-600';
      case 'NOVEDAD': return 'from-yellow-400 to-yellow-500';
      case 'FUERA_SERVICIO': return 'from-red-500 to-red-600';
      default: return 'from-slate-600 to-slate-700';
    }
  }

  getChecklistAlert(lastDate?: string): { message: string, days: number } | null {
    if (!lastDate) return null;
    const last = new Date(lastDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - last.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 30 && diffDays <= 45) {
      return { message: `Checklist pendiente (${diffDays} días)`, days: diffDays };
    }
    return null;
  }

  ngOnInit() {
    // Solo cargamos si no se nos pasaron los equipos por Input para evitar duplicar pedidos
    if (!this._equipos || this._equipos.length === 0) {
      this.loadRadios();
    }
  }

  async loadRadios() {
    this.loading = true;
    try {
      const response = await firstValueFrom(this.http.get<any[]>('/api/v1/vhf-equipos'));
      this.rawEquipos = response;
      this.processRadios(response);
    } catch (error) {
      console.error('Error loading radios:', error);
      this.toastService.error('Error al cargar equipos');
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  processRadios(rawRadios: any[]) {
    const grouped = new Map<string, Radio>();

    rawRadios.forEach(r => {
      // Normalizar nombre de aeropuerto para agrupar
      r.cleanAirport = (r.vhf?.aeropuerto || 'SIN_AEROPUERTO').trim().toUpperCase();

      // Determine Role (Main vs Standby)
      // Hierarchy: 
      // 1. Explicit 'tipoEquipo' (if contains Match)
      // 2. Explicit 'tipo' in Canal (if available in future, currently not fetched in all endpoints but good to be safe)
      // 3. String match in Model/Sitio

      const rawType = (r.tipoEquipo || '').toUpperCase();
      let isStandby = rawType.includes('STANDBY') || rawType.includes('STBY') || rawType.includes('DUPE') || rawType === 'SBY';

      if (!isStandby) {
        // Fallback checks
        isStandby = (r.marca + r.modelo + r.numeroSerie).toLowerCase().includes('standby') ||
          (r.vhf?.sitio || '').toLowerCase().includes('standby') ||
          (r.vhf?.sitio || '').toLowerCase().includes('stby');
      }

      // Generar Clave de Agrupación
      let key = '';

      if (r.frecuencia && r.frecuencia > 0) {
        // Opción 1: Agrupar por Frecuencia exacta + Aeropuerto
        key = `${r.frecuencia.toFixed(3)}_${r.cleanAirport}`;

        // Fix for multiple pairs on same freq/airport (e.g. multiple TWR positions)?
        // If we have unique positions (TWR 1, TWR 2) they ideally need distinct freqs or sites.
        // For now, assume frequency unifies the pair.
      } else {
        // Opción 2: Fallback para equipos sin frecuencia
        const modelBase = (r.modelo || 'GENERIC')
          .replace(/standby/gi, '')
          .replace(/stby/gi, '')
          .trim()
          .toUpperCase();

        const marcaBase = (r.marca || '')
          .replace(/standby/gi, '')
          .replace(/stby/gi, '')
          .trim()
          .toUpperCase();

        // Include Sitio in key to separate different sites in same airport
        const sitio = (r.vhf?.sitio || 'SITIO').trim().toUpperCase().replace(/STANDBY/g, '').replace(/STBY/g, '').trim();

        key = `NO_FREQ_${r.cleanAirport}_${sitio}_${modelBase}`;
      }

      if (grouped.has(key)) {
        const existing = grouped.get(key)!;

        // Lógica de fusión
        if (isStandby) {
          // If already have standby, we might have a conflict or a second standby (Dupe)
          // Just overwrite or keep based on logical priority? 
          // Current req: Eq2 is Standby/Dupe.
          if (!existing.hasStandby) {
            existing.standby = r;
            existing.hasStandby = true;
          } else {
            // We have >1 standby. Ignore or maybe stick to the first found?
            // Let's keep first found for stability.
          }
        } else {
          // It is MAIN
          if (!existing.hasMain) {
            existing.main = r;
            existing.hasMain = true;

            // Si no hay una preferencia guardada, y acabamos de encontrar el MAIN,
            // asegurémonos de que la vista cambie al MAIN por defecto.
            const savedSide = localStorage.getItem(`activeSide_${key}`);
            if (!savedSide) {
              existing.activeSide = 'MAIN';
            }
          } else {
            // Already have Main. Is this a duplicate Main?
            // If we don't have standby yet, and this "Main" looks suspicious, maybe it is the standby?
            // But trusting the "Main" flag is safer.
            // If we have duplicate Mains, we effectively ignore the second one in this pair logic.
            // OR maybe it belongs to a new pair (different Key?) -> but Key is freq based.
            // Let's assume strict pairing.

            // Fallback: If no standby exists, force this into standby slot? 
            // ONLY if strictly requested, but "Eq1 always Main" implies we shouldn't put Main in Standby slot.
            // User said "Eq2 is Standby OR Dupe".
            // So if we have a duplicate Main (Dupe), maybe it goes to Eq2?
            if (!existing.hasStandby) {
              existing.standby = r;
              existing.hasStandby = true;
              // Update local visual state for the new standby part
              // existing.standby.tipoEquipo might say 'Main', but it is acting as 'Dupe'.
            }
          }
        }
        this.syncRadioVisualState(existing);
      } else {
        const radio: Radio = {
          id: r.id,
          frequency: r.frecuencia,
          name: r.vhf?.sitio || r.vhf?.aeropuerto || 'SITIO',
          activeSide: 'MAIN', // Default to Main view
          onAirSide: isStandby ? 'STANDBY' : 'MAIN', // If we only found Standby so far, it is the one on air? No, usually Main.
          // Actually onAirSide tracks which physical transmitter is radiating. We don't know from DB state necessarily.
          // Default to Main.

          estado: r.estado || 'OK',
          status: 'EQUIPO 1', // Label for current view
          model: r.modelo,
          tipoEquipo: r.tipoEquipo,
          aeropuerto: r.vhf,
          hasMain: !isStandby,
          hasStandby: isStandby,
          main: !isStandby ? r : undefined,
          standby: isStandby ? r : undefined
        };

        // Forzar modelo limpio en la visualización
        if (radio.model) {
          radio.model = radio.model.replace(/\s*standby\s*/yi, '').trim();
        }

        // Recuperar preferencia guardada
        const savedSide = localStorage.getItem(`activeSide_${key}`);
        const savedOnAir = localStorage.getItem(`onAirSide_${key}`);

        if (savedSide === 'MAIN' || savedSide === 'STANDBY') {
          radio.activeSide = savedSide;
        } else {
          // LÓGICA DE PRIORIDAD: Si tenemos Main, siempre mostrar MAIN por defecto
          // Si SOLO tenemos Standby, mostrar Standby.
          if (radio.hasMain) {
            radio.activeSide = 'MAIN';
          } else if (radio.hasStandby) {
            radio.activeSide = 'STANDBY';
          }
        }

        if (savedOnAir === 'MAIN' || savedOnAir === 'STANDBY') {
          radio.onAirSide = savedOnAir;
        } else {
          // Por defecto, asumimos que el equipo 1 está al aire
          radio.onAirSide = 'MAIN';
        }

        this.syncRadioVisualState(radio);
        grouped.set(key, radio);
      }
    });

    // Check for checklist notifications
    this.checkAndNotifyMaintenance();

    this.radios = Array.from(grouped.values());
  }

  private checkAndNotifyMaintenance() {
    this.radios.forEach(radio => {
      if (radio.checklistWarning && radio.daysSinceChecklist) {
        // Solo notificar si es exactamente un hito (ej: 30 días o 45 días) o una vez al día
        // Aquí usamos una notificación simple a través del servicio persistente
        this.notificationService.create(
          `Mantenimiento Preventivo: El equipo ${radio.model} en ${radio.name} requiere checklist (${radio.daysSinceChecklist} días sin inspección).`,
          'WARNING',
          {
            aeropuertoId: radio.aeropuerto?.aeropuertoId,
            firId: radio.aeropuerto?.firId
          }
        ).subscribe();
      }
    });
  }

  private getStatusScore(estado?: string): number {
    if (!estado) return 0;
    const est = estado.toUpperCase();
    if (est === 'OK' || est === 'OPERATIVO') return 3;
    if (est === 'NOVEDAD' || est === 'PRECAUCION' || est === 'CON NOVEDAD') return 2;
    if (est === 'FUERA_SERVICIO' || est === 'FALLA' || est === 'FUERA DE SERVICIO') return 1;
    return 0;
  }

  // Method to manually switch sides via tabs
  setSide(radio: Radio, side: 'MAIN' | 'STANDBY') {
    radio.activeSide = side;

    // Save preference
    // Careful: key generation must be consistent.
    if (radio.frequency && radio.frequency > 0) {
      const key = `${radio.frequency.toFixed(3)}_${(radio.aeropuerto?.aeropuerto || 'SIN_APT').trim().toUpperCase()}`;
      localStorage.setItem(`activeSide_${key}`, side);
    }

    this.syncRadioVisualState(radio);
  }

  syncRadioVisualState(radio: Radio) {
    const mainData = radio.main;
    const standbyData = radio.standby;

    // Strict Mapping:
    // If activeSide is MAIN, show mainData (Eq 1)
    // If activeSide is STANDBY, show standbyData (Eq 2)

    const displaySide = radio.activeSide;
    const targetData = displaySide === 'MAIN' ? mainData : standbyData;

    // Determine what to show
    if (targetData) {
      radio.id = targetData.id;
      radio.estado = targetData.estado;
      radio.status = displaySide === 'MAIN' ? 'EQUIPO 1' : 'EQUIPO 2';

      const rawModel = `${targetData.marca} ${targetData.modelo}`;
      radio.model = rawModel.replace(/\s*standby\s*/yi, '').replace(/\s*stby\s*/yi, '').trim();
      radio.tipoEquipo = targetData.tipoEquipo; // e.g. "Main", "Standby"

      // Checklist Notification Logic
      const alert = this.getChecklistAlert(targetData.lastChecklistDate);
      if (alert) {
        radio.checklistWarning = alert.message;
        radio.daysSinceChecklist = alert.days;
      } else {
        radio.checklistWarning = undefined;
        radio.daysSinceChecklist = undefined;
      }
    } else {
      // Target side is empty (e.g. clicked Eq 2 but no standby)
      radio.id = -1; // Flag for empty
      radio.estado = 'APAGADO'; // Or specific state
      radio.status = displaySide === 'MAIN' ? 'EQUIPO 1 (VACÍO)' : 'EQUIPO 2 (VACÍO)';
      radio.model = 'Sin Equipo';
      radio.tipoEquipo = '';
    }

    // Secondary Banner Logic
    // Show status of the OTHER side
    const secondaryData = displaySide === 'MAIN' ? standbyData : mainData;

    if (secondaryData && (radio.estado !== secondaryData.estado || radio.estado !== 'OK')) {
      const sScore = this.getStatusScore(secondaryData.estado);
      const type = sScore >= 3 ? 'OP' : (sScore === 2 ? 'NOV' : 'F.S'); // 3 is OK
      const secondaryDisplay = displaySide === 'MAIN' ? 'EQ 2' : 'EQ 1';

      radio.secondaryStatusLabel = `${secondaryDisplay} - ${type}`;

      if (sScore >= 3) { // OK
        radio.secondaryStatusClass = 'bg-emerald-500 text-black border-emerald-600/30';
      } else if (sScore === 2) {
        radio.secondaryStatusClass = 'bg-amber-400 text-black border-amber-600/30';
      } else {
        radio.secondaryStatusClass = 'bg-red-500 text-black border-red-700/30';
      }
    } else {
      radio.secondaryStatusLabel = undefined;
      radio.secondaryStatusClass = undefined;
    }
  }

  get filteredRadios() {
    return this.radios.filter(radio => {
      const matchesSearch = radio.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        radio.frequency.toString().includes(this.searchTerm);

      const matchesAirport = this.airportFilter === 'ALL' || radio.aeropuerto?.aeropuerto === this.airportFilter;
      const matchesStatus = this.statusFilter === 'ALL' || radio.estado === this.statusFilter;

      return matchesSearch && matchesAirport && matchesStatus;
    }).sort((a, b) => {
      if (this.sortBy === 'FREQ') return a.frequency - b.frequency;
      if (this.sortBy === 'NAME') return a.name.localeCompare(b.name);
      return 0; // STATUS sorting logic can be more complex
    });
  }

  setSort(sort: string) {
    this.sortBy = sort as any;
  }

  toggleMainStandby(event: Event, radio: Radio) {
    this.handleToggleRequest(event, radio);
  }

  handleToggleRequest(event: Event, radio: Radio) {
    event.stopPropagation();
    if (radio.hasStandby) {
      const currentSide = radio.onAirSide || 'MAIN';
      const targetSide = currentSide === 'MAIN' ? 'STANDBY' : 'MAIN';
      const targetData = targetSide === 'MAIN' ? radio.main : radio.standby;
      const currentData = currentSide === 'MAIN' ? radio.main : radio.standby;

      // Rule: Block if target is not OPERATIVO (OK)
      const targetStatus = targetData?.estado?.toUpperCase() || 'OK';
      if (['NOVEDAD', 'FUERA_SERVICIO', 'FALLA', 'PRECAUCION'].includes(targetStatus)) {
        const targetLabel = targetSide === 'MAIN' ? 'Equipo 1' : 'Equipo 2';
        this.toastService.warning(`No se puede conmutar: El ${targetLabel} tiene una novedad activa.`);
        return;
      }

      this.pendingRadio = radio;
      this.confirmModalMessage = `¿Desea conmutar al ${targetSide === 'MAIN' ? 'Equipo 1' : 'Equipo 2'}? El equipo actual pasará a reserva.`;
      this.showConfirmModal = true;
    } else {
      this.toastService.warning('Este equipo no posee una unidad de respaldo para conmutar.');
    }
  }

  confirmToggle() {
    if (this.pendingRadio) {
      const radio = this.pendingRadio;
      // Toggle onAirSide relative to its current state
      radio.onAirSide = (radio.onAirSide || 'MAIN') === 'MAIN' ? 'STANDBY' : 'MAIN';

      // Optionally sync the view to the new on-air equipment
      radio.activeSide = radio.onAirSide;

      this.syncRadioVisualState(radio);

      // Guardar preferencia en localStorage para persistencia del AL AIRE y el VISTA
      const key = `${radio.frequency?.toFixed(3)}_${radio.aeropuerto?.aeropuerto?.trim().toUpperCase()}`;
      localStorage.setItem(`onAirSide_${key}`, radio.onAirSide);
      localStorage.setItem(`activeSide_${key}`, radio.activeSide);

      const targetName = radio.onAirSide === 'MAIN' ? 'Equipo 1' : 'Equipo 2';
      this.toastService.success(`Se ha cambiado al ${targetName}`);
      // Crear notificación persistente
      this.notificationService.create(
        `Cambio de equipo en ${radio.aeropuerto?.aeropuerto || radio.name || 'Sitio Desconocido'}: se puso AL AIRE el ${targetName}`,
        'INFO',
        { aeropuertoId: radio.aeropuerto?.aeropuertoId, firId: radio.aeropuerto?.firId }
      ).subscribe();

      this.closeConfirmModal();
    }
  }

  closeConfirmModal() {
    this.showConfirmModal = false;
    this.pendingRadio = null;
  }

  navigateToChecklist(radioId: number) {
    this.equipmentClick.emit(radioId);

    const radio = this.radios.find(r => r.id === radioId);
    if (!radio) return;

    const user = this.authService.userValue;
    const activeData = radio.activeSide === 'MAIN' ? radio.main : radio.standby;

    this.http.post<any>('/api/v1/checklists', {
      estacion: radio.name,
      fecha: new Date().toISOString(),
      estado: activeData.estado === 'OK' ? 'OPERATIVO' : (activeData.estado === 'NOVEDAD' ? 'PRECAUCION' : 'FALLA'),
      equipoId: activeData.id,
      aeropuertoId: user?.context?.aeropuertoId
    }).subscribe({
      next: (checklist) => {
        this.router.navigate([`/checklists/${checklist.id}/mimic`]);
      },
      error: (err) => {
        console.error('Error creating checklist:', err);
        this.toastService.error('Error al iniciar checklist');
      }
    });
  }
}
