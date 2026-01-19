import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Plus, FileText, Edit, Trash2, Calendar, Search, Filter, ChevronRight, Printer } from 'lucide-angular';
import { ChecklistService } from '../../../core/services/checklist.service';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-checklist-list',
    standalone: true,
    imports: [CommonModule, RouterModule, LucideAngularModule, FormsModule],
    templateUrl: './checklist-list.component.html',
    styleUrl: './checklist-list.component.css'
})
export class ChecklistListComponent implements OnInit {
    private checklistService = inject(ChecklistService);

    checklists: any[] = [];
    loading = true;
    searchTerm = '';

    readonly Plus = Plus;
    readonly FileText = FileText;
    readonly Edit = Edit;
    readonly Trash2 = Trash2;
    readonly Calendar = Calendar;
    readonly Search = Search;
    readonly Filter = Filter;
    readonly ChevronRight = ChevronRight;
    readonly Printer = Printer;

    ngOnInit() {
        this.loadChecklists();
    }

    loadChecklists() {
        this.loading = true;
        this.checklistService.getChecklists().subscribe({
            next: (data) => {
                this.checklists = data;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading checklists:', err);
                this.loading = false;
            }
        });
    }

    handleDelete(id: number) {
        if (confirm('¿Estás seguro de eliminar este checklist?')) {
            this.checklistService.deleteChecklist(id.toString()).subscribe(() => {
                this.checklists = this.checklists.filter(c => c.id !== id);
            });
        }
    }

    get filteredChecklists() {
        return this.checklists.filter(c =>
            c.estacion?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            c.folio?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            c.aeropuerto?.nombre?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            c.tecnico?.nombre?.toLowerCase().includes(this.searchTerm.toLowerCase())
        );
    }

    getStatusColor(estado: string) {
        switch (estado) {
            case 'FALLA': return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]';
            case 'PRECAUCION': return 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]';
            default: return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]';
        }
    }

    getStatusTextClass(estado: string) {
        switch (estado) {
            case 'FALLA': return 'text-red-500';
            case 'PRECAUCION': return 'text-amber-500';
            default: return 'text-emerald-500';
        }
    }
}
