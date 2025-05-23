import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class AirtimeService {

  private awsServer: string = environment.baseURL;
  // private localServer: string = environment.local;

  constructor(
    private readonly http: HttpClient
  ) {
  }

  public buyAirtimeTopup(mData: any): Observable<any> {
    console.log('buyAirtime service - params ==>', mData);
    return this.http
      .post<any>(`${this.awsServer}/api/v1/airtime/topup`, mData)
      .pipe(
        tap(_res => this.log(`AirtimeService: airtime credit`)),
        catchError(this.handleError('AirtimeService', []))
      );
  }


  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(error); // log to console instead
      alert(error);
      this.log(`${operation} failed: ${error.message}`);
      return of(result as T);
    };
  }

  private log(message: string) {
    console.log(message);
  }
}
