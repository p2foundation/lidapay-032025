import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { Platform } from '@ionic/angular';
import { BehaviorSubject } from 'rxjs';
import { StorageService } from './storage.service';

export type ThemeMode = 'system' | 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private renderer: Renderer2;
  private themeMode = new BehaviorSubject<ThemeMode>('system');
  private _isDarkMode = new BehaviorSubject<boolean>(false);
  
  themeMode$ = this.themeMode.asObservable();
  isDarkMode$ = this._isDarkMode.asObservable();

  private systemDarkMode = false;
  private mediaQuery: MediaQueryList | null = null;

  constructor(
    private rendererFactory: RendererFactory2,
    private platform: Platform,
    private storage: StorageService
  ) {
    this.renderer = this.rendererFactory.createRenderer(null, null);
    this.initializeTheme();
  }

  private async initializeTheme() {
    // Initialize system theme detection
    this.initializeSystemThemeDetection();
    
    // Check stored preference
    const storedThemeMode = await this.storage.getStorage('themeMode');
    
    if (storedThemeMode && ['system', 'light', 'dark'].includes(storedThemeMode)) {
      this.setThemeMode(storedThemeMode as ThemeMode);
    } else {
      // Default to system theme
      this.setThemeMode('system');
    }
  }

  private initializeSystemThemeDetection() {
    // Check if matchMedia is supported
    if (typeof window !== 'undefined' && window.matchMedia) {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.systemDarkMode = this.mediaQuery.matches;
      
      // Listen for system theme changes
      this.mediaQuery.addEventListener('change', (e) => {
        this.systemDarkMode = e.matches;
        this.updateTheme();
      });
    }
  }

  getThemeMode(): ThemeMode {
    return this.themeMode.value;
  }

  isDarkMode(): boolean {
    return this._isDarkMode.value;
  }

  async setThemeMode(mode: ThemeMode) {
    // Store the preference
    await this.storage.setStorage('themeMode', mode);
    
    // Update the theme mode
    this.themeMode.next(mode);
    
    // Apply the theme
    this.updateTheme();
  }

  private updateTheme() {
    let shouldBeDark = false;
    
    switch (this.themeMode.value) {
      case 'system':
        shouldBeDark = this.systemDarkMode;
        break;
      case 'dark':
        shouldBeDark = true;
        break;
      case 'light':
        shouldBeDark = false;
        break;
    }

    // Update dark mode state
    this._isDarkMode.next(shouldBeDark);
    
    // Apply theme classes
    this.applyThemeClasses(shouldBeDark);
    
    // Update status bar for mobile
    this.updateStatusBar(shouldBeDark);
  }

  private applyThemeClasses(isDark: boolean) {
    const body = document.body;
    
    // Remove existing theme classes
    body.classList.remove('light', 'dark');
    
    // Add appropriate theme class
    if (isDark) {
      body.classList.add('dark');
    } else {
      body.classList.add('light');
    }
    
    // Update CSS custom property for theme mode
    document.documentElement.style.setProperty('--theme-mode', isDark ? 'dark' : 'light');
  }

  private updateStatusBar(isDark: boolean) {
    if (this.platform.is('capacitor')) {
      // Update status bar style based on theme
      // This would typically use Capacitor StatusBar plugin
      // For now, we'll just update the body class
      if (isDark) {
        this.renderer.addClass(document.body, 'dark');
      } else {
        this.renderer.removeClass(document.body, 'dark');
      }
    }
  }

  // Convenience methods for backward compatibility
  async setDarkMode(enable: boolean) {
    const mode: ThemeMode = enable ? 'dark' : 'light';
    await this.setThemeMode(mode);
  }

  toggleTheme() {
    const currentMode = this.themeMode.value;
    let newMode: ThemeMode;
    
    if (currentMode === 'system') {
      // If system mode, toggle based on current system preference
      newMode = this.systemDarkMode ? 'light' : 'dark';
    } else if (currentMode === 'light') {
      newMode = 'dark';
    } else {
      newMode = 'light';
    }
    
    this.setThemeMode(newMode);
  }

  // Get the effective theme mode (system resolves to actual light/dark)
  getEffectiveThemeMode(): 'light' | 'dark' {
    switch (this.themeMode.value) {
      case 'system':
        return this.systemDarkMode ? 'dark' : 'light';
      case 'dark':
        return 'dark';
      case 'light':
        return 'light';
    }
  }

  // Check if system theme is being used
  isSystemTheme(): boolean {
    return this.themeMode.value === 'system';
  }
} 