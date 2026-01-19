import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-skeleton-loader',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="skeleton-container space-y-4">
            <div *ngFor="let _ of items" 
                 class="skeleton-item bg-slate-900/40 rounded-2xl p-6 border border-white/5">
                <div class="flex items-center gap-4">
                    <!-- Frequency placeholder -->
                    <div class="skeleton-box w-32 h-16 rounded-lg"></div>
                    
                    <!-- Content placeholder -->
                    <div class="flex-1 space-y-3">
                        <div class="skeleton-box h-6 w-3/4 rounded"></div>
                        <div class="skeleton-box h-4 w-1/2 rounded"></div>
                    </div>
                    
                    <!-- Status badge placeholder -->
                    <div class="skeleton-box w-24 h-8 rounded-lg"></div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .skeleton-box {
            background: linear-gradient(
                90deg,
                rgba(255, 255, 255, 0.05) 25%,
                rgba(255, 255, 255, 0.1) 50%,
                rgba(255, 255, 255, 0.05) 75%
            );
            background-size: 200% 100%;
            animation: loading 1.5s infinite;
        }

        @keyframes loading {
            0% {
                background-position: 200% 0;
            }
            100% {
                background-position: -200% 0;
            }
        }

        .skeleton-item {
            animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `]
})
export class SkeletonLoaderComponent {
    @Input() count = 5;

    get items(): number[] {
        return Array(this.count).fill(0);
    }
}
