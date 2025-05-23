import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of, firstValueFrom } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { ApiResponse } from 'src/app/interfaces/api-response.interface';

export interface Account {
  _id: string;
  userId: string;
  accountId: string;
  balance: number;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
}

export interface Wallet {
  _id: string;
  userId: string;
  accountId: string;
  balance: number;
  currency: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  transactions: WalletTransaction[];
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  _id: string;
  walletId: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  reference: string;
  metadata?: any;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private readonly apiUrl = `${environment.baseURL}/api/v1/users`;
  private walletSubject = new BehaviorSubject<Wallet | null>(null);
  private accountSubject = new BehaviorSubject<Account | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  
  wallet$ = this.walletSubject.asObservable();
  account$ = this.accountSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  async loadWalletAndAccount() {
    if (this.loadingSubject.value) return;
    
    this.loadingSubject.next(true);
    try {
      const [wallet, account] = await Promise.all([
        firstValueFrom(this.getUserWallet()),
        firstValueFrom(this.getUserAccount())
      ]);

      if (!wallet && !account) {
        console.error('Failed to load wallet and account');
      }
    } catch (error) {
      console.error('Failed to load wallet/account:', error);
    } finally {
      this.loadingSubject.next(false);
    }
  }

  getUserWallet(): Observable<Wallet | null> {
    return this.http.get<ApiResponse<Wallet>>(`${this.apiUrl}/wallet/user`)
      .pipe(
        map(response => response.data),
        tap(wallet => {
          console.log('Wallet loaded:', wallet);
          this.walletSubject.next(wallet);
        }),
        catchError(error => {
          console.error('Error loading wallet:', error);
          this.walletSubject.next(null);
          return of(null);
        })
      );
  }

  getUserAccount(): Observable<Account | null> {
    return this.http.get<ApiResponse<Account>>(`${this.apiUrl}/account`)
      .pipe(
        map(response => response.data),
        tap(account => {
          console.log('Account loaded:', account);
          this.accountSubject.next(account);
        }),
        catchError(error => {
          console.error('Error loading account:', error);
          this.accountSubject.next(null);
          return of(null);
        })
      );
  }

  getWalletBalance(): Observable<number> {
    return this.wallet$.pipe(
      map(wallet => wallet?.balance || 0)
    );
  }

  getAccountBalance(): Observable<number> {
    return this.account$.pipe(
      map(account => account?.balance || 0)
    );
  }

  getTransactionHistory(page: number = 1, limit: number = 10): Observable<{
    transactions: WalletTransaction[];
    total: number;
    pages: number;
  }> {
    return this.http.get<ApiResponse<{
      transactions: WalletTransaction[];
      total: number;
      pages: number;
    }>>(`${this.apiUrl}/wallet/transactions?page=${page}&limit=${limit}`)
    .pipe(
      map(response => response.data)
    );
  }

  initiateTopup(amount: number): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/wallet/topup`, { amount });
  }

  verifyTopup(reference: string): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/wallet/verify-topup`, { reference });
  }

  transferFunds(recipientId: string, amount: number, description: string): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/wallet/transfer`, {
      recipientId,
      amount,
      description
    });
  }
}
