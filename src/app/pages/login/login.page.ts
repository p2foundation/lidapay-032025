import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonButtons,
  IonInput,
  IonSpinner,
  IonCard,
  IonCardContent,
  IonChip,
  IonItem,
  IonLabel,
  IonToggle,
  IonIcon,
  NavController,
  Platform,
  ToastController,
  AlertController,
  ModalController,
  LoadingController,
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { StorageService } from 'src/app/services/storage.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { NotificationService } from 'src/app/services/notification.service';
import { MyEvent } from 'src/app/services/myevent.service';
import { KeyboardService } from 'src/app/services/keyboard.service';
import { Subscription, firstValueFrom } from 'rxjs';
import { addIcons } from 'ionicons';
import { 
  shieldCheckmarkOutline, 
  sunnyOutline, 
  moonOutline, 
  contrastOutline,
  fingerPrintOutline,
  eyeOutline,
  eyeOffOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  warningOutline,
  chevronDownOutline, callOutline, lockClosedOutline, informationCircleOutline, settingsOutline, logoGoogle, logoApple, logoFacebook } from 'ionicons/icons';

// Register all icons used in this component
addIcons({
  'shield-checkmark-outline': shieldCheckmarkOutline,
  'sunny-outline': sunnyOutline,
  'moon-outline': moonOutline,
  'contrast-outline': contrastOutline,
  'fingerprint-outline': fingerPrintOutline,
  'eye-outline': eyeOutline,
  'eye-off-outline': eyeOffOutline,
  'checkmark-circle-outline': checkmarkCircleOutline,
  'close-circle-outline': closeCircleOutline,
  'warning-outline': warningOutline,
  'chevron-down-outline': chevronDownOutline,
  'settings-outline': settingsOutline,
});

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonIcon,
    IonContent,
    IonInput,
    IonButton,
    IonSpinner,
    IonCard,
    IonCardContent,
    IonChip,
    IonItem,
    IonLabel,
    IonToggle,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LoginPage implements OnInit, OnDestroy {
  @ViewChild('mobileInput') mobileInput!: ElementRef;
  @ViewChild('passwordInput') passwordInput!: ElementRef;

  public loginForm!: FormGroup;
  showPassword: boolean = false;
  private loader: HTMLIonLoadingElement | null = null;
  isFocused: string = '';
  isLoading: boolean = false;
  private subscriptions = new Subscription();

  // Enhanced login features
  public loginParams = {
    username: '',
    email: '',
    mobile: '',
    password: '',
  };

  // Biometric authentication
  isBiometricAvailable: boolean = false;
  isBiometricEnabled: boolean = false;
  biometricType: 'fingerprint' | 'face' | 'none' = 'none';

  // Enhanced security features
  rememberMe: boolean = false;
  showSecurityTips: boolean = false;
  loginAttempts: number = 0;
  maxLoginAttempts: number = 5;
  isAccountLocked: boolean = false;
  lockoutTime: number = 0;

  // Modern UX features
  currentTheme: 'light' | 'dark' | 'system' = 'system';
  showAdvancedOptions: boolean = false;
  isAnimating: boolean = false;

  // Form validation states
  isFormValid: boolean = false;
  validationErrors: { [key: string]: string } = {};

  constructor(
    private navCtrl: NavController,
    private route: Router,
    private formBuilder: FormBuilder,
    private storage: StorageService,
    public loadingController: LoadingController,
    private authService: AuthService,
    private notification: NotificationService,
    public translate: TranslateService,
    private myEvent: MyEvent,
    private modalController: ModalController,
    private keyboardService: KeyboardService
  ) {
    this.initializeForm();
    this.loadUserPreferences();
  }

  private initializeForm() {
    this.loginForm = this.formBuilder.group({
      mobile: ['', [Validators.required, Validators.minLength(10)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      rememberMe: [false],
      isBiometricEnabled: [false],
    });

    // Listen to form changes for real-time validation
    this.loginForm.valueChanges.subscribe(() => {
      this.validateForm();
    });
  }

  private async loadUserPreferences() {
    try {
      const savedMobile = await this.storage.getStorage('savedMobile');
      const savedTheme = await this.storage.getStorage('userTheme');
      const biometricEnabled = await this.storage.getStorage('biometricEnabled');
      const rememberMe = await this.storage.getStorage('rememberMe');

      if (savedMobile && rememberMe) {
        this.loginForm.patchValue({ mobile: savedMobile });
        this.loginForm.patchValue({ rememberMe: true });
      }

      if (savedTheme) {
        this.currentTheme = savedTheme;
        this.applyTheme(savedTheme);
      }

      if (biometricEnabled) {
        this.loginForm.patchValue({ isBiometricEnabled: true });
        this.checkBiometricAvailability();
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  }

  async ngOnInit() {
    console.log('🚀 Enhanced Login Page Initialized');
    
    // Check biometric availability
    await this.checkBiometricAvailability();
    
    // Load saved credentials if available
    await this.loadSavedCredentials();
    
    // Check for account lockout
    await this.checkAccountLockout();
    
    // Apply current theme
    this.applyTheme(this.currentTheme);
  }

  private async checkBiometricAvailability() {
    try {
      // Check if WebAuthn is available
      if (window.PublicKeyCredential) {
        this.isBiometricAvailable = true;
        this.biometricType = 'fingerprint'; // Default assumption
        
        // Check for specific biometric types
        if (window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
          const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          this.isBiometricAvailable = available;
        }
      }
    } catch (error) {
      console.log('Biometric authentication not available:', error);
      this.isBiometricAvailable = false;
    }
  }

  private async loadSavedCredentials() {
    try {
      const savedCredentials = await this.storage.getStorage('savedCredentials');
      const rememberMe = this.loginForm.get('rememberMe')?.value;
      if (savedCredentials && rememberMe) {
        this.loginForm.patchValue({
          mobile: savedCredentials.mobile,
          password: savedCredentials.password
        });
      }
    } catch (error) {
      console.log('No saved credentials found');
    }
  }

  private async checkAccountLockout() {
    try {
      const lockoutInfo = await this.storage.getStorage('accountLockout');
      if (lockoutInfo && lockoutInfo.lockoutTime > Date.now()) {
        this.isAccountLocked = true;
        this.lockoutTime = lockoutInfo.lockoutTime;
        this.loginAttempts = lockoutInfo.attempts;
      } else if (lockoutInfo && lockoutInfo.lockoutTime <= Date.now()) {
        // Lockout expired, clear it
        await this.storage.setStorage('accountLockout', null);
        this.isAccountLocked = false;
        this.loginAttempts = 0;
      }
    } catch (error) {
      console.log('No lockout info found');
    }
  }

  private validateForm() {
    this.isFormValid = this.loginForm.valid;
    this.validationErrors = {};

    if (this.loginForm.get('mobile')?.invalid && this.loginForm.get('mobile')?.touched) {
      const mobileControl = this.loginForm.get('mobile');
      if (mobileControl?.errors?.['required']) {
        this.validationErrors['mobile'] = 'Phone number is required';
      } else if (mobileControl?.errors?.['minlength']) {
        this.validationErrors['mobile'] = 'Phone number must be at least 10 digits';
      }
    }

    if (this.loginForm.get('password')?.invalid && this.loginForm.get('password')?.touched) {
      const passwordControl = this.loginForm.get('password');
      if (passwordControl?.errors?.['required']) {
        this.validationErrors['password'] = 'Password is required';
      } else if (passwordControl?.errors?.['minlength']) {
        this.validationErrors['password'] = 'Password must be at least 8 characters';
      }
    }
  }

  async onLogin(formData: any) {
    console.log('🚀 Enhanced Login Page Initialized');
    console.log('📝 Form Data Received:', formData);
    console.log('🔍 Form Validation Status:', this.loginForm.valid);
    console.log('📋 Form Values:', this.loginForm.value);
    console.log('🎯 Individual Form Controls:');
    console.log('   - Mobile:', this.loginForm.get('mobile')?.value);
    console.log('   - Password:', this.loginForm.get('password')?.value);
    console.log('   - Remember Me:', this.loginForm.get('rememberMe')?.value);
    console.log('   - Biometric Enabled:', this.loginForm.get('isBiometricEnabled')?.value);

    if (this.isAccountLocked) {
      console.log('🚫 Account is locked');
      this.showLockoutMessage();
      return;
    }

    if (!this.loginForm.valid) {
      console.log('❌ Form validation failed');
      this.showValidationErrors();
      return;
    }

    console.log('✅ Form validation passed, proceeding with login');
    this.isLoading = true;
    this.isAnimating = true;

    try {
      // Check login attempts
      if (this.loginAttempts >= this.maxLoginAttempts) {
        console.log('🚫 Account locked due to too many attempts');
        await this.lockAccount();
        return;
      }

      // Attempt login
      console.log('🔐 Attempting login with credentials...');
      await this.attemptLogin(formData);
    } catch (error) {
      console.log('💥 Login attempt failed:', error);
      await this.handleFailedLogin();
    } finally {
      this.isLoading = false;
      this.isAnimating = false;
    }
  }

  private async attemptLogin(formData: any) {
    try {
      const credentials = {
        username: formData.mobile,
        password: formData.password
      };
      
      console.log('📡 MAKING API CALL TO: authService.login');
      console.log('📡 WITH PARAMS:', credentials);
      console.log('📡 API ENDPOINT: /api/v1/users/login');
      
      const result = await firstValueFrom(
        this.authService.login(credentials)
      );

      console.log('✅ Login API call successful:', result);
      // If we get here, login was successful (no error thrown)
      await this.handleSuccessfulLogin(formData);
    } catch (error: any) {
      console.error('❌ Login error:', error);
      await this.handleLoginError(error);
    }
  }

  private async handleSuccessfulLogin(formData: any) {
    this.loginAttempts = 0;
    
    const rememberMe = this.loginForm.get('rememberMe')?.value;
    if (rememberMe) {
      await this.saveCredentials(formData);
    } else {
      await this.clearSavedCredentials();
    }

    // Navigate to main app
    this.navigateToMainApp();
  }

  private async handleFailedLogin() {
    this.loginAttempts++;
    
    if (this.loginAttempts >= this.maxLoginAttempts) {
      await this.lockAccount();
    } else {
      this.notification.showError(`Login failed. ${this.maxLoginAttempts - this.loginAttempts} attempts remaining.`);
    }
  }

  private async lockAccount() {
    this.isAccountLocked = true;
    this.lockoutTime = Date.now() + (15 * 60 * 1000); // 15 minutes
    
    await this.storage.setStorage('accountLockout', {
      lockoutTime: this.lockoutTime,
      attempts: this.loginAttempts
    });

    this.notification.showError('Account temporarily locked due to too many failed attempts. Please try again in 15 minutes.');
  }

  private async saveCredentials(formData: any) {
    try {
      await this.storage.setStorage('savedCredentials', {
        mobile: formData.mobile,
        password: formData.password
      });
      await this.storage.setStorage('rememberMe', true);
    } catch (error) {
      console.error('Error saving credentials:', error);
    }
  }

  private async clearSavedCredentials() {
    try {
      await this.storage.setStorage('savedCredentials', null);
      await this.storage.setStorage('savedMobile', null);
      await this.storage.setStorage('rememberMe', false);
    } catch (error) {
      console.error('Error clearing saved credentials:', error);
    }
  }

  private async handleLoginError(error: any) {
    let errorMessage = 'Login failed. Please try again.';
    
    if (error.status === 401) {
      errorMessage = 'Invalid phone number or password.';
    } else if (error.status === 429) {
      errorMessage = 'Too many login attempts. Please try again later.';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    this.notification.showError(errorMessage);
  }

  private navigateToMainApp() {
    // Navigate to the main app after successful login
    this.route.navigate(['/tabs/home']);
  }

  async authenticateWithBiometric() {
    const isBiometricEnabled = this.loginForm.get('isBiometricEnabled')?.value;
    if (!this.isBiometricAvailable || !isBiometricEnabled) {
      return;
    }

    try {
      // Simulate biometric authentication
      this.isLoading = true;
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo purposes, assume biometric auth succeeds
      this.notification.showSuccess('Biometric authentication successful!');
      this.navigateToMainApp();
    } catch (error) {
      this.notification.showError('Biometric authentication failed. Please use password login.');
    } finally {
      this.isLoading = false;
    }
  }

  async toggleBiometric() {
    const currentValue = this.loginForm.get('isBiometricEnabled')?.value;
    const newValue = !currentValue;
    this.loginForm.patchValue({ isBiometricEnabled: newValue });
    
    try {
      await this.storage.setStorage('biometricEnabled', newValue);
      
      if (newValue) {
        this.notification.showSuccess('Biometric authentication enabled');
      } else {
        this.notification.showSuccess('Biometric authentication disabled');
      }
    } catch (error) {
      console.error('Error toggling biometric:', error);
    }
  }

  async toggleTheme() {
    const themes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    this.currentTheme = themes[nextIndex];
    
    try {
      await this.storage.setStorage('userTheme', this.currentTheme);
      this.applyTheme(this.currentTheme);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  }

  private applyTheme(theme: 'light' | 'dark' | 'system') {
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.body.classList.toggle('dark', prefersDark);
    } else {
      document.body.classList.toggle('dark', theme === 'dark');
    }
  }

  private showValidationErrors() {
    this.validateForm();
    this.notification.showError('Please fix the errors in the form.');
  }

  private showLockoutMessage() {
    this.notification.showError(`Account is locked. Please try again in ${this.getRemainingLockoutTime()} minutes.`);
  }

  getRemainingLockoutTime(): number {
    return Math.ceil((this.lockoutTime - Date.now()) / 1000 / 60);
  }

  // Enhanced keyboard handling methods
  onInputFocus(event: any, fieldName: string) {
    // Mark field as touched for validation
    this.loginForm.get(fieldName)?.markAsTouched();
    
    // Enhanced scrolling for keyboard-aware behavior
    const inputElement = event.target;
    if (inputElement) {
      setTimeout(() => {
        // Get keyboard height for better positioning
        const keyboardHeight = this.keyboardService.getKeyboardHeight();
        
        inputElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
        
        // Add additional offset for keyboard
        if (keyboardHeight > 0) {
          const currentScroll = window.pageYOffset;
          window.scrollTo({
            top: currentScroll - (keyboardHeight / 2),
            behavior: 'smooth'
          });
        }
      }, 300);
    }
    
    // Set focus state
    this.isFocused = fieldName;
  }

  onInputBlur() {
    // Clear focus state
    this.isFocused = '';
    
    // Hide keyboard if needed (optional)
    // this.keyboardService.hideKeyboard();
  }

  // Enhanced keyboard event handling
  onKeyPress(event: KeyboardEvent, fieldName: string) {
    // Handle Enter key for form submission
    if (event.key === 'Enter') {
      event.preventDefault();
      
      // Find next input field
      const currentIndex = this.getFieldIndex(fieldName);
      const nextField = this.getNextField(currentIndex);
      
      if (nextField) {
        // Focus next field
        const nextInput = document.querySelector(`[formControlName="${nextField}"]`) as HTMLElement;
        if (nextInput) {
          nextInput.focus();
        }
      } else {
        // Last field, submit form
        this.onLogin(this.loginForm.value);
      }
    }
  }

  private getFieldIndex(fieldName: string): number {
    const fieldOrder = ['mobile', 'password'];
    return fieldOrder.indexOf(fieldName);
  }

  private getNextField(currentIndex: number): string | null {
    const fieldOrder = ['mobile', 'password'];
    const nextIndex = currentIndex + 1;
    return nextIndex < fieldOrder.length ? fieldOrder[nextIndex] : null;
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
    this.isAnimating = true;
    
    setTimeout(() => {
      this.isAnimating = false;
    }, 300);
  }

  toggleAdvancedOptions() {
    this.showAdvancedOptions = !this.showAdvancedOptions;
  }

  async onRememberMeChange(event: CustomEvent) {
    const enabled = !!(event as any).detail?.checked;
    if (!enabled) {
      await this.clearSavedCredentials();
    } else {
      const formData = this.loginForm.value;
      if (formData?.mobile && formData?.password) {
        await this.saveCredentials(formData);
      }
    }
  }

  forgotPassword() {
    // Navigate to forgot password page
    this.route.navigate(['/forgot-password']);
  }

  navigateToSignup() {
    // Navigate to signup page
    this.route.navigate(['/signup']);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}



