import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableManagerComponent, TableColumn } from '../../../shared/components/table-manager/table-manager.component';

@Component({
  selector: 'app-vigilancia-list',
  standalone: true,
  imports: [CommonModule, TableManagerComponent],
  template: `
    <app-table-manager
      resource="vigilancia"
      title="Vigilancia"
      [columns]="columns"
    ></app-table-manager>
  `
})
export class VigilanciaListComponent {
  columns: TableColumn[] = [
    { key: 'idApSig', label: 'ID AP' },
    { key: 'ubicacion', label: 'Ubicación' },
    { key: 'definicion', label: 'Tipo' },
    { key: 'modelo', label: 'Modelo' },
    { key: 'sistema', label: 'Sistema' },
    { key: 'siglasLocal', label: 'OACI' },
    { key: 'fir', label: 'FIR (Text)' },
    {
      key: 'aeropuertoId',
      label: 'Relación Aero',
      relation: 'aeropuertos',
      displayKey: (a: any) => a ? `${a.nombre} (${a.codigo})` : '---'
    }
  ];
}
