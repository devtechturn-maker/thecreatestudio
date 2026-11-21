import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

/** Adds the admin JWT to admin API calls and sends the user to login when it expires. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const isAdminCall = req.url.startsWith(`${environment.apiBase}/admin`) || req.url.startsWith(`${environment.apiBase}/auth/me`);
  const token = auth.token;
  const request = isAdminCall && token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  return next(request).pipe(
    catchError((err: HttpErrorResponse) => {
      if (isAdminCall && err.status === 401) {
        auth.logout(false);
        router.navigate(['/admin/login'], { queryParams: { returnUrl: router.url } });
      }
      return throwError(() => err);
    }),
  );
};
