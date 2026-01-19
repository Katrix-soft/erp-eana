import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableManagerComponent, TableColumn } from '../../../shared/components/table-manager/table-manager.component';

@Component({
    selector: 'app-comunicaciones-list',
    standalone: true,
    imports: [CommonModule, TableManagerComponent],
    template: `
    <app-table-manager
      resource="comunicaciones"
      title="Comunicaciones"
      [columns]="columns"
    ></app-table-manager>
  `
})
export class ComunicacionesListComponent {
    columns: TableColumn[] = [
        { key: 'nombre', label: 'Nombre' },
        { key: 'tipo', label: 'Tipo' },
        { key: 'marca', label: 'Marca' },
        { key: 'modelo', label: 'Modelo' },
        {
            key: 'aeropuertoId',
            label: 'Aeropuerto',
            relation: 'aeropuertos',
            displayKey: (a: any) => `${a.nombre} (${a.fir?.nombre || 'S/F'})`
        }
    ];
}
