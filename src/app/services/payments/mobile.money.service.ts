import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {Observable, of} from 'rxjs';
import {catchError, tap} from 'rxjs/operators';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class MobileMoneyService {

  public awServer: string = environment.baseURL;
  private vercelServer: string = environment.baseURL;

  // private localServer: any = environment.local;

  constructor(
    private readonly http: HttpClient
  ) {
  }

  public debitWalletPayswitch(mData: any): Observable<any> {
    console.debug(`PRYMO PAY RECEIVE MONEY service - params ==>${JSON.stringify(mData)}`);
    return this.http.post(`${this.awServer}/api/v1/psmobilemoney/debitwallet`, mData)
      .pipe(
        tap((_res) => this.log(`PRYMO PAY RECEIVE MONEY =>`)),
        catchError(this.handleError('PaymentService', []))
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
