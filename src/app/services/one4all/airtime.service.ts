import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class AirtimeService {

  private awsServer: string = environment.baseURL;
  // private awsServer: string = environment.localURL;

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
        catchError(this.handleError('AirtimeService'))
      );
  }

  private handleError<T>(operation = 'operation') {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      this.log(`${operation} failed: ${error.message}`);
      return throwError(() => error);
    };
  }

  private log(message: string) {
    console.log(message);
  }
}
