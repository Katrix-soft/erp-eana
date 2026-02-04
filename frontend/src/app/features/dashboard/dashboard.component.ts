
import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EquipmentService } from '../../core/services/equipment.service';
import { AuthService } from '../../core/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of, interval, Subscription } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { LucideAngularModule, Radio, Server, Activity, Zap, MapPin, RefreshCw, PlusCircle, Users, LayoutDashboard, CheckCircle, AlertTriangle, Info, History, ChevronRight } from 'lucide-angular';
import { Router, RouterModule } from '@angular/router';
import { CnsMapComponent } from '../../shared/components/cns-map/cns-map.component';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, LucideAngularModule, RouterModule, CnsMapComponent],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
    private equipmentService = inject(EquipmentService);
    private authService = inject(AuthService);
    private http = inject(HttpClient);
    private router = inject(Router);
    private cdr = inject(ChangeDetectorRef);

    Math = Math;

    user$ = this.authService.user$;
    isAdmin = false;
    today = new Date();
    loading = true;

    // Estructura robusta para evitar errores de renderizado
    stats: any = {
        global: { total: 0, operational: 0, warning: 0, danger: 0 },
        categories: {
            comms: { total: 0, operational: 0, warning: 0, danger: 0 },
            nav: { total: 0, operational: 0, warning: 0, danger: 0 },
            vig: { total: 0, operational: 0, warning: 0, danger: 0 },
            ener: { total: 0, operational: 0, warning: 0, danger: 0 }
        },
        context: { aeropuerto: 'Cargando...' }
    };

    groupedSummary: Record<string, any[]> = {};
    allAirports: any[] = [];
    notifications: any[] = [];


    private refreshSubscription?: Subscription;
    private readonly REFRESH_INTERVAL = 30000;

    // Icons
    readonly LayoutDashboard = LayoutDashboard;
    readonly RefreshCw = RefreshCw;
    readonly Radio = Radio;
    readonly Server = Server;
    readonly Activity = Activity;
    readonly Zap = Zap;
    readonly MapPin = MapPin;
    readonly PlusCircle = PlusCircle;
    readonly Users = Users;
    readonly CheckCircle = CheckCircle;
    readonly AlertTriangle = AlertTriangle;
    readonly Info = Info;
    readonly History = History;
    readonly ChevronRight = ChevronRight;

    showStrategicMap = false;

    ngOnInit() {
        console.log('💎💎💎 VERSIÓN ACTUALIZADA DEL DASHBOARD (SIN FILTROS MANUALES) 💎💎💎');
        this.authService.user$.subscribe(user => {
            if (user) {
                this.isAdmin = ['ADMIN', 'CNS_NACIONAL'].includes(user?.role || '');
                // Logic for strategic map visibility: ONLY CNS_NACIONAL(ES) or ADMIN
                const role = user?.role || '';
                this.showStrategicMap = ['CNS_NACIONAL', 'CNS_NACIONALES', 'ADMIN'].includes(role);

                this.loadData();
                this.setupAutoRefresh();
            }
        });
    }

    ngOnDestroy() {
        if (this.refreshSubscription) this.refreshSubscription.unsubscribe();
    }

    private setupAutoRefresh() {
        if (this.refreshSubscription) this.refreshSubscription.unsubscribe();
        this.refreshSubscription = interval(this.REFRESH_INTERVAL).subscribe(() => this.loadData());
    }

    loadData() {
        this.today = new Date();

        const requests = {
            summary: this.http.get<any>('/api/v1/dashboard/summary').pipe(catchError(err => { console.error('Summary Error', err); return of(null); })),
            notifications: this.http.get<any[]>('/api/v1/notifications').pipe(catchError(() => of([]))),
            airportStats: this.http.get<any[]>('/api/v1/vhf-equipos/statistics').pipe(catchError(() => of([]))),
            users: (this.isAdmin ? this.http.get<any[]>('/api/v1/users') : of([])).pipe(catchError(() => of([])))
        };

        forkJoin(requests).pipe(
            finalize(() => {
                this.loading = false;
                this.cdr.detectChanges();
            })
        ).subscribe({
            next: (res: any) => {
                console.log('📦 Updated Data:', res);

                if (res.summary) {
                    this.stats = res.summary;
                } else {
                    // Fallback si el summary falló pero otros si llegaron
                    this.stats = this.stats || {
                        global: { total: 0, operational: 0, warning: 0, danger: 0 },
                        categories: { comms: { total: 0, operational: 0 }, nav: { total: 0, operational: 0 }, vig: { total: 0, operational: 0 }, ener: { total: 0, operational: 0 } },
                        context: { error: 'Error al conectar con el servidor' }
                    };
                }

                this.notifications = res.notifications || [];
                const airportData = res.airportStats || [];

                // Mapear tecnicos si hay datos
                if (res.users?.length > 0) {
                    const techMap = new Map();
                    res.users.forEach((u: any) => {
                        if (u.role === 'TECNICO' && u.context?.aeropuerto) {
                            const apt = u.context.aeropuerto.trim();
                            if (!techMap.has(apt)) techMap.set(apt, []);
                            techMap.get(apt).push(`${u.context.nombre} ${u.context.apellido}`);
                        }
                    });
                    this.allAirports = airportData.map((s: any) => ({
                        ...s,
                        technicians: techMap.get(s.name) || []
                    }));
                } else {
                    this.allAirports = airportData.map((s: any) => ({
                        ...s,
                        technicians: []
                    }));
                }

                // Agrupamiento
                const groups: Record<string, any[]> = {};
                this.allAirports.forEach((item: any) => {
                    const fir = item.fir || 'CNS';
                    if (!groups[fir]) groups[fir] = [];
                    groups[fir].push(item);
                });
                this.groupedSummary = groups;
            }
        });
    }

    getPercent() {
        if (!this.stats?.global?.total) return 0;
        return Math.round((this.stats.global.operational / this.stats.global.total) * 100);
    }

    getGroupedEntries() {
        return Object.entries(this.groupedSummary);
    }

    navigateToAirport(apt: string) {
        this.router.navigate(['/comunicaciones'], { queryParams: { aeropuerto: apt } });
    }
}
