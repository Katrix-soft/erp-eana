import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableManagerComponent, TableColumn } from '../../../shared/components/table-manager/table-manager.component';

@Component({
    selector: 'app-aeropuertos-list',
    standalone: true,
    imports: [CommonModule, TableManagerComponent],
    template: `
    <app-table-manager
      resource="aeropuertos"
      title="Aeropuertos"
      [columns]="columns"
    ></app-table-manager>
  `
})
export class AeropuertosListComponent {
    columns: TableColumn[] = [
        { key: 'nombre', label: 'Nombre' },
        { key: 'codigo', label: 'Código OACI' },
        { key: 'firId', label: 'FIR', relation: 'fir', displayKey: 'nombre' }
    ];
}
