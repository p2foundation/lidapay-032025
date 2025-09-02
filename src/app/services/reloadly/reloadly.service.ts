import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root',
})
export class ReloadlyService {
  private networkLocation = './reloadly/operators.json';
  private countriesLoc = `./reloadly/countries.json`;
  private awsServer: string = environment.apiUrl;

  constructor(private httpClient: HttpClient) {}

  public getReloadlyCountries(): Observable<any> {
    return this.httpClient
      .get(`${this.awsServer}/api/v1/reloadly/countries`)
      .pipe(
        tap((grcRes) => {
          this.log(`RELOADLY COUNTRIES RES==> ${grcRes}`);
        }),
        catchError(this.handleError(`RELOADLY COUNTRIES ERROR`, []))
      );
  }

  public getReloadlyOperators(): Observable<any> {
    return this.httpClient
      .get(`${this.awsServer}/api/v1/reloadly/operators`)
      .pipe(
        tap((groRes) => {
          this.log(`NETWORK OPERATORS : users >>>> ${JSON.stringify(groRes)}`);
        }),
        catchError(this.handleError('Users', []))
      );
  } 
  // Auto detect operator
  public autoDetectOperator(adoData: any): Observable<any> {
    console.log(`AutoDetectOperator input >>>> ${JSON.stringify(adoData)}`);
    console.log(`[AutoDetectOperator PARAM] phone: ${adoData.phone}`);
    console.log(`[AutoDetectOperator PARAM] countryIsoCode: ${adoData.countryIsoCode}`);
    
    // Validate parameters
    if (!adoData.phone || !adoData.countryIsoCode) {
      console.error('Missing required parameters:', { phone: adoData.phone, countryIsoCode: adoData.countryIsoCode });
      return throwError(() => new Error('Missing required parameters: phone and countryIsoCode'));
    }
    
    // Use the correct POST endpoint as shown in successful Postman test
    const url = `${this.awsServer}/api/v1/reloadly/operator/autodetect`;
    
    console.log(`[AutoDetectOperator] Using POST endpoint: ${url}`);
    console.log(`[AutoDetectOperator] Request body:`, adoData);
    
    return this.httpClient
      .post(url, adoData)
      .pipe(
        tap((adoRes) => {
          this.log(
            `[RELOADLYSERVICE] Auto Detect Operator >>>> ${JSON.stringify(
              adoRes
            )}`
          );
        }),
        catchError(this.handleError('Auto Operator', []))
      );
  }
  // Get operator by code
  public getOperatorByCode(gobcData: any): Observable<any> {
    return this.httpClient
      .post<any>(
        `${this.awsServer}/api/v1/reloadly/operator/country-code`,
        gobcData
      )
      .pipe(
        tap((gobcRes) => {
          this.log(`OPERATOR COUNTRY CODE >>>> ${JSON.stringify(gobcRes)}`);
        }),
        catchError(this.handleError('NETWORK OPERATOR CODE', []))
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
    console.log(message);
  }
}
