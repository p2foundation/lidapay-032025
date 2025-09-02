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
    console.log(`Setting storage key: ${key}`, value);
    await Preferences.set({
      key,
      value: typeof value === 'string' ? value : JSON.stringify(value)
    });
    console.log(`Storage key ${key} set successfully`);
  }

  async getStorage(key: string): Promise<any> {
    const { value } = await Preferences.get({ key });
    console.log(`Getting storage key: ${key}`, value);
    if (value) {
      try {
        const parsed = JSON.parse(value);
        console.log(`Parsed value for ${key}:`, parsed);
        return parsed;
      } catch {
        console.log(`Raw value for ${key}:`, value);
        return value;
      }
    }
    console.log(`No value found for key: ${key}`);
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
