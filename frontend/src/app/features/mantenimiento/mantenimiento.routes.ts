import { Routes } from '@angular/router';
import { WorkOrdersListComponent } from './work-orders-list/work-orders-list.component';

export const MANTENIMIENTO_ROUTES: Routes = [
    {
        path: '',
        component: WorkOrdersListComponent
    }
];
