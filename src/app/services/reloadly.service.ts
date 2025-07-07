import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root',
})
export class ReloadlyService {
  private apiUrl = environment.baseURL;
  // private apiUrl = environment.localURL;

  constructor(private http: HttpClient) {}

  getReloadlyCountries(): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/v1/reloadly/countries`).pipe(
      tap((response) => console.log('Countries response:', response)),
      catchError((error) => {
        console.error('RELOADLY COUNTRIES ERROR', error);
        return throwError(() => error);
      })
    );
  }

  autoDetectOperator(params: any): Observable<any> {
    const apiParams = {
      phone: params.phone,
      countryIsoCode: params.countryIsoCode,
    };

    console.log('AutoDetectOperator input >>>>', apiParams);

    return this.http
      .post(`${this.apiUrl}/api/v1/reloadly/operator/autodetect`, apiParams)
      .pipe(
        tap((response) => console.log('Auto detect response:', response)),
        catchError((error) => {
          console.error('Auto detect error:', error);
          return throwError(() => error);
        })
      );
  }

  getOperators(countryIso: string): Observable<any> {
    return this.http
      .get(`${this.apiUrl}/api/v1/reloadly/operators/${countryIso}`)
      .pipe(
        tap((response) => console.log('Operators response:', response)),
        catchError((error) => {
          console.error('Get operators error:', error);
          return throwError(() => error);
        })
      );
  }

  submitAirtime(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/v1/reloadly/topup`, data).pipe(
      tap((response) => console.log('Submit airtime response:', response)),
      catchError((error) => {
        console.error('Airtime submission failed:', error);
        return throwError(() => error);
      })
    );
  }

  getCountries(): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/v1/reloadly/countries`).pipe(
      tap((response) => console.log('Countries response:', response)),
      catchError((error) => {
        console.error('RELOADLY COUNTRIES ERROR', error);
        return throwError(() => error);
      })
    );
  }
}
