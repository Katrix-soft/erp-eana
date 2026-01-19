import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EquipmentService } from '../../core/services/equipment.service';
import { AuthService } from '../../core/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of, interval, Subscription } from 'rxjs';
import { LucideAngularModule, Radio, Server, Activity, Zap, MapPin, RefreshCw, PlusCircle, Users, LayoutDashboard, CheckCircle, AlertTriangle, Info, History, ChevronRight } from 'lucide-angular';
import { Router, RouterModule } from '@angular/router';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, LucideAngularModule, RouterModule],
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

    stats: any = null;
    groupedSummary: Record<string, any[]> = {};
    notifications: any[] = [];

    // Auto-refresh subscription
    private refreshSubscription?: Subscription;
    private readonly REFRESH_INTERVAL = 30000; // 30 segundos

    readonly Radio = Radio;
    readonly Server = Server;
    readonly Activity = Activity;
    readonly Zap = Zap;
    readonly MapPin = MapPin;
    readonly RefreshCw = RefreshCw;
    readonly PlusCircle = PlusCircle;
    readonly Users = Users;
    readonly LayoutDashboard = LayoutDashboard;
    readonly CheckCircle = CheckCircle;
    readonly AlertTriangle = AlertTriangle;
    readonly Info = Info;
    readonly History = History;
    readonly ChevronRight = ChevronRight;

    ngOnInit() {
        console.log('🚀 Dashboard ngOnInit');

        this.authService.user$.subscribe(user => {
            if (user) {
                this.isAdmin = ['ADMIN', 'CNS_NACIONAL'].includes(user?.role || '');
                this.loadData();
                this.setupAutoRefresh();
            }
        });
    }

    ngOnDestroy() {
        if (this.refreshSubscription) {
            this.refreshSubscription.unsubscribe();
        }
    }

    private setupAutoRefresh() {
        if (this.refreshSubscription) {
            this.refreshSubscription.unsubscribe();
        }
        this.refreshSubscription = interval(this.REFRESH_INTERVAL).subscribe(() => {
            this.loadData();
        });
    }

    loadData() {
        this.loading = true;
        this.today = new Date();

        const requests = {
            summary: this.http.get<any>('/api/v1/dashboard/summary'),
            notifications: this.http.get<any[]>('/api/v1/notifications'),
            // Keep original detailed stats for backward compatibility if needed, 
            // but let's prioritize the new unified summary.
            airportStats: this.http.get<any[]>('/api/v1/vhf-equipos/statistics'),
            users: this.isAdmin ? this.http.get<any[]>('/api/v1/users') : of([])
        };

        forkJoin(requests).subscribe({
            next: (res: any) => {
                this.stats = res.summary;
                this.notifications = res.notifications.slice(0, 10);

                // Process Airport Summary (VHF focus for the grid)
                let summaryArray = [...res.airportStats];
                const user = this.authService.userValue;

                if (res.users.length > 0) {
                    const techMap = new Map();
                    res.users.forEach((u: any) => {
                        if (u.role === 'TECNICO' && u.context?.aeropuerto) {
                            const airport = u.context.aeropuerto.trim();
                            if (!techMap.has(airport)) techMap.set(airport, []);
                            techMap.get(airport).push(`${u.context.nombre} ${u.context.apellido}`);
                        }
                    });
                    summaryArray = summaryArray.map(s => ({
                        ...s,
                        technicians: techMap.get(s.name) || []
                    }));
                } else {
                    summaryArray = summaryArray.map(s => ({ ...s, technicians: [] }));
                }

                // Filtering by context
                if (!this.isAdmin) {
                    const userFir = user?.context?.fir?.trim().toLowerCase();
                    const userAirport = (user?.context?.aeropuertoCodigo || user?.context?.aeropuerto)?.trim().toLowerCase();

                    if (userAirport) {
                        summaryArray = summaryArray.filter((s: any) =>
                            s.name.toLowerCase() === userAirport ||
                            s.name.toLowerCase().includes(userAirport)
                        );
                    } else if (userFir) {
                        summaryArray = summaryArray.filter((s: any) =>
                            (s.fir || '').toLowerCase().includes(userFir)
                        );
                    }
                }

                // Grouping
                const groups: Record<string, any[]> = {};
                summaryArray.forEach((item: any) => {
                    const fir = item.fir || 'Otros';
                    if (!groups[fir]) groups[fir] = [];
                    groups[fir].push(item);
                });
                this.groupedSummary = groups;

                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('❌ Error loading dashboard data:', err);
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    getGroupedEntries() {
        const entries = Object.entries(this.groupedSummary);
        console.log('📋 getGroupedEntries called, returning:', entries, 'length:', entries.length);
        return entries;
    }

    navigateToAirport(airport: string) {
        this.router.navigate(['/comunicaciones'], { queryParams: { aeropuerto: airport } });
    }

    getBreakdownCount(breakdown: any, type: string) {
        if (!breakdown) return 0;
        return Object.entries(breakdown).reduce((acc, [key, val]) => {
            if (key.toLowerCase().includes(type.toLowerCase())) return acc + (val as number);
            return acc;
        }, 0);
    }

    getOthersCount(breakdown: any) {
        if (!breakdown) return 0;
        const known = ['Radio', 'Transmisor', 'Receptor', 'VHF'];
        return Object.entries(breakdown).reduce((acc, [key, val]) => {
            const isKnown = known.some(t => key.toLowerCase().includes(t.toLowerCase()));
            return !isKnown ? acc + (val as number) : acc;
        }, 0);
    }
}
