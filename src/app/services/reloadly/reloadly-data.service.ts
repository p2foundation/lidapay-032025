import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root',
})
export class ReloadlyDataService {
  private awsServer: string = environment.apiUrl;

  constructor(private httpClient: HttpClient) {}

  /*
        Get Reloadly Countries
    */
  getReloadlyCountryList(): Observable<any> {
    return this.httpClient.get('./reloadly/countries.json');
  }

  /*
        Buy Reloadly Data
    */
  buyReloadlyData(bidData: any): Observable<any> {
    const url = `${this.awsServer}/api/v1/reloadly-data/buy-data`;
    console.log('[ReloadlyDataService] buyReloadlyData payload:', bidData);
    return this.httpClient.post<any>(url, bidData).pipe(
      tap((_res) => this.log(`ReloadlyDataService: buy data`)),
      catchError(this.handleError('ReloadlyDataService', []))
    );
  }

   /*
    * List country data operators (with bundles) by ISO code, e.g., NG
    */
   listCountryOperators(payload: { countryCode: string }): Observable<any> {
     const url = `${this.awsServer}/api/v1/reloadly-data/list-operators`;
     console.log('[ReloadlyDataService] listCountryOperators payload:', payload);
     return this.httpClient.post<any>(url, payload).pipe(
       tap((_res) => this.log(`ReloadlyDataService: list operators for ${payload.countryCode}`)),
       catchError(this.handleError('ReloadlyDataService listCountryOperators', []))
     );
   }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(error);
      this.log(`${operation} failed: ${error.message}`);
      return of(result as T);
    };
  }

  private log(message: string) {
    console.log(message);
  }
}
