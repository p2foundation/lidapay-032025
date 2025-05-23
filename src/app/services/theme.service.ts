import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { Platform } from '@ionic/angular';
import { BehaviorSubject } from 'rxjs';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private renderer: Renderer2;
  private darkMode = new BehaviorSubject<boolean>(false);
  isDarkMode$ = this.darkMode.asObservable();

  constructor(
    private rendererFactory: RendererFactory2,
    private platform: Platform,
    private storage: StorageService
  ) {
    this.renderer = this.rendererFactory.createRenderer(null, null);
    this.initializeTheme();
  }

  private async initializeTheme() {
    // Check storage first
    const storedTheme = await this.storage.getStorage('darkMode');
    
    if (storedTheme !== null) {
      // Use stored preference
      this.setDarkMode(storedTheme === 'true');
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
      this.setDarkMode(prefersDark.matches);
      
      // Listen for changes in system theme
      prefersDark.addEventListener('change', (e) => {
        this.setDarkMode(e.matches);
      });
    }
  }

  isDarkMode(): boolean {
    return this.darkMode.value;
  }

  async setDarkMode(enable: boolean) {
    // Update storage
    await this.storage.setStorage('darkMode', enable.toString());
    
    // Update theme
    this.darkMode.next(enable);
    document.body.classList.toggle('dark', enable);
    
    // Update status bar for mobile
    if (this.platform.is('capacitor')) {
      if (enable) {
        this.renderer.addClass(document.body, 'dark');
        // Add status bar handling for iOS/Android if needed
      } else {
        this.renderer.removeClass(document.body, 'dark');
        // Add status bar handling for iOS/Android if needed
      }
    }
  }

  toggleTheme() {
    this.setDarkMode(!this.isDarkMode());
  }
} 