import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';
import { BehaviorSubject, Observable } from 'rxjs';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export interface KeyboardInfo {
  isVisible: boolean;
  height: number;
  platform: string;
}

@Injectable({
  providedIn: 'root'
})
export class KeyboardService {
  private keyboardState = new BehaviorSubject<KeyboardInfo>({
    isVisible: false,
    height: 0,
    platform: Capacitor.getPlatform()
  });

  public keyboardState$ = this.keyboardState.asObservable();

  constructor() {
    this.initializeKeyboard();
  }

  private async initializeKeyboard() {
    if (Capacitor.isNativePlatform()) {
      try {
        // Configure keyboard behavior
        await Keyboard.setResizeMode({ mode: 'body' as any });
        await Keyboard.setScroll({ isDisabled: false });
        
        // Set keyboard appearance for iOS
        if (Capacitor.getPlatform() === 'ios') {
          await Keyboard.setAccessoryBarVisible({ isVisible: false });
        }
        
        // Setup listeners
        this.setupKeyboardListeners();
        
        console.log('✅ Keyboard service initialized');
      } catch (error) {
        console.error('❌ Error initializing keyboard service:', error);
      }
    }
  }

  private setupKeyboardListeners() {
    Keyboard.addListener('keyboardWillShow', (info) => {
      this.handleKeyboardShow(info);
    });

    Keyboard.addListener('keyboardDidShow', (info) => {
      this.handleKeyboardShow(info);
    });

    Keyboard.addListener('keyboardWillHide', () => {
      this.handleKeyboardHide();
    });

    Keyboard.addListener('keyboardDidHide', () => {
      this.handleKeyboardHide();
    });
  }

  private handleKeyboardShow(info: any) {
    const newState: KeyboardInfo = {
      isVisible: true,
      height: info.keyboardHeight || 0,
      platform: Capacitor.getPlatform()
    };
    
    this.keyboardState.next(newState);
    
    // Add keyboard-aware class to body
    document.body.classList.add('keyboard-open');
    
    // Trigger haptic feedback
    Haptics.impact({ style: ImpactStyle.Light });
    
    console.log('⌨️ Keyboard shown:', newState);
  }

  private handleKeyboardHide() {
    const newState: KeyboardInfo = {
      isVisible: false,
      height: 0,
      platform: Capacitor.getPlatform()
    };
    
    this.keyboardState.next(newState);
    
    // Remove keyboard-aware class
    document.body.classList.remove('keyboard-open');
    
    console.log('⌨️ Keyboard hidden');
  }

  // Public methods
  public getKeyboardState(): KeyboardInfo {
    return this.keyboardState.value;
  }

  public isKeyboardVisible(): boolean {
    return this.keyboardState.value.isVisible;
  }

  public getKeyboardHeight(): number {
    return this.keyboardState.value.height;
  }

  public async hideKeyboard(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      try {
        await Keyboard.hide();
      } catch (error) {
        console.error('Error hiding keyboard:', error);
      }
    }
  }

  public async showKeyboard(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      try {
        await Keyboard.show();
      } catch (error) {
        console.error('Error showing keyboard:', error);
      }
    }
  }

  public async setAccessoryBarVisible(visible: boolean): Promise<void> {
    if (Capacitor.getPlatform() === 'ios') {
      try {
        await Keyboard.setAccessoryBarVisible({ isVisible: visible });
      } catch (error) {
        console.error('Error setting accessory bar visibility:', error);
      }
    }
  }

  public async setResizeMode(mode: 'body' | 'ionic' | 'native'): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      try {
        await Keyboard.setResizeMode({ mode: mode as any });
      } catch (error) {
        console.error('Error setting resize mode:', error);
      }
    }
  }
}
