import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const token = localStorage.getItem('token');
    const router = inject(Router);

    let clonedReq = req;

    if (token) {
        clonedReq = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    return next(clonedReq).pipe(
        catchError((error) => {
            if (error.status === 401) {
                // Clear storage and redirect on 401
                localStorage.clear();
                router.navigate(['/login']);
            }
            return throwError(() => error);
        })
    );
};
