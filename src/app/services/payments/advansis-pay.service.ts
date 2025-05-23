import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { environment } from 'src/environments/environment.prod';
import { catchError, tap } from 'rxjs/operators';
import { Inject, Injectable } from '@angular/core';
import { StateService } from '../state.service';

@Injectable({
  providedIn: 'root',
})
export class AdvansisPayService {
  private awServer: string = environment.baseURL;

  constructor(
    private readonly http: HttpClient,
    private stateService: StateService
  ) {}
  // Initiate Payment
  expressPayOnline(epData: any): Observable<any> {
    console.log(`expresspay online data >>> ${JSON.stringify(epData)}`);
    const paymentData = {
      ...epData,
      successUrl: 'lidapay://redirect-url',
      failureUrl: 'lidapay://redirect-url',
      cancelUrl: 'lidapay://redirect-url',
    };

    return this.http
      .post<any>(
        `${this.awServer}/api/v1/advansispay/initiate-payment`,
        paymentData
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
    return this.http
      .get(`${this.awServer}/api/v1/advansispay/query-transaction/${token}`)
      .pipe(
        tap((response) => console.log('Payment status:', response)),
        catchError((error) => {
          console.error('Payment status check failed:', error);
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
