import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { catchError, map, tap, switchMap, retry } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { StorageService } from './storage.service';
import { NotificationService } from './notification.service';
import { 
  Wallet, 
  WalletTransaction, 
  WalletBalance, 
  WalletStats, 
  WalletSettings,
  WalletRecharge,
  WalletWithdrawal,
  WalletTransfer,
  WalletAnalytics
} from '../interfaces/wallet.interface';

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private baseURL: string = environment.baseURL;
  private walletCache = new BehaviorSubject<Wallet | null>(null);
  private balanceCache = new BehaviorSubject<WalletBalance | null>(null);
  private transactionsCache = new BehaviorSubject<WalletTransaction[]>([]);
  private statsCache = new BehaviorSubject<WalletStats | null>(null);

  constructor(
    private http: HttpClient,
    private storage: StorageService,
    private notificationService: NotificationService
  ) {
    this.initializeWallet();
  }

  // Cache management
  get wallet$() { return this.walletCache.asObservable(); }
  get balance$() { return this.balanceCache.asObservable(); }
  get transactions$() { return this.transactionsCache.asObservable(); }
  get stats$() { return this.statsCache.asObservable(); }

  /**
   * Initialize wallet data from storage and API
   */
  private async initializeWallet() {
    try {
      // Try to get cached wallet data
      const cachedWallet = await this.storage.getStorage('wallet');
      if (cachedWallet) {
        this.walletCache.next(cachedWallet);
        this.balanceCache.next({
          available: cachedWallet.balance,
          pending: 0,
          reserved: 0,
          total: cachedWallet.balance,
          currency: cachedWallet.currency,
          lastUpdated: cachedWallet.lastUpdated
        });
      }

      // Refresh from API
      this.refreshWalletData();
    } catch (error) {
      console.error('Error initializing wallet:', error);
    }
  }

  /**
   * Get wallet information
   */
  getWallet(): Observable<Wallet> {
    return this.wallet$.pipe(
      switchMap(wallet => {
        if (wallet) {
          return of(wallet);
        }
        return this.fetchWalletFromAPI();
      }),
      catchError(error => {
        console.error('Error getting wallet:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Fetch wallet from API
   */
  private fetchWalletFromAPI(): Observable<Wallet> {
    return this.http.get<Wallet>(`${this.baseURL}/api/v1/wallet`).pipe(
      tap(wallet => {
        this.walletCache.next(wallet);
        this.storage.setStorage('wallet', wallet);
      }),
      catchError(error => {
        console.error('Error fetching wallet from API:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get wallet balance
   */
  getBalance(): Observable<WalletBalance> {
    return this.balance$.pipe(
      switchMap(balance => {
        if (balance) {
          return of(balance);
        }
        return this.fetchBalanceFromAPI();
      }),
      catchError(error => {
        console.error('Error getting balance:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Fetch balance from API
   */
  private fetchBalanceFromAPI(): Observable<WalletBalance> {
    return this.http.get<WalletBalance>(`${this.baseURL}/api/v1/wallet/balance`).pipe(
      tap(balance => {
        this.balanceCache.next(balance);
      }),
      catchError(error => {
        console.error('Error fetching balance from API:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get wallet transactions
   */
  getTransactions(limit: number = 50, offset: number = 0): Observable<WalletTransaction[]> {
    return this.http.get<WalletTransaction[]>(`${this.baseURL}/api/v1/wallet/transactions`, {
      params: { limit: limit.toString(), offset: offset.toString() }
    }).pipe(
      tap(transactions => {
        if (offset === 0) {
          this.transactionsCache.next(transactions);
        } else {
          const currentTransactions = this.transactionsCache.value;
          this.transactionsCache.next([...currentTransactions, ...transactions]);
        }
      }),
      catchError(error => {
        console.error('Error fetching transactions:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get wallet statistics
   */
  getStats(period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly'): Observable<WalletStats> {
    return this.http.get<WalletStats>(`${this.baseURL}/api/v1/wallet/stats`, {
      params: { period }
    }).pipe(
      tap(stats => {
        this.statsCache.next(stats);
      }),
      catchError(error => {
        console.error('Error fetching wallet stats:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get wallet analytics
   */
  getAnalytics(period: 'daily' | 'weekly' | 'monthly' | 'yearly', startDate: string, endDate: string): Observable<WalletAnalytics> {
    return this.http.get<WalletAnalytics>(`${this.baseURL}/api/v1/wallet/analytics`, {
      params: { period, startDate, endDate }
    }).pipe(
      catchError(error => {
        console.error('Error fetching wallet analytics:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Recharge wallet
   */
  rechargeWallet(rechargeData: Omit<WalletRecharge, '_id' | 'status' | 'createdAt' | 'updatedAt'>): Observable<WalletRecharge> {
    return this.http.post<WalletRecharge>(`${this.baseURL}/api/v1/wallet/recharge`, rechargeData).pipe(
      tap(recharge => {
        this.notificationService.showSuccess(`Wallet recharge initiated for ${recharge.amount} ${recharge.currency}`);
        // Refresh wallet data after recharge
        this.refreshWalletData();
      }),
      catchError(error => {
        console.error('Error recharging wallet:', error);
        this.notificationService.showError('Failed to recharge wallet');
        return throwError(() => error);
      })
    );
  }

  /**
   * Withdraw from wallet
   */
  withdrawFromWallet(withdrawalData: Omit<WalletWithdrawal, '_id' | 'status' | 'createdAt' | 'updatedAt'>): Observable<WalletWithdrawal> {
    return this.http.post<WalletWithdrawal>(`${this.baseURL}/api/v1/wallet/withdraw`, withdrawalData).pipe(
      tap(withdrawal => {
        this.notificationService.showSuccess(`Withdrawal initiated for ${withdrawal.amount} ${withdrawal.currency}`);
        // Refresh wallet data after withdrawal
        this.refreshWalletData();
      }),
      catchError(error => {
        console.error('Error withdrawing from wallet:', error);
        this.notificationService.showError('Failed to withdraw from wallet');
        return throwError(() => error);
      })
    );
  }

  /**
   * Transfer between wallets
   */
  transferBetweenWallets(transferData: Omit<WalletTransfer, '_id' | 'status' | 'createdAt' | 'updatedAt'>): Observable<WalletTransfer> {
    return this.http.post<WalletTransfer>(`${this.baseURL}/api/v1/wallet/transfer`, transferData).pipe(
      tap(transfer => {
        this.notificationService.showSuccess(`Transfer initiated for ${transfer.amount} ${transfer.currency}`);
        // Refresh wallet data after transfer
        this.refreshWalletData();
      }),
      catchError(error => {
        console.error('Error transferring between wallets:', error);
        this.notificationService.showError('Failed to transfer between wallets');
        return throwError(() => error);
      })
    );
  }

  /**
   * Get wallet settings
   */
  getSettings(): Observable<WalletSettings> {
    return this.http.get<WalletSettings>(`${this.baseURL}/api/v1/wallet/settings`).pipe(
      catchError(error => {
        console.error('Error fetching wallet settings:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update wallet settings
   */
  updateSettings(settings: Partial<WalletSettings>): Observable<WalletSettings> {
    return this.http.put<WalletSettings>(`${this.baseURL}/api/v1/wallet/settings`, settings).pipe(
      tap(updatedSettings => {
        this.notificationService.showSuccess('Wallet settings updated successfully');
      }),
      catchError(error => {
        console.error('Error updating wallet settings:', error);
        this.notificationService.showError('Failed to update wallet settings');
        return throwError(() => error);
      })
    );
  }

  /**
   * Get transaction by ID
   */
  getTransaction(transactionId: string): Observable<WalletTransaction> {
    return this.http.get<WalletTransaction>(`${this.baseURL}/api/v1/wallet/transactions/${transactionId}`).pipe(
      catchError(error => {
        console.error('Error fetching transaction:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Search transactions
   */
  searchTransactions(query: string, filters?: {
    type?: string;
    category?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
  }): Observable<WalletTransaction[]> {
    const params: any = { query };
    if (filters) {
      Object.assign(params, filters);
    }

    return this.http.get<WalletTransaction[]>(`${this.baseURL}/api/v1/wallet/transactions/search`, { params }).pipe(
      catchError(error => {
        console.error('Error searching transactions:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Export transactions
   */
  exportTransactions(format: 'csv' | 'pdf' | 'excel', filters?: any): Observable<Blob> {
    const params: any = { format };
    if (filters) {
      Object.assign(params, filters);
    }

    return this.http.get(`${this.baseURL}/api/v1/wallet/transactions/export`, {
      params,
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.error('Error exporting transactions:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Refresh all wallet data
   */
  refreshWalletData() {
    this.fetchWalletFromAPI().subscribe();
    this.fetchBalanceFromAPI().subscribe();
    this.getTransactions(50, 0).subscribe();
    this.getStats('monthly').subscribe();
  }

  /**
   * Clear wallet cache
   */
  clearCache() {
    this.walletCache.next(null);
    this.balanceCache.next(null);
    this.transactionsCache.next([]);
    this.statsCache.next(null);
  }

  /**
   * Check if wallet has sufficient balance
   */
  hasSufficientBalance(amount: number): Observable<boolean> {
    return this.balance$.pipe(
      map(balance => {
        if (!balance) return false;
        return balance.available >= amount;
      })
    );
  }

  /**
   * Get formatted balance for display
   */
  getFormattedBalance(): Observable<string> {
    return this.balance$.pipe(
      map(balance => {
        if (!balance) return '0.00';
        return new Intl.NumberFormat('en-GH', {
          style: 'currency',
          currency: balance.currency,
          minimumFractionDigits: 2
        }).format(balance.available);
      })
    );
  }

  /**
   * Get transaction summary
   */
  getTransactionSummary(): Observable<{
    total: number;
    pending: number;
    completed: number;
    failed: number;
  }> {
    return this.transactions$.pipe(
      map(transactions => {
        const summary = {
          total: transactions.length,
          pending: 0,
          completed: 0,
          failed: 0
        };

        transactions.forEach(transaction => {
          switch (transaction.status) {
            case 'pending':
              summary.pending++;
              break;
            case 'completed':
              summary.completed++;
              break;
            case 'failed':
              summary.failed++;
              break;
          }
        });

        return summary;
      })
    );
  }

  /**
   * Simulate wallet operations for development/testing
   */
  simulateWalletOperation(operation: 'recharge' | 'withdrawal' | 'transaction', amount: number) {
    const currentWallet = this.walletCache.value;
    if (!currentWallet) return;

    const updatedWallet = { ...currentWallet };
    
    switch (operation) {
      case 'recharge':
        updatedWallet.balance += amount;
        break;
      case 'withdrawal':
        updatedWallet.balance = Math.max(0, updatedWallet.balance - amount);
        break;
      case 'transaction':
        updatedWallet.balance = Math.max(0, updatedWallet.balance - amount);
        break;
    }

    updatedWallet.lastUpdated = new Date().toISOString();
    this.walletCache.next(updatedWallet);
    this.storage.setStorage('wallet', updatedWallet);

    // Update balance cache
    const currentBalance = this.balanceCache.value;
    if (currentBalance) {
      this.balanceCache.next({
        ...currentBalance,
        available: updatedWallet.balance,
        total: updatedWallet.balance,
        lastUpdated: updatedWallet.lastUpdated
      });
    }
  }
}
