import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, ChevronDown, Check, ChevronsUpDown } from 'lucide-angular';

interface ChecklistItem {
  label: string;
  name: string;
  type?: 'toggle' | 'search';
  fullWidth?: boolean;
  leftLabel?: string;
  rightLabel?: string;
  placeholder?: string;
}

@Component({
  selector: 'app-checklist-steps',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './checklist-steps.html',
  styleUrls: ['./checklist-steps.css']
})
export class ChecklistSteps {
  @Input() form!: FormGroup;

  readonly ChevronDown = ChevronDown;
  readonly Check = Check;
  readonly ChevronsUpDown = ChevronsUpDown;

  visibleSections: Set<string> = new Set();

  checklistItems: ChecklistItem[] = [
    { label: 'Tablero Eléctrico', name: 'tablero_electrico', fullWidth: true },
    { label: 'Limpieza general', name: 'limpieza', fullWidth: true },
    { label: 'Sistema Irradiante', name: 'sistema_irradiante' },
    { label: 'Cableado, conectores y protectores gaseosos', name: 'cableado_rf' },
    { label: 'Balizamiento nocturno.', name: 'balizamiento' },
    { label: 'Cabeza de control y micrófono dinámico', name: 'cabeza_control' },
    { label: 'Switch/es', name: 'switch_ethernet' },
    { label: 'Controlar sistema alternativo de energía', name: 'sistema_energia' }
  ];

  toggleSection(section: string) {
    if (this.visibleSections.has(section)) {
      this.visibleSections.delete(section);
    } else {
      this.visibleSections.add(section);
    }
  }

  isExpanded(section: string): boolean {
    return this.visibleSections.has(section);
  }
}
