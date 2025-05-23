import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment.prod';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ReloadlyAirtimeService {
  private awsServer: string = environment.baseURL;

  constructor(private httpClient: HttpClient) {}

  /*
   * Make Reloady Airtime Topup
   */
  makeAirtimeTopup(marData: any): Observable<any> {
    return this.httpClient
      .post<any>(
        `${this.awsServer}/api/v1/reload-airtime/recharge`, 
        marData
        )
      .pipe(
        tap((_res) => this.log(`Reloadly AirtimeService: airtime reload`)),
        catchError(this.handleError('AsyncAirtimeService', []))
      );
  }
  /*
   * Make Async Reloady Airtime Topup
   */
  makeAsyncAirtimeTopup(matData: any): Observable<any> {
    return this.httpClient
      .post<any>(
        `${this.awsServer}/api/v1/reload-airtime/recharge-async`,
        matData
      )
      .pipe(
        tap((_res) => this.log(`AsyncAirtimeService: airtime recharge`)),
        catchError(this.handleError('AsyncAirtimeService', []))
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
