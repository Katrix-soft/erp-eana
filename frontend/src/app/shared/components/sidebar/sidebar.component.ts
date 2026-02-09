import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LucideAngularModule, LayoutDashboard, Radio, Server, Activity, Signal, Radar, LogOut, X, ChevronDown, ChevronRight, MessageSquare, MessageCircle, Gauge, FileText, MapPin, Users, Globe, Briefcase, Zap, Shield, Settings, History, Upload, Wrench, Wind } from 'lucide-angular';
import { toObservable } from '@angular/core/rxjs-interop';
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

    user$ = toObservable(this.authService.user);
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
    readonly Wind = Wind;


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
        return this.currentPath.includes(path);
    }

    isAdmin(user: any): boolean {
        // Solo CNS_NACIONAL y ADMIN (o futuros roles de jefe) pueden ver el backoffice
        const allowedRoles = ['CNS_NACIONAL', 'ADMIN', 'JEFE_CNSE', 'JEFE_REGIONAL'];
        return allowedRoles.includes(user?.role);
    }

    isTechnician(user: any): boolean {
        return user?.role === 'TECNICO';
    }

    isOneSectorOnly(user: any): boolean {
        if (this.isAdmin(user) || !this.isTechnician(user)) return false;

        const firsCabeceras = ['EZE', 'CBA', 'CRV', 'DOZ', 'SIS', 'RES'];
        const aeropuertoCode = user?.context?.aeropuerto;

        if (!aeropuertoCode) return true;

        return firsCabeceras.includes(aeropuertoCode);
    }

    getSectionTitle(user: any): string {
        if (this.isAdmin(user)) return 'CNSE';
        if (this.isOneSectorOnly(user)) {
            return user.context.sector === 'CNSE' ? 'CNSE' : user.context.sector;
        }
        return 'CNSE';
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
