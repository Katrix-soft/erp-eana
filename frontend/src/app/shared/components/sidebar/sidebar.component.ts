import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LucideAngularModule, LayoutDashboard, Radio, Server, Activity, Signal, Radar, LogOut, X, ChevronDown, ChevronRight, MessageSquare, MessageCircle, Gauge, FileText, MapPin, Users, Globe, Briefcase, Zap, Shield, Settings, History, Upload, Wrench } from 'lucide-angular';

import { filter } from 'rxjs';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule, RouterModule, LucideAngularModule],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
    private authService = inject(AuthService);
    private router = inject(Router);

    @Output() closeSidebar = new EventEmitter<void>();

    user$ = this.authService.user$;
    currentPath = '';
    commsOpen = true;

    readonly LayoutDashboard = LayoutDashboard;
    readonly Radio = Radio;
    readonly Server = Server;
    readonly Activity = Activity;
    readonly Signal = Signal;
    readonly LogOut = LogOut;
    readonly X = X;
    readonly ChevronDown = ChevronDown;
    readonly ChevronRight = ChevronRight;
    readonly MessageSquare = MessageSquare;
    readonly Gauge = Gauge;
    readonly FileText = FileText;
    readonly MapPin = MapPin;
    readonly Users = Users;
    readonly Globe = Globe;
    readonly Briefcase = Briefcase;
    readonly Zap = Zap;
    readonly Shield = Shield;
    readonly Settings = Settings;
    readonly History = History;
    readonly Upload = Upload;
    readonly Wrench = Wrench;
    readonly Radar = Radar;
    readonly MessageCircle = MessageCircle;


    constructor() {
        this.currentPath = this.router.url;
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe((event: any) => {
            this.currentPath = event.urlAfterRedirects;
        });
    }

    logout() {
        this.authService.logout();
    }

    isPathActive(path: string): boolean {
        return this.currentPath.startsWith(path);
    }

    isAdmin(user: any): boolean {
        return user?.role === 'CNS_NACIONAL' || user?.role === 'ADMIN';
    }

    isTechnician(user: any): boolean {
        return user?.role === 'TECNICO';
    }

    isOneSectorOnly(user: any): boolean {
        // Logica: Si es de UN FIR (no tiene aeropuerto o es cabecera) -> devuelve TRUE para restringir
        // Si es de un aeropuerto del interior -> devuelve FALSE para mostrar TODO

        if (this.isAdmin(user) || !this.isTechnician(user)) return false; // Jefes ven todo

        const firsCabeceras = ['EZE', 'CBA', 'CRV', 'DOZ', 'SIS', 'RES'];
        const aeropuertoCode = user?.context?.aeropuerto;
        const firCode = user?.context?.firDirecto; // FIR asignado directamente sin aeropuerto

        // Si es Personal de FIR puro (sin aeropuerto) o Aeropuerto es Cabecera
        if (!aeropuertoCode) return true; // Es FIR puro

        // Check si el aeropuerto es cabecera (su codigo suele ser igual al del FIR o esta en lista)
        // Simplification: EZE, CBA, CRV, DOZ, SIS/RES
        // Malargue (MLG) != DOZ -> false
        // Mendoza (DOZ) == DOZ -> true
        // San Rafael (AFA) != DOZ -> false

        // Necesitamos saber si el aeropuerto es cabecera.
        // Asumimos que si user.context.aeropuerto (codigo) coincide con alguno de la lista de cabeceras/FIRs.
        // O si el nombre del aeropuerto contiene "FIR".

        return firsCabeceras.includes(aeropuertoCode);
    }

    getSectionTitle(user: any): string {
        if (this.isAdmin(user)) return 'CNSE';
        if (this.isOneSectorOnly(user)) {
            return user.context.sector === 'CNSE' ? 'CNSE' : user.context.sector;
        }
        return 'CNSE'; // Para aeropuertos chicos, titulo generico
    }

    isCommsActive(): boolean {
        const commsLinks = ['/comunicaciones', '/navegacion', '/vigilancia', '/energia'];
        return commsLinks.some(link => this.currentPath === link || this.currentPath.startsWith(`${link}/`) || this.currentPath.includes(link));
    }

    toggleComms(): void {
        this.commsOpen = !this.commsOpen;
    }

    isSectorActive(sector: string): boolean {
        return (this.currentPath.includes('/comunicaciones') || this.currentPath.includes('/navegacion') || this.currentPath.includes('/vigilancia')) && this.currentPath.includes(sector);
    }
}
