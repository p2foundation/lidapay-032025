import { Component, CUSTOM_ELEMENTS_SCHEMA, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  IonContent,
  NavController,
  LoadingController,
  IonIcon,
  IonInput,
  IonButton,
  IonText,
  IonSpinner,
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom, Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth/auth.service';
import { MyEvent } from 'src/app/services/myevent.service';
import { NotificationService } from 'src/app/services/notification.service';
import { StorageService } from 'src/app/services/storage.service';
import { addIcons } from 'ionicons';
import {
  callOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
  logoGoogle,
  logoApple,
  logoFacebook,
} from 'ionicons/icons';

// Register all icons used in this component
addIcons({
  'call-outline': callOutline,
  'lock-closed-outline': lockClosedOutline,
  'eye-outline': eyeOutline,
  'eye-off-outline': eyeOffOutline,
  'logo-google': logoGoogle,
  'logo-apple': logoApple,
  'logo-facebook': logoFacebook,
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
    IonText,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    IonSpinner,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LoginPage implements OnInit, OnDestroy {
  public loginForm!: FormGroup;
  showPassword: boolean = false;
  private loader: HTMLIonLoadingElement | null = null;
  isFocused: string = '';
  isLoading: boolean = false;
  private subscriptions = new Subscription();

  public loginParams = {
    username: '',
    email: '',
    mobile: '',
    password: '',
  };

  constructor(
    private navCtrl: NavController,
    private route: Router,
    private formBuilder: FormBuilder,
    private storage: StorageService,
    public loadingController: LoadingController,
    private authService: AuthService,
    private notification: NotificationService,
    public translate: TranslateService,
    private myEvent: MyEvent
  ) {
    // Initialize the form in constructor
    this.loginForm = this.formBuilder.group({
      mobile: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  async ngOnInit() {
    // Initialize translations
    await this.translate.get('login.welcome_back').toPromise();
    this.translate.setDefaultLang('en');
    this.translate.use('en');
  }

  async onLogin(form: any) {
    if (!this.loginForm.valid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    try {
      await this.showLoader();

      this.loginParams.username = form.mobile;
      this.loginParams.password = form.password;

      const losfRes = await firstValueFrom(
        this.authService.login(this.loginParams)
      );
      console.log(`LOGIN >> USER : ${JSON.stringify(losfRes.user._id)}`);

      if (losfRes?.access_token) {
        // Store user data
        await this.storage.setStorage('token', losfRes.access_token);
        await this.storage.setStorage('refreshToken', losfRes.refresh_token);
        await this.storage.setStorage('profile', JSON.stringify(losfRes.user));
        await this.storage.setStorage(
          'userId',
          JSON.stringify(losfRes.user._id)
        );

        this.notification.showToastSuccess('Welcome back!');
        this.route.navigate(['./tabs']);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('LOGIN error ===>', error);

      // Handle specific error cases
      if (error.status === 401) {
        this.notification.showError('Invalid username or password');
      } else if (error.status === 403) {
        this.notification.showError('Your account has been locked');
      } else if (error.error?.message) {
        this.notification.showError(error.error.message);
      } else {
        this.notification.showError('Unable to connect to the server');
      }

      // Clear any partial data on error
      await this.storage.clearStorage();
    } finally {
      this.isLoading = false;
      await this.hideLoader();
    }
  }

  async showLoader() {
    // Ensure any existing loader is dismissed
    await this.hideLoader();

    this.loader = await this.loadingController.create({
      message: 'Signing in...',
      spinner: 'circular',
      cssClass: 'custom-loader',
    });
    await this.loader.present();
  }

  async hideLoader() {
    if (this.loader) {
      await this.loader.dismiss();
      this.loader = null;
    }
  }
  // Forms Error Handling
  getErrorMessage(field: string): string {
    const control = this.loginForm.get(field);
    if (control?.errors) {
      if (control.errors['required']) {
        return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      }
      if (control.errors['minlength']) {
        return `${
          field.charAt(0).toUpperCase() + field.slice(1)
        } must be at least ${
          control.errors['minlength'].requiredLength
        } characters`;
      }
    }
    return '';
  }
  // Navigation methods
  tabs() {
    this.navCtrl.navigateRoot(['./tabs']);
  }
  // Go to signup page
  register_now() {
    this.route.navigate(['/signup'], { replaceUrl: true });
  }
  // Forgot Password
  forgotPassword() {
    this.navCtrl.navigateForward('/forgot-password');
  }
  // Cleanup on destroy
  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    if (this.loader) {
      this.loader.dismiss();
    }
  }
}
