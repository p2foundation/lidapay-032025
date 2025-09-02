import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment.prod';
// import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class HistoryService {
  private hsURL: string = environment.baseURL;
  // private hsLocalURL: string = environment.localhost;
  constructor(private http: HttpClient) {}

  //Get all transaction history
  public getTransactionHistory(page: number, limit: number): Observable<any> {
    return this.http
      .get(`${this.hsURL}/api/v1/transactions?page=${page}&limit=${limit}`)
      .pipe(
        tap((_) => this.log(`fetched transaction history`)),
        catchError(this.handleError('getTransactionHistory', []))
      );
  }
  //Get transaction by userId
  public getTransactionByUserId(
    userId: string,
    page: number,
    limit: number
  ): Observable<any> {
    console.log(' => getTransactionByuserId', userId);
    console.log('page', page);
    console.log('limit', limit);
    return this.http
      .get(
        `${this.hsURL}/api/v1/transactions/user/${userId}?page=${page}&limit=${limit}`
      )
      .pipe(
        tap((_) => this.log(`fetched transaction by userId ${userId}`)),
        catchError(this.handleError('getTransactionByUserId', []))
      );
  }
  //Get transaction by transactionId
  public  getTransactionByTransactionId(transactionId: string): Observable<any> {
    return this.http
      .get(`${this.hsURL}/api/v1/transactions/${transactionId}`)
      .pipe(
        tap((_) => this.log(`fetched transaction by transactionId`)),
        catchError(this.handleError('getTransactionByTransactionId', []))
      );
  }
  //Find transaction by type: airtime, momo
  public getTransactionByType(type: string): Observable<any> {
    return this.http.get(`${this.hsURL}/api/v1/transactions/type/${type}`).pipe(
      tap((_) => this.log(`fetched transaction by type`)),
      catchError(this.handleError('getTransactionByType', []))
    );
  }
  // Get transaction statistics for a user
  public getTransactionStatisticsByUserId(userId: string): Observable<any> {
    return this.http
      .get(`${this.hsURL}/api/v1/transactions/statistics/user/${userId}`)
      .pipe(
        tap((_) => this.log(`fetched transaction statistics by userId`)),
        catchError(this.handleError('getTransactionStatisticsByUserId', []))
      );
  }

  // Get transaction counts by status for a user
  public getTransactionCountsByUserId(userId: string): Observable<any> {
    return this.http
      .get(`${this.hsURL}/api/v1/transactions/counts/user/${userId}`)
      .pipe(
        tap((_) => this.log(`fetched transaction counts by userId`)),
        catchError(this.handleError('getTransactionCountsByUserId', []))
      );
  }
  // Get transactions by date range
  public getTransactionsByDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Observable<any> {
    return this.http
      .get(
        `${this.hsURL}/api/v1/transactions/date-range/user/${userId}?startDate=${startDate}&endDate=${endDate}`
      )
      .pipe(
        tap((_) => this.log(`fetched transactions by date range`)),
        catchError(this.handleError('getTransactionsByDateRange', []))
      );
  }
  //Update transactions by transactionId
  public updateTransactionByTransactionId(
    transactionId: string,
    data: any
  ): Observable<any> {
    return this.http
      .put(`${this.hsURL}/api/v1/transactions/${transactionId}`, data)
      .pipe(
        tap((_) => this.log(`updated transaction by transactionId`)),
        catchError(this.handleError('updateTransactionByTransactionId', []))
      );
  }
  // Update a transaction by trxnId
  public updateTransactionByTrxnId(trxnId: string, data: any): Observable<any> {
    return this.http
      .put(`${this.hsURL}/api/v1/transactions/update-by-trxn/${trxnId}`, data)
      .pipe(
        tap((_) => this.log(`updated transaction by trxnId`)),
        catchError(this.handleError('updateTransactionByTrxnId', []))
      );
  }
  // Delete Transaction by transactionId
  public deleteTransactionByTransactionId(
    transactionId: string
  ): Observable<any> {
    return this.http
      .delete(`${this.hsURL}/api/v1/transactions/${transactionId}`)
      .pipe(
        tap((_) => this.log(`deleted transaction by transactionId`)),
        catchError(this.handleError('deleteTransactionByTransactionId', []))
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
