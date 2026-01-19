import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableManagerComponent, TableColumn } from '../../../shared/components/table-manager/table-manager.component';

@Component({
    selector: 'app-personal-list',
    standalone: true,
    imports: [CommonModule, TableManagerComponent],
    template: `
    <app-table-manager
      resource="personal"
      title="Personal"
      [columns]="columns"
    ></app-table-manager>
  `
})
export class PersonalListComponent {
    columns: TableColumn[] = [
        { key: 'nombre', label: 'Nombre' },
        { key: 'apellido', label: 'Apellido' },
        { key: 'dni', label: 'DNI' },
        { key: 'sector', label: 'Sector', type: 'select', options: ['CNSE', 'COMUNICACIONES', 'NAVEGACION', 'VIGILANCIA', 'ENERGIA'] },
        { key: 'puestoId', label: 'Puesto', relation: 'puestos-personal', displayKey: 'nombre', dependsOn: 'sector', dependencyKey: 'sector' },
        { key: 'aeropuertoId', label: 'Aeropuerto', relation: 'aeropuertos', displayKey: 'nombre', optional: true },
        { key: 'firId', label: 'FIR', relation: 'firs', displayKey: 'nombre', optional: true }
    ];
}
