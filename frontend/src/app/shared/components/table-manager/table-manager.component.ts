import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Eye, Edit, Trash2, Plus, X, Search } from 'lucide-angular';
import { ModalComponent } from '../modal/modal.component';
import { ToastService } from '../../../core/services/toast.service';

export interface TableColumn {
  key: string;
  label: string;
  type?: string;
  optional?: boolean;
  virtual?: boolean;
  hideInForm?: boolean;
  hideInTable?: boolean;
  relation?: string;
  displayKey?: string | ((item: any) => string);
  renderCell?: (item: any) => string;
  options?: string[];
  dependsOn?: string;
  dependencyKey?: string;
}

@Component({
  selector: 'app-table-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, ModalComponent],
  templateUrl: './table-manager.component.html',
  styleUrl: './table-manager.component.css'
})
export class TableManagerComponent implements OnInit {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);

  @Input() resource!: string;
  @Input() title!: string;
  @Input() columns: TableColumn[] = [];

  items: any[] = [];
  filterText = '';
  loading = true;
  error: string | null = null;
  isModalOpen = false;
  currentItem: any | null = null;
  formData: any = {};
  relations: Record<string, any[]> = {};
  isReadOnly = false;

  get filteredItems() {
    if (!this.filterText) return this.items;
    const search = this.filterText.toLowerCase();
    return this.items.filter(item => {
      return this.columns.some(col => {
        const val = this.getItemValue(item, col.key);
        if (col.relation) {
          const label = this.getRelationLabel(col, val);
          return label?.toString().toLowerCase().includes(search);
        }
        return val?.toString().toLowerCase().includes(search);
      });
    });
  }

  readonly Search = Search;
  readonly Eye = Eye;
  readonly Edit = Edit;
  readonly Trash2 = Trash2;
  readonly Plus = Plus;
  readonly X = X;

  ngOnInit() {
    this.fetchItems();
    this.fetchRelations();
  }

  // Shared cache for relations across all TableManager instances in the session
  private static relationsCache: Record<string, any[]> = {};

  fetchRelations() {
    const relationColumns = this.columns.filter(col => col.relation);

    relationColumns.forEach(col => {
      const relationPath = col.relation;
      if (!relationPath) return;

      // Check cache first
      if (TableManagerComponent.relationsCache[relationPath]) {
        this.relations[col.key] = TableManagerComponent.relationsCache[relationPath];
        return;
      }

      // Load from API if not cached
      this.http.get<any[]>(`/api/v1/${relationPath}`).subscribe({
        next: (data) => {
          this.relations[col.key] = data;
          TableManagerComponent.relationsCache[relationPath!] = data;
        },
        error: (err) => console.error(`Error loading relation ${relationPath}`, err)
      });
    });
  }

  fetchItems() {
    this.loading = true;
    this.http.get<any[]>(`/api/v1/${this.resource}`).subscribe({
      next: (data) => {
        this.items = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('API Error:', err);
        this.error = 'Error cargando datos';
        this.loading = false;
      }
    });
  }

  handleDelete(id: number) {
    if (confirm('¿Está seguro de eliminar este elemento?')) {
      this.http.delete(`/api/v1/${this.resource}/${id}`).subscribe({
        next: () => {
          this.toastService.success('Elemento eliminado correctamente');
          this.fetchItems();
        },
        error: (err) => this.toastService.error('Error al eliminar')
      });
    }
  }

  openModal(item: any = null, readOnly = false) {
    this.currentItem = item;
    this.formData = item ? { ...item } : {};
    this.isReadOnly = readOnly;
    this.isModalOpen = true;
  }

  handleSubmit() {
    const payload: any = {};
    this.columns.forEach(col => {
      if (!col.virtual && !col.hideInForm) {
        let value = this.formData[col.key];
        if (col.type === 'number' || col.relation) {
          value = value ? parseInt(value) : null;
        }
        payload[col.key] = value;
      }
    });

    const request = this.currentItem
      ? this.http.put(`/api/v1/${this.resource}/${this.currentItem.id}`, payload)
      : this.http.post(`/api/v1/${this.resource}`, payload);

    request.subscribe({
      next: () => {
        this.isModalOpen = false;
        this.toastService.success('Cambios guardados correctamente');
        this.fetchItems();
      },
      error: (err) => this.toastService.error('Error al guardar los cambios')
    });
  }

  getRelationLabel(col: TableColumn, value: any) {
    if (!value) return '';
    const list = this.relations[col.key] || [];
    const item = list.find(i => i.id === value);
    if (!item) return value;
    return this.getDisplayLabel(col, item);
  }

  getFilteredOptions(col: TableColumn) {
    let options = this.relations[col.key] || [];
    if (col.dependsOn && col.dependencyKey && this.formData[col.dependencyKey]) {
      const depVal = this.formData[col.dependencyKey];
      options = options.filter(opt => opt[col.dependsOn!] == depVal || opt.firId == depVal);
    }
    return options;
  }

  getDisplayLabel(col: TableColumn, opt: any): string {
    if (typeof col.displayKey === 'function') {
      return col.displayKey(opt);
    }
    return opt[col.displayKey as string] || opt.nombre || opt.id;
  }

  getItemValue(item: any, key: string): any {
    return item[key];
  }
}
