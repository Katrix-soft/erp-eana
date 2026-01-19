import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableManagerComponent, TableColumn } from '../../../shared/components/table-manager/table-manager.component';

@Component({
    selector: 'app-fir-list',
    standalone: true,
    imports: [CommonModule, TableManagerComponent],
    template: `
    <app-table-manager
      resource="firs"
      title="FIRs"
      [columns]="columns"
    ></app-table-manager>
  `
})
export class FirListComponent {
    columns: TableColumn[] = [
        { key: 'nombre', label: 'Nombre' }
    ];
}
