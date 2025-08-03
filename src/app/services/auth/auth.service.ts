import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError, from } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { StorageService } from '../storage.service';
import { StateService } from '../state.service';

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly BASE_URL = environment.baseURL;
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private storage: StorageService,
    private state: StateService
  ) {}

  async checkLoggedIn(): Promise<boolean> {
    try {
      const token = await this.storage.getStorage('token');
      const isValid = Boolean(token && !this.isTokenExpired(token));
      this.isAuthenticatedSubject.next(isValid);
      return isValid;
    } catch (error) {
      console.error('Check logged in error:', error);
      this.isAuthenticatedSubject.next(false);
      return false;
    }
  }

  refreshToken(): Observable<any> {
    return from(this.storage.getStorage('refreshToken')).pipe(
      switchMap(refreshToken => {
        if (!refreshToken) {
          return throwError(() => 'No refresh token available');
        }

        return this.http.post(`${this.BASE_URL}/api/v1/users/refresh-token`, { refreshToken }).pipe(
          tap(async (response: any) => {
            if (response?.access_token) {
              await this.storage.setStorage('token', response.access_token);
              await this.storage.setStorage('refreshToken', response.refresh_token);
            }
          })
        );
      })
    );
  }

  login(credentials: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.BASE_URL}/api/v1/users/login`, credentials).pipe(
      tap(async (response) => {
        await this.handleAuthResponse(response);
      }),
      catchError(error => {
        console.error('Login error:', error);
        return throwError(() => error);
      })
    );
  }

  async logout(): Promise<void> {
    this.isAuthenticatedSubject.next(false);
    await this.storage.clearStorage();
    await this.state.clearState();
  }

  private async handleAuthResponse(response: AuthResponse) {
    if (response?.access_token) {
      await this.storage.setStorage('token', response.access_token);
      await this.storage.setStorage('refreshToken', response.refresh_token);
      await this.storage.setStorage('profile', JSON.stringify(response.user));
      await this.state.updateState({
        userId: response.user._id,
        token: response.access_token,
        refreshToken: response.refresh_token,
        profile: response.user
      });
      this.isAuthenticatedSubject.next(true);
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.BASE_URL}/api/v1/users/register`, userData);
  }

  changePassword(passwordData: any): Observable<any> {
    return this.http.post(`${this.BASE_URL}/api/v1/users/change-password`, passwordData);
  }

  resetPassword(resetData: any): Observable<any> {
    return this.http.post(`${this.BASE_URL}/api/v1/users/reset-password`, resetData);
  }
}
