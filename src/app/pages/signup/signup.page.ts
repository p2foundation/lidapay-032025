import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  OnDestroy,
  OnInit,
  ViewChild,
  ElementRef,
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
  IonProgressBar,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonSpinner,
  ModalController,
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription, firstValueFrom } from 'rxjs';
import { AuthService } from 'src/app/services/auth/auth.service';
import { CountrySelectorModalComponent } from '../../components/country-selector-modal/country-selector-modal.component';
import { MyEvent } from 'src/app/services/myevent.service';
import { NotificationService } from 'src/app/services/notification.service';
import { StorageService } from 'src/app/services/storage.service';
import { EmailService } from 'src/app/services/email.service';
import { CountryService, Country } from 'src/app/services/utils/country.service';
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
  checkmarkCircleOutline,
  arrowForwardOutline,
  arrowBackOutline,
  homeOutline,
  sparklesOutline, globeOutline, chevronDownOutline, ellipseOutline } from 'ionicons/icons';
import { KeyboardService } from 'src/app/services/keyboard.service';

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
  'checkmark-circle-outline': checkmarkCircleOutline,
  'arrow-forward-outline': arrowForwardOutline,
  'arrow-back-outline': arrowBackOutline,
  'home-outline': homeOutline,
  'sparkles-outline': sparklesOutline,
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
    IonIcon,
    IonProgressBar,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonSpinner,
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

  // Wizard properties
  currentStep: number = 1;
  totalSteps: number = 4;
  stepProgress: number = 25;
  isStepValid: boolean = false;
  showSuccessMessage: boolean = false;

  // Country selection
  selectedCountry: Country | null = null;
  countries: Country[] = [];

  // Step titles and descriptions
  stepInfo = [
    {
      title: this.translate.instant('signup.wizard.steps.step1.title'),
      subtitle: this.translate.instant('signup.wizard.steps.step1.subtitle'),
      description: this.translate.instant('signup.wizard.steps.step1.description')
    },
    {
      title: this.translate.instant('signup.wizard.steps.step2.title'),
      subtitle: this.translate.instant('signup.wizard.steps.step2.subtitle'),
      description: this.translate.instant('signup.wizard.steps.step2.description')
    },
    {
      title: this.translate.instant('signup.wizard.steps.step3.title'),
      subtitle: this.translate.instant('signup.wizard.steps.step3.subtitle'),
      description: this.translate.instant('signup.wizard.steps.step3.description')
    },
    {
      title: this.translate.instant('signup.wizard.steps.step4.title'),
      subtitle: this.translate.instant('signup.wizard.steps.step4.subtitle'),
      description: this.translate.instant('signup.wizard.steps.step4.description')
    }
  ];

  constructor(
    private route: Router,
    private formBuilder: FormBuilder,
    private storageService: StorageService,
    public loadingController: LoadingController,
    private authService: AuthService,
    private notification: NotificationService,
    private translate: TranslateService,
    private myEvent: MyEvent,
    private emailService: EmailService,
    private countryService: CountryService,
    private modalController: ModalController,
    private keyboardService: KeyboardService,
  ) {
    this.signUpForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(3)]],
      lastName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      country: ['', [Validators.required]],
      mobile: ['', [Validators.required, Validators.minLength(10)]],
      role: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });

    // Listen to form changes to validate current step
    this.signUpForm.valueChanges.subscribe(() => {
      console.log('📝 FORM VALUE CHANGED:', this.signUpForm.value);
      this.validateCurrentStep();
    });
    
    console.log('🏗️ FORM INITIALIZED:', {
      controls: Object.keys(this.signUpForm.controls),
      value: this.signUpForm.value,
      valid: this.signUpForm.valid
    });
  }

  async ngOnInit() {
    console.log('🚀 ngOnInit STARTED');
    
    const translations = await firstValueFrom(
      this.translate.get(['signup', 'login'])
    );
    console.log('🌐 Loaded translations:', translations);
    this.translate.setDefaultLang('en');
    this.translate.use('en');
    
    console.log('🔍 FORM STATE IN ngOnInit:', {
      valid: this.signUpForm.valid,
      value: this.signUpForm.value,
      controls: Object.keys(this.signUpForm.controls)
    });
    
    // Load countries for registration
    this.countries = this.countryService.getCountriesForRegistration();
    
    this.validateCurrentStep();
    console.log('✅ ngOnInit COMPLETED');
  }

  // Wizard navigation methods
  nextStep() {
    if (this.isStepValid && this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.updateProgress();
      this.validateCurrentStep();
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateProgress();
      this.validateCurrentStep();
    }
  }

  goToStep(step: number) {
    if (step >= 1 && step <= this.totalSteps) {
      this.currentStep = step;
      this.updateProgress();
      this.validateCurrentStep();
    }
  }

  updateProgress() {
    this.stepProgress = (this.currentStep / this.totalSteps) * 100;
  }

  onCountrySelected(country: Country) {
    console.log('🌍 COUNTRY SELECTED:', country);
    console.log('🌍 FORM BEFORE UPDATE:', this.signUpForm.value);
    
    this.selectedCountry = country;
    this.signUpForm.patchValue({ country: country.code });
    
    console.log('🌍 FORM AFTER UPDATE:', this.signUpForm.value);
    console.log('🌍 COUNTRY FIELD VALID:', this.signUpForm.get('country')?.valid);
    console.log('🌍 COUNTRY FIELD VALUE:', this.signUpForm.get('country')?.value);
    console.log('🌍 COUNTRY FIELD ERRORS:', this.signUpForm.get('country')?.errors);
  }

  async openCountrySelector() {
    console.log('🔍 OPENING COUNTRY SELECTOR');
    console.log('🔍 CURRENT SELECTED COUNTRY:', this.selectedCountry);
    console.log('🔍 FORM COUNTRY VALUE:', this.signUpForm.get('country')?.value);
    
    const modal = await this.modalController.create({
      component: CountrySelectorModalComponent,
      componentProps: {
        selectedCountry: this.selectedCountry
      },
      breakpoints: [0, 0.5, 0.8, 1],
      initialBreakpoint: 0.8,
      backdropDismiss: true,
      cssClass: 'country-selector-modal'
    });

    console.log('🔍 MODAL CREATED:', modal);
    modal.present();

    const { data } = await modal.onWillDismiss();
    console.log('🔍 MODAL DISMISSED WITH DATA:', data);
    
    if (data) {
      this.onCountrySelected(data);
    } else {
      console.log('🔍 NO COUNTRY SELECTED FROM MODAL');
    }
  }

  validateCurrentStep() {
    console.log('🔍 VALIDATING STEP:', this.currentStep);
    
    switch (this.currentStep) {
      case 1:
        this.isStepValid = this.signUpForm.get('role')?.valid || false;
        console.log('🔍 STEP 1 VALIDATION:', {
          roleValid: this.signUpForm.get('role')?.valid,
          roleValue: this.signUpForm.get('role')?.value,
          isStepValid: this.isStepValid
        });
        break;
      case 2:
        this.isStepValid = this.signUpForm.get('firstName')?.valid && 
                          this.signUpForm.get('lastName')?.valid || false;
        console.log('🔍 STEP 2 VALIDATION:', {
          firstNameValid: this.signUpForm.get('firstName')?.valid,
          firstNameValue: this.signUpForm.get('firstName')?.value,
          lastNameValid: this.signUpForm.get('lastName')?.valid,
          lastNameValue: this.signUpForm.get('lastName')?.value,
          isStepValid: this.isStepValid
        });
        break;
      case 3:
        this.isStepValid = this.signUpForm.get('email')?.valid && 
                          this.signUpForm.get('mobile')?.valid &&
                          this.signUpForm.get('country')?.valid || false;
        console.log('🔍 STEP 3 VALIDATION:', {
          emailValid: this.signUpForm.get('email')?.valid,
          emailValue: this.signUpForm.get('email')?.value,
          mobileValid: this.signUpForm.get('mobile')?.valid,
          mobileValue: this.signUpForm.get('mobile')?.value,
          countryValid: this.signUpForm.get('country')?.valid,
          countryValue: this.signUpForm.get('country')?.value,
          isStepValid: this.isStepValid
        });
        break;
      case 4:
        this.isStepValid = this.signUpForm.get('password')?.valid || false;
        console.log('🔍 STEP 4 VALIDATION:', {
          passwordValid: this.signUpForm.get('password')?.valid,
          passwordValue: this.signUpForm.get('password')?.value,
          isStepValid: this.isStepValid
        });
        break;
      default:
        this.isStepValid = false;
        console.log('🔍 DEFAULT STEP VALIDATION:', { isStepValid: this.isStepValid });
    }
    
    console.log('🔍 STEP VALIDATION RESULT:', {
      currentStep: this.currentStep,
      isStepValid: this.isStepValid
    });
  }

  // Check if a step is completed
  isStepCompleted(step: number): boolean {
    switch (step) {
      case 1:
        return this.signUpForm.get('role')?.valid || false;
      case 2:
        return this.signUpForm.get('firstName')?.valid && 
               this.signUpForm.get('lastName')?.valid || false;
      case 3:
        return this.signUpForm.get('email')?.valid && 
               this.signUpForm.get('mobile')?.valid &&
               this.signUpForm.get('country')?.valid || false;
      case 4:
        return this.signUpForm.get('password')?.valid || false;
      default:
        return false;
    }
  }

  // Check if a step is accessible
  isStepAccessible(step: number): boolean {
    if (step === 1) return true;
    return this.isStepCompleted(step - 1);
  }

  // Method to handle form submission from the submit button
  onSubmit() {
    console.log('🎯 FORM SUBMIT TRIGGERED');
    console.log('🎯 FORM STATE:', {
      valid: this.signUpForm.valid,
      pristine: this.signUpForm.pristine,
      dirty: this.signUpForm.dirty,
      touched: this.signUpForm.touched,
      value: this.signUpForm.value
    });
    
    // Log individual field validation
    Object.keys(this.signUpForm.controls).forEach(key => {
      const control = this.signUpForm.get(key);
      console.log(`🎯 Field ${key}:`, {
        value: control?.value,
        valid: control?.valid,
        errors: control?.errors,
        touched: control?.touched,
        dirty: control?.dirty
      });
    });
    
    // Additional validation for country selection
    if (!this.selectedCountry) {
      console.log('❌ NO COUNTRY SELECTED');
      this.notification.showError('Please select your country');
      return;
    }
    
    if (this.signUpForm.valid) {
      this.signupFormSubmit(this.signUpForm.value);
    } else {
      console.log('❌ FORM IS INVALID, SHOWING ERRORS');
      this.signUpForm.markAllAsTouched();
      this.notification.showError('Please fill in all required fields correctly');
    }
  }

  async signupFormSubmit(form: any) {
    console.log('🚀 signupFormSubmit CALLED WITH:', form);
    
    if (!this.signUpForm.valid) {
      console.log('❌ FORM VALIDATION FAILED');
      this.notification.showError(
        'Please fill in all required fields correctly'
      );
      return;
    }

    const waitingModal = await this.showLoader();

    try {
      // Log the incoming form data
      console.log('🔍 INCOMING FORM DATA:', form);
      console.log('🔍 FORM VALIDATION STATUS:', this.signUpForm.valid);
      console.log('🔍 FORM ERRORS:', this.signUpForm.errors);
      
      // Log individual field values and validation
      Object.keys(this.signUpForm.controls).forEach(key => {
        const control = this.signUpForm.get(key);
        console.log(`🔍 Field: ${key}`, {
          value: control?.value,
          valid: control?.valid,
          errors: control?.errors,
          touched: control?.touched,
          dirty: control?.dirty
        });
      });

      this.signupParams = {
        username: form.firstName,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phoneNumber: form.mobile,
        password: form.password,
        roles: form.role,
        country: form.country, // Add the country field
      };

      // Log the processed signup parameters
      console.log('🚀 PROCESSED SIGNUP PARAMS:', this.signupParams);
      console.log('🚀 PARAMS TYPE CHECK:', {
        username: typeof this.signupParams.username,
        firstName: typeof this.signupParams.firstName,
        lastName: typeof this.signupParams.lastName,
        email: typeof this.signupParams.email,
        phoneNumber: typeof this.signupParams.phoneNumber,
        password: typeof this.signupParams.password,
        roles: typeof this.signupParams.roles,
        country: typeof this.signupParams.country
      });

      // Log the API call details
      console.log('📡 MAKING API CALL TO:', 'authService.register');
      console.log('📡 WITH PARAMS:', this.signupParams);
      
      const response = await firstValueFrom(
        this.authService.register(this.signupParams)
      );

      if (response?._id) {
        // Send welcome email
        await this.sendWelcomeEmail(form);
        
        this.showSuccessMessage = true;
        this.notification.showToastSuccess(
          'Registration successful! Welcome to Lidapay!'
        );
        
        // Auto-navigate after showing success message
        setTimeout(() => {
          this.route.navigate(['./login']);
        }, 3000);
      } else {
        throw new Error('Registration failed');
      }
    } catch (error: any) {
      console.error('❌ REGISTER ERROR ==>', error);
      console.error('❌ ERROR DETAILS:', {
        status: error.status,
        statusText: error.statusText,
        message: error.message,
        error: error.error,
        url: error.url
      });
      
      // Log the full error object for debugging
      console.error('❌ FULL ERROR OBJECT:', JSON.stringify(error, null, 2));
      
      this.handleRegistrationError(error);
    } finally {
      waitingModal.dismiss();
    }
  }

  private async sendWelcomeEmail(userData: any) {
    try {
      // Create welcome email content
      const welcomeEmail = {
        to: userData.email,
        subject: 'Welcome to Lidapay! 🎉',
        template: 'welcome',
        data: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          email: userData.email
        }
      };

      // Send welcome email using the email service
      const emailResponse = await firstValueFrom(
        this.emailService.sendWelcomeEmail(welcomeEmail)
      );

      if (emailResponse.success) {
        console.log('Welcome email sent successfully:', emailResponse.message);
      } else {
        console.warn('Welcome email failed:', emailResponse.message);
      }
      
    } catch (error) {
      console.error('Error sending welcome email:', error);
      // Don't fail the registration if email fails
    }
  }

  private handleRegistrationError(error: any) {
    console.log('🔍 HANDLING REGISTRATION ERROR:', error);
    
    if (error.status === 409) {
      this.notification.showError(
        'This email or phone number is already registered'
      );
    } else if (error.status === 400) {
      // Handle validation errors from the API
      if (error.error?.message) {
        const errorMessage = error.error.message;
        
        // Check if it's a structured error message
        if (typeof errorMessage === 'object' && errorMessage.message) {
          // Handle nested error structure
          const messages = errorMessage.message;
          if (Array.isArray(messages)) {
            // Show the first error message
            this.notification.showError(messages[0]);
          } else if (typeof messages === 'string') {
            this.notification.showError(messages);
          } else {
            this.notification.showError('Invalid input data');
          }
        } else if (typeof errorMessage === 'string') {
          // Handle simple string error message
          if (errorMessage.toLowerCase().includes('email')) {
            this.notification.showError('Please enter a valid email address');
          } else if (errorMessage.toLowerCase().includes('password')) {
            this.notification.showError(
              'Password must be at least 8 characters long'
            );
          } else if (errorMessage.toLowerCase().includes('country')) {
            this.notification.showError('Please select a valid country');
          } else {
            this.notification.showError(errorMessage);
          }
        } else {
          this.notification.showError('Invalid input data');
        }
      } else {
        this.notification.showError('Invalid input data');
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
      if (field === 'country' && control.errors['required']) {
        return 'Please select your country';
      }
    }
    return '';
  }

  selectRole(role: string) {
    this.signUpForm.patchValue({ role });
    this.signUpForm.get('role')?.markAsTouched();
  }

  // Enhanced keyboard handling methods
  onInputFocus(event: any, fieldName: string) {
    // Scroll to the focused input with keyboard awareness
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
    
    // Mark field as touched for validation
    this.signUpForm.get(fieldName)?.markAsTouched();
  }

  onInputBlur() {
    // Handle any blur logic if needed
    // This method is called when input loses focus
  }

  // Enhanced keyboard event handling
  onKeyPress(event: KeyboardEvent, fieldName: string) {
    // Handle Enter key for form navigation
    if (event.key === 'Enter') {
      event.preventDefault();
      
      // Find next input field based on current step
      const nextField = this.getNextFieldInStep(fieldName);
      
      if (nextField) {
        // Focus next field
        const nextInput = document.querySelector(`[formControlName="${nextField}"]`) as HTMLElement;
        if (nextInput) {
          nextInput.focus();
        }
      } else {
        // Last field in step, try to go to next step
        this.nextStep();
      }
    }
  }

  private getNextFieldInStep(fieldName: string): string | null {
    const stepFieldOrder = {
      1: ['firstName', 'lastName'],
      2: ['email', 'country', 'mobile'],
      3: ['password', 'confirmPassword']
    };
    
    const currentStepFields = stepFieldOrder[this.currentStep as keyof typeof stepFieldOrder] || [];
    const currentIndex = currentStepFields.indexOf(fieldName);
    const nextIndex = currentIndex + 1;
    
    return nextIndex < currentStepFields.length ? currentStepFields[nextIndex] : null;
  }

  onInputChange(event: any, fieldName: string) {
    // Handle real-time validation or other input change logic
    const value = event.detail.value;
    
    // Trigger validation
    const control = this.signUpForm.get(fieldName);
    if (control) {
      control.setValue(value, { emitEvent: false });
      control.markAsTouched();
    }
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
