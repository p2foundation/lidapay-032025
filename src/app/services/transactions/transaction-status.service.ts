import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';
import { environment } from 'src/environments/environment.prod';
import { AdvansisPayService } from '../payments/advansis-pay.service';

export interface TransactionStatusResponse {
  success: boolean;
  status: 'pending' | 'completed' | 'failed';
  message: string;
  data?: any;
  timestamp: string;
}

export interface StatusQueryParams {
  expressToken: string;
  transactionId: string;
  transType: string;
}

@Injectable({
  providedIn: 'root'
})
export class TransactionStatusService {
  private baseURL: string = environment.baseURL;

  constructor(
    private http: HttpClient,
    private advansisPayService: AdvansisPayService
  ) { }

  /**
   * Query transaction status using expressToken
   * This uses the existing AdvansisPayService queryStatus method
   */
  queryTransactionStatus(params: StatusQueryParams): Observable<TransactionStatusResponse> {
    const { expressToken, transactionId, transType } = params;
    
    if (!expressToken) {
      return throwError(() => new Error('Express token is required'));
    }

    console.log('Querying transaction status with expressToken:', expressToken);
    console.log('Transaction ID:', transactionId);
    console.log('Transaction Type:', transType);

    // Use the existing AdvansisPayService queryStatus method
    return this.advansisPayService.queryStatus(expressToken).pipe(
      timeout(30000), // 30 second timeout
      map((response: any) => this.parseStatusResponse(response)),
      catchError(error => {
        console.error('Error querying transaction status:', error);
        return throwError(() => new Error(
          error.error?.message || error.message || 'Failed to query transaction status'
        ));
      })
    );
  }

  /**
   * Query status for airtime transactions specifically
   */
  queryAirtimeStatus(expressToken: string, transactionId: string): Observable<TransactionStatusResponse> {
    return this.queryTransactionStatus({
      expressToken,
      transactionId,
      transType: 'AIRTIMETOPUP'
    });
  }

  /**
   * Query status for money transfer transactions
   */
  queryMoneyTransferStatus(expressToken: string, transactionId: string): Observable<TransactionStatusResponse> {
    return this.queryTransactionStatus({
      expressToken,
      transactionId,
      transType: 'MOMO'
    });
  }

  /**
   * Query status for data bundle transactions
   */
  queryDataBundleStatus(expressToken: string, transactionId: string): Observable<TransactionStatusResponse> {
    return this.queryTransactionStatus({
      expressToken,
      transactionId,
      transType: 'DATABUNDLELIST'
    });
  }

  /**
   * Parse the status response from the AdvansisPayService
   */
  private parseStatusResponse(response: any): TransactionStatusResponse {
    console.log('Raw status response from AdvansisPayService:', response);

    // Handle different response formats from AdvansisPayService
    if (response.success !== undefined) {
      const statusValue = response.status || response.data?.status;
      console.log('Status value extracted:', statusValue, 'Type:', typeof statusValue);
      
      return {
        success: response.success,
        status: this.mapStatus(statusValue),
        message: response.message || response.data?.message || 'Status query completed',
        data: response.data || response,
        timestamp: new Date().toISOString()
      };
    }

    // Handle direct status response
    if (response.status !== undefined) {
      console.log('Direct status value:', response.status, 'Type:', typeof response.status);
      
      return {
        success: true,
        status: this.mapStatus(response.status),
        message: response.message || 'Status retrieved successfully',
        data: response,
        timestamp: new Date().toISOString()
      };
    }

    // Handle error responses
    if (response.error) {
      return {
        success: false,
        status: 'failed',
        message: response.error.message || 'Status query failed',
        data: response,
        timestamp: new Date().toISOString()
      };
    }

    // Default response
    console.log('Using default response for:', response);
    return {
      success: true,
      status: 'pending',
      message: 'Status query completed',
      data: response,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Map API status values to our internal status enum
   */
  private mapStatus(apiStatus: any): 'pending' | 'completed' | 'failed' {
    if (!apiStatus) return 'pending';

    // Ensure apiStatus is a string before calling toLowerCase
    const statusString = String(apiStatus);
    const status = statusString.toLowerCase();
    
    if (status.includes('complete') || status.includes('success') || status.includes('done')) {
      return 'completed';
    }
    
    if (status.includes('fail') || status.includes('error') || status.includes('reject')) {
      return 'failed';
    }
    
    return 'pending';
  }

  /**
   * Check if a transaction is eligible for status query
   */
  isEligibleForStatusQuery(transaction: any): boolean {
    return !!(transaction.expressToken && transaction.transId);
  }

  /**
   * Get the appropriate status query method based on transaction type
   */
  getStatusQueryMethod(transType: string): (expressToken: string, transactionId: string) => Observable<TransactionStatusResponse> {
    switch (transType) {
      case 'AIRTIMETOPUP':
        return (expressToken: string, transactionId: string) => this.queryAirtimeStatus(expressToken, transactionId);
      case 'MOMO':
        return (expressToken: string, transactionId: string) => this.queryMoneyTransferStatus(expressToken, transactionId);
      case 'DATABUNDLELIST':
        return (expressToken: string, transactionId: string) => this.queryDataBundleStatus(expressToken, transactionId);
      default:
        return (expressToken: string, transactionId: string) => this.queryTransactionStatus({ expressToken, transactionId, transType });
    }
  }

  /**
   * Batch query multiple transaction statuses
   */
  batchQueryStatus(transactions: any[]): Observable<TransactionStatusResponse[]> {
    const eligibleTransactions = transactions.filter(tx => this.isEligibleForStatusQuery(tx));
    
    if (eligibleTransactions.length === 0) {
      return throwError(() => new Error('No eligible transactions for status query'));
    }

    // For now, we'll process them sequentially
    // In a production environment, you might want to implement parallel processing
    const statusQueries = eligibleTransactions.map(tx => 
      this.queryTransactionStatus({
        expressToken: tx.expressToken,
        transactionId: tx.transId,
        transType: tx.transType
      })
    );

    // Return the first query result for now
    // You can enhance this to handle multiple queries
    return statusQueries[0].pipe(
      map(status => [status])
    );
  }
}
