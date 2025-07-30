import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError, timer } from 'rxjs';
import { catchError, tap, retryWhen, concatMap, delay } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

interface ApiResponse<T> {
  status: string;
  message?: string;
  data?: T;
}

interface InternetDataRequest {
  recipientNumber: string;
  dataCode: string;
  network: string;
  amount: number;
  description: string;
  transType: string;
  payTransRef: string;
  [key: string]: any;
}

export interface ValidationResponse {
  valid: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class InternetDataService {

  private awsServer: string = environment.baseURL;
  constructor(
    private readonly http: HttpClient
  ) { }

  public internetBundleList(iData: any): Observable<any> {
    console.log('DATA BUNDLELIST service - params ==>', iData);
    return this.http
      .post<any>(`${this.awsServer}/api/v1/internet/bundlelist`, iData)
      .pipe(
        tap(_res => console.log(`DATA BUNDLELIST response: ...`)),
        catchError((_err) => {
          console.error(`DATA BUNDLELIST error: ${JSON.stringify(_err)}`);
          throw new Error(_err);
        })
      );
  }

  public buyInternetData(iData: any): Observable<any> {
    console.log('BUY INTERNET DATA service - params ==>', iData);
    return this.http
      .post<any>(`${this.awsServer}/api/v1/internet/buydata`, iData)
      .pipe(
        tap(_res => console.log(`BUY INTERNET DATA response: ...`)),
        catchError((_err) => {
          console.error(`BUY INTERNET DATA error: ${JSON.stringify(_err)}`);
          throw new Error(_err);
        })
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
