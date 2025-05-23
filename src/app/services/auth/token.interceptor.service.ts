import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { StorageService } from '../storage.service';
import { StateService } from '../state.service';
import { catchError, filter, switchMap, take, tap, finalize } from 'rxjs/operators';
import { BehaviorSubject, from, throwError, Observable } from 'rxjs';

export const TokenInterceptorService: HttpInterceptorFn = (req, next) => {
  const stateService = inject(StateService);
  const authService = inject(AuthService);
  const router = inject(Router);
  const storage = inject(StorageService);

  if (req.url.includes('/api/v1/users/login') || 
      req.url.includes('/api/v1/users/register') ||
      req.url.includes('/assets/i18n/')) {
    return next(req);
  }

  const state = stateService.getCurrentState();
  const token = state?.token;

  if (!token) {
    console.warn('[TokenInterceptor] No token found');
    return handleLogout();
  }

  const clonedRequest = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    }
  });

  return next(clonedRequest).pipe(
    tap({
      next: (event) => {
        if (event instanceof HttpResponse) {
          console.log('[TokenInterceptor] Response:', {
            url: req.url,
            status: event.status,
            ok: event.ok
          });
        }
      },
      error: (error) => {
        if (error instanceof HttpErrorResponse) {
          console.error('[TokenInterceptor] Error:', {
            url: req.url,
            status: error.status,
            message: error.message
          });
        }
      }
    }),
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        return handle401Error(clonedRequest, next);
      }
      return throwError(() => error);
    })
  );
};

function handle401Error(req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> {
  const authService = inject(AuthService);
  const refreshTokenSubject = new BehaviorSubject<any>(null);
  let isRefreshing = false;

  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return from(authService.refreshToken()).pipe(
      switchMap((token: any) => {
        isRefreshing = false;
        refreshTokenSubject.next(token);
        return next(addToken(req));
      }),
      catchError(err => {
        isRefreshing = false;
        authService.logout();
        return throwError(() => err);
      })
    );
  }

  return refreshTokenSubject.pipe(
    filter(token => token !== null),
    take(1),
    switchMap(() => next(addToken(req)))
  );
}

function handleLogout(): Observable<HttpEvent<any>> {
  const router = inject(Router);
  const storage = inject(StorageService);
  const stateService = inject(StateService);

  console.log('[Interceptor] Handling logout');
  Promise.all([
    storage.clearStorage(),
    stateService.clearState()
  ]).then(() => {
    router.navigate(['/login'], { replaceUrl: true });
  });
  return throwError(() => new HttpErrorResponse({
    error: 'Session expired',
    status: 401,
    statusText: 'Unauthorized'
  }));
}

function addToken(request: HttpRequest<any>): HttpRequest<any> {
  const stateService = inject(StateService);
  const state = stateService.getCurrentState();
  const token = state?.token;
  if (token) {
    return request.clone({
      headers: request.headers.set('Authorization', `Bearer ${token}`)
    });
  }
  return request;
}