import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { environment } from 'src/environments/environment.prod';
import { catchError, tap, map } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { StateService } from '../state.service';

@Injectable({
  providedIn: 'root',
})
export class AdvansisPayService {
  private awServer: string = environment.baseURL;
  // private awServer: string = environment.localURL;
  // private awServer: string = environment.vercelURL;

  constructor(
    private readonly http: HttpClient,
    private stateService: StateService
  ) {}
  // Initiate Payment
  expressPayOnline(epData: any): Observable<any> {
    console.log(`[EXPRESSPAY ONLINE params] >>> ${JSON.stringify(epData)}`);

    return this.http
      .post<any>(
        `${this.awServer}/api/v1/advansispay/initiate-payment`,
        epData
      )
      .pipe(
        tap((response) =>
          this.log(
            `Response from expressPayOnline: ${JSON.stringify(response)}`
          )
        ),
        catchError(this.handleError('expressPayOnline', []))
      );
  }
  // Query Status
  queryStatus(token: string): Observable<any> {
    const url = `${this.awServer.replace(/\/$/, '')}/api/v1/advansispay/query-transaction`;
    const requestBody = { token };
    
    console.log('[AdvansisPay] Making POST request to:', url);
    console.log('[AdvansisPay] Request body:', { token: `${token.substring(0, 5)}...${token.substring(token.length - 5)}` });
    
    return this.http.post(url, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      observe: 'response'
    }).pipe(
      tap((response) => {
        console.log('[AdvansisPay] Response status:', response.status);
        console.log('[AdvansisPay] Response headers:', response.headers);
        console.log('[AdvansisPay] Response body:', response.body);
      }),
      map((response: any) => response.body),
      catchError((error) => {
        console.error('[AdvansisPay] Status check failed:', {
          status: error.status,
          statusText: error.statusText,
          error: error.error,
          url: error.url,
          headers: error.headers
        });
        return throwError(() => error);
      })
    );
  }
  // Post Payment Status
  postPaymentStatus(p2sData: any): Observable<any> {
    return this.http
      .post<any>(`${this.awServer}/api/v1/advansispay/post-status`, p2sData)
      .pipe(
        tap((response) =>
          this.log(
            `Response from postPaymentStatus: ${JSON.stringify(response)}`
          )
        ),
        catchError(this.handleError('postPaymentStatus', []))
      );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(error); // log to console instead
      this.log(`${operation} failed: ${error.message}`);

      return of(result as T);
    };
  }

  private log(message: string) {
    console.log(JSON.stringify(message));
  }
}
