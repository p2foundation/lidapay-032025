import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class DebugInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.url.includes('i18n')) {
      console.log('Loading translation file:', req.url);
    }
    return next.handle(req).pipe(
      tap(event => {
        if (req.url.includes('i18n')) {
          console.log('Translation response:', event);
        }
      })
    );
  }
} 