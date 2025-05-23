import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { StorageService } from './storage.service';

export interface UserState {
  userId: string;
  token: string;
  refreshToken: string;
  profile?: any;
}

@Injectable({
  providedIn: 'root'
})
export class StateService {
  private userState = new BehaviorSubject<UserState | null>(null);

  constructor(private storage: StorageService) {
    this.initializeState();
  }

  private async initializeState() {
    try {
      const [userId, token, refreshToken, profile] = await Promise.all([
        this.storage.getStorage('userId'),
        this.storage.getStorage('token'),
        this.storage.getStorage('refreshToken'),
        this.storage.getStorage('userProfile')
      ]);

      if (token) {
        this.userState.next({
          userId,
          token,
          refreshToken,
          profile
        });
      }
    } catch (error) {
      console.error('Error initializing state:', error);
    }
  }

  async updateState(state: Partial<UserState>) {
    const currentState = this.userState.value;
    const newState = { ...currentState, ...state };
    
    try {
      console.log('Updating state with:', state);
      // Store in preferences
      await Promise.all([
        state.userId && this.storage.setStorage('userId', state.userId),
        state.token && this.storage.setStorage('token', state.token),
        state.refreshToken && this.storage.setStorage('refreshToken', state.refreshToken),
        state.profile && this.storage.setStorage('userProfile', state.profile)
      ]);

      // Update behavior subject
      this.userState.next(newState as UserState);
      console.log('State updated successfully:', newState);
    } catch (error) {
      console.error('Error updating state:', error);
    }
  }

  getState(): Observable<UserState | null> {
    return this.userState.asObservable();
  }

  getCurrentState(): UserState | null {
    const state = this.userState.value;
    console.log('Current state:', state);
    return state;
  }

  async clearState() {
    await this.storage.clearStorage();
    this.userState.next(null);
  }

  getUserId(): string | null {
    return this.userState.value?.userId || null;
  }
} 