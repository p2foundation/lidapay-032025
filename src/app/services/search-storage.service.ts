import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

const SEARCH_STORAGE_KEYS = {
  RECENT_SEARCHES: 'recentSearches'
} as const;

@Injectable({
  providedIn: 'root'
})
export class SearchStorageService {
  constructor() {}

  async getRecentSearches(): Promise<string[]> {
    const { value } = await Preferences.get({ key: SEARCH_STORAGE_KEYS.RECENT_SEARCHES });
    if (value) {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return [];
  }

  async saveRecentSearch(search: string, maxItems: number = 5): Promise<void> {
    let searches = await this.getRecentSearches();
    searches = searches.filter(s => s !== search);
    searches.unshift(search);
    if (searches.length > maxItems) {
      searches = searches.slice(0, maxItems);
    }
    await Preferences.set({
      key: SEARCH_STORAGE_KEYS.RECENT_SEARCHES,
      value: JSON.stringify(searches)
    });
  }

  async removeRecentSearch(search: string): Promise<void> {
    const searches = await this.getRecentSearches();
    const updatedSearches = searches.filter(s => s !== search);
    await Preferences.set({
      key: SEARCH_STORAGE_KEYS.RECENT_SEARCHES,
      value: JSON.stringify(updatedSearches)
    });
  }

  async clearRecentSearches(): Promise<void> {
    await Preferences.remove({ key: SEARCH_STORAGE_KEYS.RECENT_SEARCHES });
  }
} 