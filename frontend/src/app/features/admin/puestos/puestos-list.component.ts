import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableManagerComponent, TableColumn } from '../../../shared/components/table-manager/table-manager.component';

@Component({
    selector: 'app-puestos-list',
    standalone: true,
    imports: [CommonModule, TableManagerComponent],
    template: `
    <app-table-manager
      resource="puestos-personal"
      title="Puestos Personal"
      [columns]="columns"
    ></app-table-manager>
  `
})
export class PuestosListComponent {
    columns: TableColumn[] = [
        { key: 'nombre', label: 'Nombre' }
    ];
}
