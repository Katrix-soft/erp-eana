import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.userValue) {
        const requiredRoles = route.data['roles'] as string[];
        if (requiredRoles && !requiredRoles.includes(authService.userValue.role)) {
            router.navigate(['/dashboard']);
            return false;
        }
        return true;
    }

    router.navigate(['/login']);
    return false;
};
