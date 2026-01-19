import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { AuthService } from '../../../core/services/auth.service';
import { LucideAngularModule, Menu, ChevronRight, Globe, Plane, MapPin } from 'lucide-angular';
import { NotificationDropdownComponent } from '../notification-dropdown/notification-dropdown.component';
import { filter } from 'rxjs/operators';

@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [CommonModule, RouterModule, SidebarComponent, LucideAngularModule, NotificationDropdownComponent],
    templateUrl: './layout.component.html',
    styleUrl: './layout.component.css'
})
export class LayoutComponent implements OnInit {
    private authService = inject(AuthService);
    private router = inject(Router);

    isSidebarOpen = false;
    user$ = this.authService.user$;
    loading$ = this.authService.loading$;
    isFullWidth = false;

    readonly Menu = Menu;
    readonly ChevronRight = ChevronRight;
    readonly Globe = Globe;
    readonly Plane = Plane;
    readonly MapPin = MapPin;

    ngOnInit() {
        this.updateFullWidthState(this.router.url);
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe((event: any) => {
            this.updateFullWidthState(event.urlAfterRedirects);
        });
    }

    private updateFullWidthState(url: string) {
        this.isFullWidth = url.includes('/chat') || url.includes('/mimic');
    }

    toggleSidebar() {
        this.isSidebarOpen = !this.isSidebarOpen;
        if (this.isSidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }

    closeSidebar() {
        this.isSidebarOpen = false;
        document.body.style.overflow = 'unset';
    }
}
