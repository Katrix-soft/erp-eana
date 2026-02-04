
import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, Event } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { AiAssistantComponent } from './shared/components/ai-assistant/ai-assistant.component';
import { AuthService } from './core/services/auth.service';
import { filter, map, startWith, combineLatest } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, ToastContainerComponent, AiAssistantComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend-angular');
  private authService = inject(AuthService);
  private router = inject(Router);

  // Lógica combinada: Mostrar chat solo si hay usuario Y no estamos en login
  showAssistant$ = combineLatest([
    this.authService.user$,
    this.router.events.pipe(
      filter((e: Event): e is NavigationEnd => e instanceof NavigationEnd),
      map((e: NavigationEnd) => e.urlAfterRedirects || e.url),
      startWith(null) // Iniciamos con null para esperar la navegación real o leer router.url
    )
  ]).pipe(
    map(([user, url]) => {
      // Si no tenemos url del evento, intentamos usar la actual del router
      const currentUrl = url ?? this.router.url;
      const cleanPath = currentUrl.split('?')[0];

      // Debe haber usuario y NO estar en login
      return !!user && !cleanPath.includes('/login');
    })
  );
}
