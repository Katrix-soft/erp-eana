import { Component, inject, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Bell, Check } from 'lucide-angular';
import { NotificationService, Notification } from '../../../core/services/notification.service';
import { ToastService, ToastType } from '../../../core/services/toast.service';
import { interval, Subscription } from 'rxjs';

@Component({
    selector: 'app-notification-dropdown',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    templateUrl: './notification-dropdown.component.html',
    styleUrls: ['./notification-dropdown.component.css']
})
export class NotificationDropdownComponent implements OnInit, OnDestroy {
    private notificationService = inject(NotificationService);
    private toastService = inject(ToastService);
    private eRef = inject(ElementRef);

    notifications: Notification[] = [];
    isOpen = false;
    unreadCount = 0;
    private pollSubscription?: Subscription;
    private lastNotificationId = 0;
    private isFirstLoad = true;

    readonly Bell = Bell;
    readonly Check = Check;

    ngOnInit() {
        this.fetchNotifications();
        this.pollSubscription = interval(30000).subscribe(() => this.fetchNotifications());
    }

    ngOnDestroy() {
        this.pollSubscription?.unsubscribe();
    }

    @HostListener('document:click', ['$event'])
    clickout(event: any) {
        if (!this.eRef.nativeElement.contains(event.target)) {
            this.isOpen = false;
        }
    }

    fetchNotifications() {
        this.notificationService.getNotifications().subscribe({
            next: (data) => {
                const notifications = Array.isArray(data) ? data : [];
                if (this.isFirstLoad) {
                    if (notifications.length > 0) {
                        this.lastNotificationId = Math.max(...notifications.map(n => n.id));
                    }
                    this.isFirstLoad = false;
                } else {
                    const newItems = notifications.filter(n => n.id > this.lastNotificationId);
                    if (newItems.length > 0) {
                        newItems.forEach(item => {
                            this.toastService.show(
                                item.message,
                                (item.type.toLowerCase() as ToastType) || 'info',
                                'Nueva Notificación'
                            );
                        });
                        this.lastNotificationId = Math.max(...notifications.map(n => n.id));
                    }
                }
                this.notifications = notifications;
                this.unreadCount = notifications.filter(n => !n.read).length;
            },
            error: (err) => {
                console.error("Failed to fetch notifications", err);
                this.notifications = [];
            }
        });
    }

    markAsRead(event: Event, id: number) {
        event.stopPropagation();
        this.notificationService.markAsRead(id).subscribe(() => {
            this.notifications = this.notifications.map(n => n.id === id ? { ...n, read: true } : n);
            this.unreadCount = Math.max(0, this.unreadCount - 1);
        });
    }

    markAllAsRead() {
        this.notificationService.markAllAsRead().subscribe(() => {
            this.notifications = this.notifications.map(n => ({ ...n, read: true }));
            this.unreadCount = 0;
        });
    }

    notifTypeColor(type: string) {
        switch (type) {
            case 'SUCCESS': return 'bg-emerald-500 shadow-emerald-500/50';
            case 'WARNING': return 'bg-amber-500 shadow-amber-500/50';
            case 'ERROR': return 'bg-red-500 shadow-red-500/50';
            default: return 'bg-blue-500 shadow-blue-500/50';
        }
    }

    toggleDropdown() {
        this.isOpen = !this.isOpen;
    }
}
