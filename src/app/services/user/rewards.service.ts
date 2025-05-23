import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { environment } from 'src/environments/environment.prod';
import { catchError, tap } from 'rxjs/operators';
import { ApiResponse } from 'src/app/interfaces/api-response.interface';

export interface Reward {
  _id: string;
  userId: string;
  type: 'INVITE' | 'QRCODE' | 'TRANSACTION';
  points: number;
  description: string;
  status: 'PENDING' | 'COMPLETED' | 'EXPIRED';
  metadata?: any;
  createdAt: string;
}

export interface RewardSummary {
  totalPoints: number;
  availablePoints: number;
  redeemedPoints: number;
  inviteCount: number;
  qrCodeUsage: number;
}

@Injectable({
  providedIn: 'root'
})
export class RewardsService {
  private apiUrl = `${environment.baseURL}/api/v1/rewards`;

  constructor(private http: HttpClient) {}

  getRewardsSummary(): Observable<RewardSummary> {
    return this.http.get<RewardSummary>(`${this.apiUrl}/summary`).pipe(
      tap(response => console.log('Rewards summary:', response))
    );
  }

  getRewardsHistory(page: number = 1, limit: number = 10): Observable<{
    rewards: Reward[];
    total: number;
    totalPages: number;
  }> {
    return this.http.get<any>(`${this.apiUrl}/history?page=${page}&limit=${limit}`).pipe(
      tap(response => console.log('Rewards history:', response))
    );
  }

  generateInvitationLink(): Observable<any> {
    return this.http
    .get<any>(
      `https://api.advansistechnologies.com/api/v1/merchants/generate-invitation-link`
    )
    .pipe(
      tap(response => console.log('Invitation link:', response))
    );
  }

  generateQRCode(): Observable<{ qrCode: string }> {
    return this.http.post<{ qrCode: string }>(`${this.apiUrl}/qr-code`, {}).pipe(
      tap(response => console.log('Generated QR code:', response))
    );
  }

  redeemPoints(points: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/redeem`, { points }).pipe(
      tap(response => console.log('Points redeemed:', response))
    );
  }

  trackQRShare(): Observable<any> {
    return this.http.post(`${this.apiUrl}/track-qr-share`, {}).pipe(
      tap(response => console.log('QR share tracked:', response))
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