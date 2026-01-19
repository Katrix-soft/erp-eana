export interface WorkOrder {
    id: number;
    numero: string;
    equipoId: number;
    solicitanteId: number;
    tecnicoId?: number;
    prioridad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
    estado: 'ABIERTA' | 'EN_PROGRESO' | 'ESPERANDO_REPUESTO' | 'VERIFICADA' | 'CERRADA' | 'CANCELADA';
    descripcion: string;
    observaciones?: string;
    fechaInicio: string;
    fechaFin?: string;
    checklistId?: number;
    createdAt: string;
    updatedAt: string;

    // Relations
    equipo?: any;
    solicitante?: any;
    tecnicoAsignado?: any;
    checklist?: any;
}
