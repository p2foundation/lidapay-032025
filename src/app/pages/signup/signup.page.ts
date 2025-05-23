import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  OnDestroy,
  OnInit,
} from '@angular/core';
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
  IonHeader,
  IonTitle,
  IonToolbar,
  LoadingController,
  IonInput,
  IonButton,
  IonText,
  IonSelect,
  IonSelectOption,
  IonIcon,
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription, firstValueFrom } from 'rxjs';
import { AuthService } from 'src/app/services/auth/auth.service';
import { MyEvent } from 'src/app/services/myevent.service';
import { NotificationService } from 'src/app/services/notification.service';
import { StorageService } from 'src/app/services/storage.service';
import { addIcons } from 'ionicons';
import {
  peopleOutline,
  personOutline,
  storefrontOutline,
  briefcaseOutline,
  mailOutline,
  callOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
} from 'ionicons/icons';

// Register all icons used in this component
addIcons({
  'people-outline': peopleOutline,
  'person-outline': personOutline,
  'storefront-outline': storefrontOutline,
  'briefcase-outline': briefcaseOutline,
  'mail-outline': mailOutline,
  'call-outline': callOutline,
  'lock-closed-outline': lockClosedOutline,
  'eye-outline': eyeOutline,
  'eye-off-outline': eyeOffOutline,
});

@Component({
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonInput,
    IonButton,
    IonSelect,
    IonSelectOption,
    IonIcon,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SignupPage implements OnInit, OnDestroy {
  public signUpForm!: FormGroup;
  public signupParams: any = {};
  showPassword: boolean = false;
  isLoading: boolean = false;
  private subscriptions = new Subscription();
  private loader: HTMLIonLoadingElement | null = null;

  constructor(
    private route: Router,
    private formBuilder: FormBuilder,
    private storageService: StorageService,
    public loadingController: LoadingController,
    private authService: AuthService,
    private notification: NotificationService,
    private translate: TranslateService,
    private myEvent: MyEvent
  ) {
    this.signUpForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(3)]],
      lastName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      mobile: ['', [Validators.required, Validators.minLength(10)]],
      role: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  async ngOnInit() {
    const translations = await firstValueFrom(
      this.translate.get(['signup', 'login'])
    );
    console.log('Loaded translations:', translations); // Debugging line
    this.translate.setDefaultLang('en');
    this.translate.use('en');
  }

  async signupFormSubmit(form: any) {
    if (!this.signUpForm.valid) {
      this.notification.showError(
        'Please fill in all required fields correctly'
      );
      return;
    }

    const waitingModal = await this.showLoader();

    try {
      this.signupParams = {
        username: form.firstName,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phoneNumber: form.mobile,
        password: form.password,
        roles: form.role,
      };

      const response = await firstValueFrom(
        this.authService.register(this.signupParams)
      );

      if (response?._id) {
        this.notification.showToastSuccess(
          'Registration successful! Please login to continue.'
        );
        this.route.navigate(['./login']);
      } else {
        throw new Error('Registration failed');
      }
    } catch (error: any) {
      console.error('REGISTER ERROR ==>', error);
      this.handleRegistrationError(error);
    } finally {
      waitingModal.dismiss();
    }
  }

  private handleRegistrationError(error: any) {
    if (error.status === 409) {
      this.notification.showError(
        'This email or phone number is already registered'
      );
    } else if (error.status === 400) {
      if (error.error?.message?.includes('email')) {
        this.notification.showError('Please enter a valid email address');
      } else if (error.error?.message?.includes('password')) {
        this.notification.showError(
          'Password must be at least 8 characters long'
        );
      } else {
        this.notification.showError(
          error.error?.message || 'Invalid input data'
        );
      }
    } else if (error.error?.message) {
      this.notification.showError(error.error.message);
    } else {
      this.notification.showError(
        'Registration failed. Please try again later'
      );
    }
  }

  async showLoader() {
    const loader = await this.loadingController.create({
      message: 'Creating your account...',
      spinner: 'circular',
      cssClass: 'custom-loader',
    });
    await loader.present();
    return loader;
  }

  async hideLoader() {
    if (this.loader) {
      await this.loader.dismiss();
      this.loader = null;
    }
  }

  getErrorMessage(field: string): string {
    const control = this.signUpForm.get(field);
    if (control?.errors) {
      // Debug translation
      console.log(`Getting error for field: ${field}`);
      console.log(`Field translation:`, this.translate.instant(field));

      if (control.errors['required']) {
        const fieldName = this.translate.instant(field);
        const message = `${fieldName} is required`;
        console.log('Error message:', message);
        return message;
      }
      if (control.errors['email']) {
        const message = this.translate.instant('login.email_error');
        console.log('Email error:', message);
        return message;
      }
      if (control.errors['minlength']) {
        if (field === 'password') {
          return this.translate.instant('login.password_error');
        }
        if (field === 'mobile') {
          return this.translate.instant('login.mobile_error');
        }
        const fieldName = this.translate.instant(field);
        return `${fieldName} is too short`;
      }
    }
    return '';
  }

  register_now() {
    this.route.navigate(['/login'], { replaceUrl: true });
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    if (this.loader) {
      this.loader.dismiss();
    }
  }
}
