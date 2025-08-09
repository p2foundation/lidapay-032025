import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  constructor() {}

  async getAccessToken(): Promise<string | null> {
    const { value } = await Preferences.get({ key: 'token' });
    return value;
  }

  async setAccessToken(token: string): Promise<void> {
    await Preferences.set({ key: 'token', value: token });
  }

  async getRefreshToken(): Promise<string | null> {
    const { value } = await Preferences.get({ key: 'refreshToken' });
    return value;
  }

  async setRefreshToken(token: string): Promise<void> {
    await Preferences.set({ key: 'refreshToken', value: token });
  }

  async setStorage(key: string, value: any): Promise<void> {
    await Preferences.set({
      key,
      value: typeof value === 'string' ? value : JSON.stringify(value)
    });
  }

  async getStorage(key: string): Promise<any> {
    const { value } = await Preferences.get({ key });
    if (value) {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return null;
  }

  async removeStorage(key: string): Promise<void> {
    await Preferences.remove({ key });
  }

  async clearStorage(): Promise<void> {
    await Preferences.clear();
  }

  async getAllKeys(): Promise<string[]> {
    const { keys } = await Preferences.keys();
    return keys;
  }
}
