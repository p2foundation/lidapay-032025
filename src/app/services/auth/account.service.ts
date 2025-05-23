import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { StateService } from '../state.service';
import { ApiResponse } from '../../interfaces/api-response.interface';
import { Profile } from '../../interfaces/profile.interface';
import * as QRCode from 'qrcode';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private readonly BASE_URL = environment.baseURL;

  constructor(
    private http: HttpClient,
    private stateService: StateService
  ) {}

  getProfile(): Observable<Profile> {
    const state = this.stateService.getCurrentState();
    console.log('Getting profile with state:', state);

    if (!state?.token) {
      console.error('No token available for profile request');
      return throwError(() => new Error('No token available'));
    }

    const headers = {
      Authorization: `Bearer ${state.token}`,
    };

    return this.http
      .get<Profile>(`${this.BASE_URL}/api/v1/users/profile`, { headers })
      .pipe(
        tap((response) => {
          console.log('Profile response:', response);
          if (response) {
            this.stateService.updateState({ profile: response });
          }
          if (!response.qrCode) {
            this.generateQRCodeForUser();
          }
        }),
        catchError((error) => {
          console.error('Error getting user profile:', error);
          return throwError(() => error);
        })
      );
  }
  // Get All Users
  public findAllRegisteredUsers(
    page: number = 1,
    limit: number = 10
  ): Observable<any> {
    return this.http
      .get(`${this.BASE_URL}/api/v1/users?page=${page}&limit=${limit}`)
      .pipe(
        tap((_) =>
          this.log(
            `AuthService: users fetched for page ${page} with limit ${limit}`
          )
        ),
        catchError(this.handleError('Users', []))
      );
  }
  // Update User Profile
  public updateUserProfile(upData: any): Observable<any> {
    return this.http.put(`${this.BASE_URL}/api/v1/users/profile/update`, upData)
    .pipe(
      tap((response) => this.log(`update user ${JSON.stringify(response)}`)),
      catchError(this.handleError('updateUser', []))
    );
  }
  // Remove User
  public removeUser(userId: string): Observable<any> {
    return this.http
      .delete(`${this.BASE_URL}/api/v1/users/delete/${userId}`)
      .pipe(
        tap((rRes) => this.log(`AuthService: user deleted successfully ..`)),
        catchError(this.handleError('removeUser', []))
      );
  }
  // Generate user invitation link
  generateInvitationLink() {
    // Implement your logic to generate the invitation link
    return this.http
      .get(`${this.BASE_URL}/api/v1/users/invitation-link/generate`)
      .pipe(
        tap((userRes) => this.log(`get user ${JSON.stringify(userRes)}`)),
        catchError(this.handleError('findUserById', []))
      );
  }
  // Track Invitation link
  public trackInvitationLink(invitationLink: string): Observable<any> {
    return this.http
      .post(`${this.BASE_URL}/api/v1/users/invitation-link/track`, invitationLink)
      .pipe(
        tap((userRes) => this.log(`get user ${JSON.stringify(userRes)}`)),
        catchError(this.handleError('findUserById', []))
      );
  }
  // Invitation link stats
  public invitationLinkStats(invitationLink: string): Observable<any> {
 
    return this.http
      .get(
        `${this.BASE_URL}/api/v1/users/invitation-link/stats/${invitationLink}`
      )
      .pipe(
        tap((userRes) => this.log(`get user ${JSON.stringify(userRes)}`)),
        catchError(this.handleError('findUserById', []))
      );
  }
  // Scan UserQR Code
  public scanQRCode(userId: any): Observable<any> {
    return this.http
      .post(`${this.BASE_URL}/api/v1/users/${userId}/scan-qr`, userId)
      .pipe(
        tap((userRes) => this.log(`get user ${JSON.stringify(userRes)}`)),
        catchError(this.handleError('findUserById', []))
      );
  }
  // UserQR Code Stats
  public trackQRCodeStats(): Observable<any> {
    return this.http
      .get(`${this.BASE_URL}/api/v1/users/qr-code-usage-stats`)
      .pipe(
        tap((userRes) => this.log(`get user ${JSON.stringify(userRes)}`)),
        catchError(this.handleError('findUserById', []))
      );
  }
  // Track UserQR Code Usage to award points
  public trackQRCodeUsage(): Observable<any> {
    return this.http
      .get(`${this.BASE_URL}/api/v1/users/track-qr-code-usage`)
      .pipe(
        tap((userRes) => this.log(`get user ${JSON.stringify(userRes)}`)),
        catchError(this.handleError('findUserById', []))
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

  private async generateQRCodeForUser(): Promise<void> {
    const state = this.stateService.getCurrentState();
    if (!state?.profile) {
      console.error('No profile available to generate QR code');
      return;
    }

    try {
      const profileData = {
        id: state.profile._id,
        name: `${state.profile.firstName} ${state.profile.lastName}`,
        email: state.profile.email,
        phone: state.profile.phoneNumber,
        type: 'INVITE',
        timestamp: Date.now()
      };

      const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(profileData), {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Update the user's profile with the new QR code
      this.updateUserProfile({ qrCode: qrCodeDataUrl }).subscribe({
        next: (response) => {
          console.log('QR code generated and saved successfully');
          // Update the state with the new profile including QR code
          this.stateService.updateState({ 
            profile: { ...state.profile, qrCode: qrCodeDataUrl }
          });
        },
        error: (error) => {
          console.error('Error saving QR code:', error);
        }
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }
}
