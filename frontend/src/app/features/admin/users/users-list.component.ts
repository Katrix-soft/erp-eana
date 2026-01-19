import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableManagerComponent, TableColumn } from '../../../shared/components/table-manager/table-manager.component';

@Component({
    selector: 'app-users-list',
    standalone: true,
    imports: [CommonModule, TableManagerComponent],
    template: `
    <app-table-manager
      resource="users"
      title="Usuarios"
      [columns]="columns"
    ></app-table-manager>
  `
})
export class UsersListComponent {
    columns: TableColumn[] = [
        { key: 'email', label: 'Email' },
        { key: 'password', label: 'Contraseña', type: 'password', optional: true, hideInTable: true },
        { key: 'role', label: 'Rol', type: 'select', options: ['ADMIN', 'CNS_NACIONAL', 'JEFE_COORDINADOR', 'TECNICO'] },
        {
            key: 'personalId',
            label: 'Personal Asociado',
            relation: 'personal',
            displayKey: (p: any) => `${p.nombre} ${p.apellido} - ${p.puesto?.nombre || 'S/P'} - ${p.aeropuerto?.nombre || 'S/A'} (${p.aeropuerto?.fir?.nombre || 'S/F'})`,
            optional: true
        }
    ];
}
