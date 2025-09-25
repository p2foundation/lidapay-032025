import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, firstValueFrom, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { BrowserService } from '../../services/browser.service';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonCard,
  IonCardContent,
  IonButtons,
  IonBackButton,
  IonIcon,
  IonChip,
  IonSpinner,
  IonToggle,
  IonBadge,
  IonGrid,
  IonRow,
  IonCol,
  IonNote,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  arrowBackOutline, 
  arrowForwardOutline,
  searchOutline,
  personOutline,
  informationCircleOutline,
  checkmarkCircleOutline,
  wifiOutline,
  timeOutline,
  bugOutline,
  refreshOutline, chevronForward, cellularOutline, closeCircle } from 'ionicons/icons';

import { EnhancedAirtimeService, Country, Operator } from '../../services/enhanced-airtime.service';
import { NotificationService } from '../../services/notification.service';
import { AccountService } from '../../services/auth/account.service';
import { AdvansisPayService } from '../../services/payments/advansis-pay.service';
import { StorageService } from '../../services/storage.service';
import { UtilsService } from '../../services/utils.service';
import { ReloadlyService } from '../../services/reloadly.service';
import { ReloadlyDataService } from '../../services/reloadly/reloadly-data.service';
import { InternetDataService } from '../../services/one4all/internet.data.service';
import { Profile } from '../../interfaces/profile.interface';

// Register all icons used in this component
addIcons({
  'arrow-back': arrowBackOutline,
  'arrow-forward': arrowForwardOutline,
  'search': searchOutline,
  'person': personOutline,
  'information-circle': informationCircleOutline,
  'checkmark-circle': checkmarkCircleOutline,
  'wifi': wifiOutline,
  'time': timeOutline,
  'bug': bugOutline,
  'refresh': refreshOutline,
  'close-circle': closeCircle,
  'chevron-forward': chevronForward,
  'cellular-outline': cellularOutline,
  'wifi-outline': wifiOutline,
  'time-outline': timeOutline
});

enum WizardStep {
  COUNTRY_SELECTION = 0,
  OPERATOR_SELECTION = 1,
  PHONE_NUMBER = 2,
  DATA_BUNDLE_SELECTION = 3,
  CONFIRMATION = 4,
  PROCESSING = 5,
}

interface DataBundle {
  plan_id: string;
  validity: string;
  plan_name: string;
  type: string;
  volume: string;
  category: string;
  price: string;
  flexible_amount: boolean;
  network_code: string;
  network_id: number;
  network: {
    id: number;
    code: string;
    name: string;
  };
}

@Component({
  selector: 'app-enhanced-buy-internet-data',
  templateUrl: './enhanced-buy-internet-data.page.html',
  styleUrls: ['./enhanced-buy-internet-data.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    TranslateModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonItem,
    IonLabel,
    IonInput,
    IonCard,
    IonCardContent,
    IonButtons,
    IonBackButton,
    IonIcon,
    IonChip,
    IonSpinner,
    IonToggle,
    IonBadge,
    IonGrid,
    IonRow,
    IonCol,
    IonNote,
  ],
})
export class EnhancedBuyInternetDataPage implements OnInit, OnDestroy {
  currentStep = WizardStep.COUNTRY_SELECTION;
  wizardSteps = WizardStep;

  // Form data
  internetDataForm: FormGroup;

  // Data
  countries: Country[] = [];
  operators: Operator[] = [];
  selectedCountry: Country | null = null;
  selectedOperator: Operator | null = null;
  detectedOperator: Operator | null = null;
  userProfile: Profile = {} as Profile;
  dataBundles: DataBundle[] = [];
  selectedBundle: DataBundle | null = null;
  // Reloadly bundles (flattened from list-operators)
  reloadlyBundles: Array<{
    operatorId: number;
    operatorName: string;
    amount: number;
    localAmount: number | null;
    description: string;
    currency: string;
    localCurrency: string;
  }> = [];
  selectedReloadlyBundle: {
    operatorId: number;
    operatorName: string;
    amount: number;
    localAmount: number | null;
    description: string;
    currency: string;
    localCurrency: string;
  } | null = null;

  // UI States
  isLoading = false;
  isDetectingOperator = false;
  showOperatorModal = false;
  isProcessing = false;
  searchQuery = '';
  filteredCountries: Country[] = [];
  isLoadingCountries = false;

  // Payment and transaction properties
  private readonly GHANA_ISO = 'GH';
  internetDataParams: any = {};

  private destroy$ = new Subject<void>();
  private isFormattingPhone = false; // Flag to prevent recursive formatting

  constructor(
    private formBuilder: FormBuilder,
    private enhancedAirtimeService: EnhancedAirtimeService,
    private notificationService: NotificationService,
    private accountService: AccountService,
    private advansisPayService: AdvansisPayService,
    private storage: StorageService,
    private utilService: UtilsService,
    private reloadlyService: ReloadlyService,
    private internetDataService: InternetDataService,
    private reloadlyDataService: ReloadlyDataService,
    private browserService: BrowserService
  ) {
    this.internetDataForm = this.formBuilder.group({
      countryIso: ['', Validators.required],
      operatorId: ['', Validators.required],
      recipientNumber: ['', [Validators.required, Validators.minLength(7)]],
      dataBundleId: ['', Validators.required],
      autoDetect: [true]
    });
  }

  ngOnInit() {
    console.log('=== NGONINIT CALLED ===');
    console.log('Current step:', this.currentStep);
    console.log('WizardStep.PHONE_NUMBER:', WizardStep.PHONE_NUMBER);
    
    this.loadUserProfile();
    this.loadCountries();
    this.setupFormListeners();
    this.filteredCountries = this.countries; // Initialize filtered countries
    
    // Watch for step changes to populate phone number when reaching step 3
    this.watchStepChanges();
    console.log('=== END NGONINIT ===');
  }

  ionViewWillEnter() {
    console.log('=== ION VIEW WILL ENTER ===');
    console.log('Current step:', this.currentStep);
    console.log('WizardStep.PHONE_NUMBER:', WizardStep.PHONE_NUMBER);
    console.log('Are we on phone step?', this.currentStep === WizardStep.PHONE_NUMBER);
    console.log('Current userProfile:', this.userProfile);
    console.log('userProfile has phone number?', !!this.userProfile?.phoneNumber);
    
    // If we're on the phone number step, try to populate
    if (this.currentStep === WizardStep.PHONE_NUMBER) {
      console.log('On phone step in ionViewWillEnter, triggering population...');
      console.log('Setting timeout for 300ms...');
      setTimeout(() => {
        console.log('ionViewWillEnter timeout fired, calling prefillPhoneFromStorageIfAvailable...');
        this.prefillPhoneFromStorageIfAvailable();
      }, 300);
    } else {
      console.log('Not on phone step in ionViewWillEnter, current step:', this.currentStep);
      console.log('Will not trigger population');
    }
    console.log('=== END ION VIEW WILL ENTER ===');
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Watch for step changes to trigger phone number population
  private watchStepChanges() {
    console.log('=== WATCH STEP CHANGES CALLED ===');
    console.log('Current step:', this.currentStep);
    
    // Check if we're already on step 3 and populate if needed
    if (this.currentStep === WizardStep.PHONE_NUMBER) {
      console.log('Already on phone number step, triggering population...');
      setTimeout(() => {
        this.prefillPhoneFromStorageIfAvailable();
      }, 500);
    }
    console.log('=== END WATCH STEP CHANGES ===');
  }

  // Navigation methods
  nextStep() {
    console.log('=== NEXT STEP CALLED ===');
    console.log('Current step before increment:', this.currentStep);
    
    if (this.currentStep < WizardStep.PROCESSING) {
      this.currentStep++;
      console.log('Step incremented to:', this.currentStep);
      
      // For non-Ghanaian countries, skip operator selection step
      if (this.currentStep === WizardStep.OPERATOR_SELECTION && 
          this.selectedCountry?.isoName !== this.GHANA_ISO) {
        console.log('Skipping operator selection for international country, jumping to phone step');
        this.currentStep = WizardStep.PHONE_NUMBER;
        console.log('Now on step:', this.currentStep);
      }
      
      // When reaching phone number step, pull profile from storage and prefill
      if (this.currentStep === WizardStep.PHONE_NUMBER) {
        console.log('Reached phone number step, triggering population...');
        setTimeout(() => {
          this.prefillPhoneFromStorageIfAvailable();
        }, 100);
      }
    } else {
      console.log('Already at max step, cannot increment');
    }
    console.log('=== END NEXT STEP ===');
  }

  previousStep() {
    console.log('=== PREVIOUS STEP CALLED ===');
    console.log('Current step before decrement:', this.currentStep);
    
    if (this.currentStep > WizardStep.COUNTRY_SELECTION) {
      this.currentStep--;
      console.log('Step decremented to:', this.currentStep);
      
      // For non-Ghanaian countries, skip operator selection step when going back
      if (this.currentStep === WizardStep.OPERATOR_SELECTION && 
          this.selectedCountry?.isoName !== this.GHANA_ISO) {
        console.log('Skipping operator selection when going back, jumping to country step');
        this.currentStep = WizardStep.COUNTRY_SELECTION;
        console.log('Now on step:', this.currentStep);
      }
    } else {
      console.log('Already at first step, cannot decrement');
    }
    console.log('=== END PREVIOUS STEP ===');
  }

  goToStep(step: WizardStep) {
    console.log('=== GO TO STEP CALLED ===');
    console.log('Requested step:', step);
    console.log('Current step:', this.currentStep);
    
    if (step <= this.currentStep) {
      console.log('Going to step:', step);
      this.currentStep = step;
      
      // When reaching phone number step via goToStep, also populate
      if (this.currentStep === WizardStep.PHONE_NUMBER) {
        console.log('Reached phone number step, triggering population...');
        setTimeout(() => {
          this.prefillPhoneFromStorageIfAvailable();
        }, 100);
      }
    } else {
      console.log('Cannot go to step, it\'s beyond current step');
    }
    console.log('=== END GO TO STEP ===');
  }

  // Form setup and listeners
  private setupFormListeners() {
    // Phone number input listener with debouncing and better validation
    this.internetDataForm
      .get('recipientNumber')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((phoneNumber) => {
        if (phoneNumber && !this.isFormattingPhone) {
          this.isFormattingPhone = true; // Set flag to prevent recursion
          
          let formattedNumber = phoneNumber;
          
          // For Ghana, ensure we format to local format without any country code prefix
          if (this.selectedCountry?.isoName === this.GHANA_ISO) {
            formattedNumber = this.enhancedAirtimeService.formatPhoneNumberForAPI(
              phoneNumber,
              this.GHANA_ISO
            );
            
            if (formattedNumber !== phoneNumber) {
              // Update the form with formatted number (without triggering valueChanges again)
              this.internetDataForm.get('recipientNumber')?.setValue(formattedNumber, { emitEvent: false });
              console.log('setupFormListeners - Ghana formatted:', phoneNumber, '->', formattedNumber);
            }
          } else {
            // For other countries, use the enhanced airtime service
            formattedNumber = this.enhancedAirtimeService.formatPhoneNumberForAPI(
              phoneNumber,
              this.selectedCountry?.isoName || ''
            );
            
            if (formattedNumber !== phoneNumber) {
              // Update the form with formatted number (without triggering valueChanges again)
              this.internetDataForm.get('recipientNumber')?.setValue(formattedNumber, { emitEvent: false });
              console.log('Phone number formatted:', phoneNumber, '->', formattedNumber);
            }
          }
          
          // Auto-detect operator for international countries
          if (this.internetDataForm.get('autoDetect')?.value && this.selectedCountry?.isoName !== this.GHANA_ISO) {
            this.autoDetectOperator(formattedNumber);
          }
          
          // Reset flag after formatting is complete
          setTimeout(() => {
            this.isFormattingPhone = false;
          }, 100);
        }
      });
  }
  // Data loading methods
  private async loadUserProfile() {
    console.log('=== LOADING USER PROFILE ===');
    console.log('Current step when loading profile:', this.currentStep);
    
    try {
      console.log('Attempting to load profile from API...');
      const response = await firstValueFrom(this.accountService.getProfile());
      
      if (response) {
        console.log('Profile loaded from API successfully');
        console.log('Profile phone number:', response.phoneNumber);
        
        this.userProfile = response;
        
        // If we're on the phone number step and have a phone number, populate it
        if (this.currentStep === WizardStep.PHONE_NUMBER && response.phoneNumber) {
          console.log('Profile loaded and on phone step, triggering population...');
          setTimeout(() => {
            this.populateUserPhoneNumber();
          }, 100);
        }
      } else {
        console.log('No profile from API, trying storage...');
        // Fallback to storage if API fails
        await this.tryLoadProfileFromStorage();
      }
    } catch (error) {
      console.error('Error loading profile from API:', error);
      console.log('Falling back to storage...');
      // Fallback to storage if API fails
      await this.tryLoadProfileFromStorage();
    }
    console.log('=== END LOADING USER PROFILE ===');
  }

  /**
   * Try to load profile from storage as a fallback
   */
  private async tryLoadProfileFromStorage() {
    console.log('=== TRYING TO LOAD PROFILE FROM STORAGE ===');
    console.log('Current step when trying storage:', this.currentStep);
    console.log('Current userProfile when trying storage:', this.userProfile);
    
    try {
      console.log('Calling storage.getStorage("profile")...');
      const storedProfile = await this.storage.getStorage('profile');
      console.log('Storage response received:', storedProfile);
      
      if (storedProfile) {
        console.log('Profile loaded from storage successfully:', storedProfile);
        console.log('Stored profile phone number:', storedProfile.phoneNumber);
        console.log('Stored profile has phone number?', !!storedProfile.phoneNumber);
        
        this.userProfile = storedProfile as Profile;
        console.log('userProfile updated from storage:', this.userProfile);
        
        // If we're on the phone number step and have a phone number, populate it
        if (this.currentStep === WizardStep.PHONE_NUMBER && storedProfile.phoneNumber) {
          console.log('Profile loaded from storage and on phone step, triggering population...');
          console.log('Setting timeout for 100ms...');
          setTimeout(() => {
            console.log('Timeout fired, calling populateUserPhoneNumber...');
            this.populateUserPhoneNumber();
          }, 100);
        } else {
          console.log('Not triggering population from storage - reasons:');
          console.log('  - Current step:', this.currentStep);
          console.log('  - Phone step?', this.currentStep === WizardStep.PHONE_NUMBER);
          console.log('  - Has phone number?', !!storedProfile.phoneNumber);
        }
      } else {
        console.log('No profile found in storage either');
        console.log('Storage returned:', storedProfile);
      }
    } catch (storageError) {
      console.error('Error loading profile from storage:', storageError);
      console.log('Storage error details:', storageError);
    }
    console.log('=== END TRYING TO LOAD PROFILE FROM STORAGE ===');
  }

  /**
   * Populate the recipient phone number field with the user's own phone number
   * This provides a convenient default that users can choose to accept or change
   */
  private populateUserPhoneNumber() {
    console.log('=== POPULATE USER PHONE NUMBER ===');
    console.log('User profile phone:', this.userProfile?.phoneNumber);
    console.log('Selected country:', this.selectedCountry?.isoName);
    
    if (!this.userProfile?.phoneNumber) {
      console.log('No phone number in userProfile, skipping population');
      return;
    }
    
    console.log('Populating recipient phone number with user phone:', this.userProfile.phoneNumber);
    
    // Format the user's phone number based on the selected country
    let formattedNumber = this.userProfile.phoneNumber;
    
    if (this.selectedCountry?.isoName === this.GHANA_ISO) {
      console.log('Formatting for Ghana...');
      // For Ghana, ensure local format (0240000000)
      formattedNumber = this.enhancedAirtimeService.formatPhoneNumberForAPI(
        this.userProfile.phoneNumber,
        this.GHANA_ISO
      );
      console.log('Ghana formatted result:', formattedNumber);
    } else {
      console.log('Formatting for international country:', this.selectedCountry?.isoName);
      // For other countries, use the enhanced airtime service
      formattedNumber = this.enhancedAirtimeService.formatPhoneNumberForAPI(
        this.userProfile.phoneNumber,
        this.selectedCountry?.isoName || ''
      );
      console.log('International formatted result:', formattedNumber);
    }
    
    console.log('Setting form value:', formattedNumber);
    
    // Update the form with the user's phone number
    this.internetDataForm.patchValue({ recipientNumber: formattedNumber });
    
    // Verify the form was updated
    const formValueAfterPatch = this.internetDataForm.get('recipientNumber')?.value;
    console.log('Form value after patch:', formValueAfterPatch);
    
    // Show a notification to inform the user
    this.notificationService.showToast(
      `Your phone number (${formattedNumber}) has been pre-filled. You can change it if needed.`,
      'primary',
      4000
    );
    
    console.log('Phone number population completed successfully');
    console.log('=== END POPULATE USER PHONE NUMBER ===');
  }

  /**
   * Prefill the phone number by reading the cached profile from storage.
   * Falls back to the already loaded profile if present.
   */
  private async prefillPhoneFromStorageIfAvailable() {
    console.log('=== PHONE PREFILL DEBUG ===');
    console.log('Current step:', this.currentStep);
    console.log('Current userProfile:', this.userProfile);
    console.log('Current form recipientNumber value:', this.internetDataForm.get('recipientNumber')?.value);
    
    try {
      // If we don't have a profile or it lacks phone, read it from storage
      if (!this.userProfile?.phoneNumber) {
        console.log('No phone number in userProfile, reading from storage...');
        const storedProfile = await this.storage.getStorage('profile');
        console.log('Stored profile from storage:', storedProfile);
        
        if (storedProfile && storedProfile.phoneNumber) {
          console.log('Found phone number in storage:', storedProfile.phoneNumber);
          this.userProfile = storedProfile as Profile;
          console.log('Updated userProfile with stored data:', this.userProfile);
        } else {
          console.log('No phone number found in stored profile');
        }
      } else {
        console.log('Phone number already available in userProfile:', this.userProfile.phoneNumber);
      }

      // Check if we should populate the form
      const currentFormValue = this.internetDataForm.get('recipientNumber')?.value;
      const shouldPopulate = !currentFormValue || currentFormValue === this.userProfile?.phoneNumber;
      
      console.log('Should populate form?', shouldPopulate);
      console.log('Current form value:', currentFormValue);
      console.log('Profile phone number:', this.userProfile?.phoneNumber);

      if (shouldPopulate && this.userProfile?.phoneNumber) {
        console.log('Proceeding to populate phone number...');
        this.populateUserPhoneNumber();
      } else {
        console.log('Skipping population - form already has value or no phone number available');
      }
    } catch (err) {
      console.error('Error pre-filling phone from storage:', err);
    }
    
    console.log('=== END PHONE PREFILL DEBUG ===');
  }

  /**
   * Clear the pre-filled phone number to allow user to enter a different number
   */
  public clearPhoneNumber() {
    console.log('=== CLEAR PHONE NUMBER ===');
    console.log('Current form value before clearing:', this.internetDataForm.get('recipientNumber')?.value);
    
    // Clear the phone number field
    this.internetDataForm.patchValue({ recipientNumber: '' });
    
    // Mark the field as touched and dirty for validation
    const phoneControl = this.internetDataForm.get('recipientNumber');
    if (phoneControl) {
      phoneControl.markAsTouched();
      phoneControl.markAsDirty();
    }
    
    console.log('Form value after clearing:', this.internetDataForm.get('recipientNumber')?.value);
    
    // Show notification to user
    this.notificationService.showToast(
      'Phone number cleared. You can now enter a different number.',
      'info',
      3000
    );
    
    console.log('=== END CLEAR PHONE NUMBER ===');
  }

  private loadCountries() {
    this.isLoadingCountries = true;
    
    // Add a minimum loading time to show the loading state properly
    const loadingPromise = new Promise(resolve => setTimeout(resolve, 800));
    
    this.enhancedAirtimeService.getCountries().subscribe({
      next: async (countries) => {
        // Wait for minimum loading time
        await loadingPromise;
        
        this.countries = countries;
        this.filteredCountries = countries; // Initialize filtered countries
        console.log('[Enhanced Internet Data] Countries loaded:', countries.length);
        console.log('[Enhanced Internet Data] First few countries:', countries.slice(0, 5));
        console.log('[Enhanced Internet Data] Ghana found:', countries.find(c => c.isoName === this.GHANA_ISO));
        
        // Try to detect user's home country intelligently
        await this.detectUserHomeCountry(countries);
      },
      error: (error) => {
        console.error('Error loading countries:', error);
        this.notificationService.showError('Failed to load countries');
      },
      complete: () => {
        this.isLoadingCountries = false;
      }
    });
  }
  /**
   * Intelligently detect user's home country based on multiple factors
   */
  private async detectUserHomeCountry(countries: Country[]) {
    try {
      // 1. First priority: Check if user has a saved country preference
      const userCountry = await this.storage.getStorage('userCountry');
      if (userCountry && userCountry.isoName) {
        const preferredCountry = countries.find(c => c.isoName === userCountry.isoName);
        if (preferredCountry) {
          console.log('✅ Using user saved country preference:', preferredCountry.name);
          this.selectCountry(preferredCountry);
          return;
        }
      }

      // 2. Second priority: Check user's profile for phone number country code
      if (this.userProfile?.phoneNumber) {
        const phoneCountryCode = this.extractCountryCodeFromPhone(this.userProfile.phoneNumber);
        if (phoneCountryCode) {
          const phoneCountry = countries.find(c => c.isoName === phoneCountryCode);
          if (phoneCountry) {
            console.log('✅ Using country from user phone number:', phoneCountry.name);
            this.selectCountry(phoneCountry);
            return;
          }
        }
      }

      // 3. Third priority: Check device locale/timezone for location hints
      const deviceCountry = this.detectDeviceCountry();
      if (deviceCountry) {
        const detectedCountry = countries.find(c => c.isoName === deviceCountry);
        if (detectedCountry) {
          console.log('✅ Using device-detected country:', detectedCountry.name);
          this.selectCountry(detectedCountry);
          return;
        }
      }

      // 4. Fallback: Use Ghana as default for African context
      const ghanaCountry = countries.find(c => c.isoName === this.GHANA_ISO);
      if (ghanaCountry) {
        console.log('ℹ️ Using Ghana as default country (African context)');
        this.selectCountry(ghanaCountry);
        return;
      }

      // 5. Last resort: Don't auto-select, let user choose
      console.log('ℹ️ No country auto-detected, user must select manually');
      
    } catch (error) {
      console.error('Error detecting user home country:', error);
      // Continue without auto-selection
    }
  }

  /**
   * Extract country code from phone number
   */
  private extractCountryCodeFromPhone(phoneNumber: string): string | null {
    if (!phoneNumber) return null;
    
    // Remove all non-digit characters
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Check for common country codes
    if (cleanNumber.startsWith('233') && cleanNumber.length >= 12) {
      return 'GH'; // Ghana
    } else if (cleanNumber.startsWith('234') && cleanNumber.length >= 12) {
      return 'NG'; // Nigeria
    } else if (cleanNumber.startsWith('254') && cleanNumber.length >= 12) {
      return 'KE'; // Kenya
    } else if (cleanNumber.startsWith('256') && cleanNumber.length >= 12) {
      return 'UG'; // Uganda
    } else if (cleanNumber.startsWith('255') && cleanNumber.length >= 12) {
      return 'TZ'; // Tanzania
    }
    
    return null;
  }

  /**
   * Detect country from device locale and timezone
   */
  private detectDeviceCountry(): string | null {
    try {
      // Try to get from navigator.language
      if (navigator.language) {
        const lang = navigator.language.toLowerCase();
        if (lang.includes('gh') || lang.includes('en-gh')) return 'GH';
        if (lang.includes('ng') || lang.includes('en-ng')) return 'NG';
        if (lang.includes('ke') || lang.includes('en-ke')) return 'KE';
        if (lang.includes('ug') || lang.includes('en-ug')) return 'UG';
        if (lang.includes('tz') || lang.includes('en-tz')) return 'TZ';
      }

      // Try to get from timezone
      if (Intl && Intl.DateTimeFormat) {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (timezone.includes('Accra')) return 'GH';
        if (timezone.includes('Lagos')) return 'NG';
        if (timezone.includes('Nairobi')) return 'KE';
        if (timezone.includes('Kampala')) return 'UG';
        if (timezone.includes('Dar_es_Salaam')) return 'TZ';
      }

      return null;
    } catch (error) {
      console.error('Error detecting device country:', error);
      return null;
    }
  }

  public loadOperators(countryIso: string) {
    // For non-Ghanaian countries, skip operator loading since we'll use auto-detection
    if (countryIso !== this.GHANA_ISO) {
      this.operators = [];
      this.selectedOperator = null;
      this.internetDataForm.patchValue({ operatorId: '' });
      return;
    }

    this.isLoading = true;
    this.enhancedAirtimeService
      .getOperators(countryIso)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (operators) => {
          this.operators = operators;
          this.selectedOperator = null;
          this.internetDataForm.patchValue({ operatorId: '' });
        },
        error: (error) => {
          console.error('Error loading operators:', error);
          this.notificationService.showError('Failed to load operators');
        },
        complete: () => {
          this.isLoading = false;
        },
      });
  }

  /**
   * Updates form validation based on selected country
   */
  private updateFormValidation(countryIso: string) {
    const operatorIdControl = this.internetDataForm.get('operatorId');
    const dataBundleIdControl = this.internetDataForm.get('dataBundleId');
    
    if (countryIso === this.GHANA_ISO) {
      // For Ghana, operator selection is required
      operatorIdControl?.setValidators([Validators.required]);
      // For Ghana, a specific One4All data bundle is required
      dataBundleIdControl?.setValidators([Validators.required]);
    } else {
      // For international countries, operator selection is not required (auto-detection will be used)
      operatorIdControl?.clearValidators();
      // For international countries using Reloadly, a One4All dataBundleId is not applicable
      dataBundleIdControl?.clearValidators();
    }
    
    operatorIdControl?.updateValueAndValidity();
    dataBundleIdControl?.updateValueAndValidity();
  }

  // Load data bundles from the actual API
  private async loadDataBundles(networkId: number) {
    this.isLoading = true;
    try {
      console.log('[Enhanced Internet Data] Loading bundles for network:', networkId);
      
      // Call the actual getDataBundle API
      const response = await firstValueFrom(
        this.internetDataService.internetBundleList({ network: networkId.toString() })
      );

      console.log('[Enhanced Internet Data] Bundle response:', response);

      if (response && response.status === 'OK' && response.bundles) {
        this.dataBundles = response.bundles;
        console.log('[Enhanced Internet Data] Bundles loaded:', this.dataBundles);
      } else {
        this.notificationService.showError(response?.message || 'Failed to load data bundles');
        this.dataBundles = [];
      }
    } catch (error) {
      console.error('Error loading data bundles:', error);
      this.notificationService.showError('Failed to load data bundles');
      this.dataBundles = [];
    } finally {
      this.isLoading = false;
    }
  }

  // Fetch Reloadly data bundles for country and flatten both USD and local descriptions
  private async loadReloadlyBundlesForCountry(countryIso: string) {
    if (!countryIso) return;
    try {
      console.log('[Enhanced Internet Data] Loading Reloadly list-operators for', countryIso);
      const res = await firstValueFrom(
        this.reloadlyDataService.listCountryOperators({ countryCode: countryIso })
      );
      console.log('[Enhanced Internet Data] Raw Reloadly response:', res);
      console.log('[Enhanced Internet Data] Response type:', typeof res);
      console.log('[Enhanced Internet Data] Is array?', Array.isArray(res));
      
      const flattened: typeof this.reloadlyBundles = [];
      
      // Handle both array and single object responses
      let operators;
      if (Array.isArray(res)) {
        operators = res;
      } else if (res && typeof res === 'object') {
        // If it's a single object, wrap it in an array
        operators = [res];
      } else {
        console.error('[Enhanced Internet Data] Invalid response format:', res);
        operators = [];
      }
      console.log('[Enhanced Internet Data] Processing', operators.length, 'operators');
      
      for (const op of operators) {
        console.log('[Enhanced Internet Data] Processing operator:', op);
        const operatorId = op?.operatorId ?? op?.id;
        const operatorName = op?.name ?? '';
        const currency = op?.senderCurrencyCode ?? 'USD';
        const localCurrency = op?.destinationCurrencyCode ?? countryIso;
        
        console.log('[Enhanced Internet Data] Operator details:', {
          operatorId,
          operatorName,
          currency,
          localCurrency,
          hasFixedAmounts: !!op?.fixedAmountsDescriptions,
          hasLocalFixedAmounts: !!op?.localFixedAmountsDescriptions
        });

        const fad = op?.fixedAmountsDescriptions || {};
        Object.keys(fad).forEach((key) => {
          const amount = parseFloat(key);
          if (!Number.isFinite(amount)) return;
          flattened.push({
            operatorId,
            operatorName,
            amount,
            localAmount: null,
            description: fad[key],
            currency,
            localCurrency,
          });
        });

        const lfd = op?.localFixedAmountsDescriptions || {};
        Object.keys(lfd).forEach((key) => {
          const localAmount = parseFloat(key);
          if (!Number.isFinite(localAmount)) return;
          const fxRate = op?.fx?.rate || 0;
          flattened.push({
            operatorId,
            operatorName,
            amount: fxRate ? localAmount / fxRate : 0,
            localAmount,
            description: lfd[key],
            currency,
            localCurrency,
          });
        });
      }
      this.reloadlyBundles = flattened.sort((a, b) => (a.localAmount ?? a.amount) - (b.localAmount ?? b.amount));
      console.log('[Enhanced Internet Data] Reloadly bundles flattened count:', this.reloadlyBundles.length);
      console.log('[Enhanced Internet Data] First few bundles:', this.reloadlyBundles.slice(0, 3));
      console.log('[Enhanced Internet Data] Unique operator IDs in bundles:', [...new Set(this.reloadlyBundles.map(b => b.operatorId))]);
      
      // If we're currently on PHONE_NUMBER step and bundles exist, automatically move to bundle selection
      if (this.reloadlyBundles.length && this.currentStep === WizardStep.PHONE_NUMBER) {
        this.currentStep = WizardStep.DATA_BUNDLE_SELECTION;
      }
    } catch (err) {
      console.error('Failed to load Reloadly bundles for country', countryIso, err);
      this.reloadlyBundles = [];
    }
  }

  // Selection methods
  selectCountry(country: Country) {
    console.log('=== COUNTRY SELECTION ===');
    console.log('Selected country:', country);
    console.log('Country ISO:', country.isoName);
    console.log('Is Ghana?', country.isoName === this.GHANA_ISO);
    
    this.selectedCountry = country;
    this.internetDataForm.patchValue({ countryIso: country.isoName });

    // Save user's country preference for future use
    this.saveUserCountryPreference(country);

    // Clear any previous operator selection
    this.selectedOperator = null;
    this.detectedOperator = null;
    this.internetDataForm.patchValue({ operatorId: '' });

    // Update form validation based on country
    this.updateFormValidation(country.isoName);

    // Load operators only for Ghana
    if (country.isoName === this.GHANA_ISO) {
      console.log('Loading Ghana operators...');
      this.loadOperators(country.isoName);
    } else {
      // For non-Ghanaian countries, clear operators array
      console.log('Clearing operators for international country');
      this.operators = [];
    }

    this.nextStep();
  }

  /**
   * Save user's country preference to storage
   */
  private async saveUserCountryPreference(country: Country) {
    try {
      await this.storage.setStorage('userCountry', {
        isoName: country.isoName,
        name: country.name,
        currencyCode: country.currencyCode,
        currencyName: country.currencyName,
        flag: country.flag
      });
      console.log('✅ User country preference saved:', country.name);
    } catch (error) {
      console.error('Error saving user country preference:', error);
    }
  }
  selectOperator(operator: Operator) {
    this.selectedOperator = operator;
    this.internetDataForm.patchValue({
      operatorId: operator.id
    });
    
    // Load data bundles for the selected operator using the actual API
    this.loadDataBundles(operator.id);
    
    this.nextStep();
  }

  selectDataBundle(bundle: DataBundle) {
    this.selectedBundle = bundle;
    this.selectedReloadlyBundle = null;
    this.internetDataForm.patchValue({
      dataBundleId: bundle.plan_id
    });
    this.nextStep();
  }

  // Reloadly bundle selection (from list-operators)
  selectReloadlyBundle(bundle: {
    operatorId: number;
    operatorName: string;
    amount: number;
    localAmount: number | null;
    description: string;
    currency: string;
    localCurrency: string;
  }) {
    this.selectedReloadlyBundle = bundle;
    this.selectedBundle = null;
    // Patch a synthetic dataBundleId to satisfy forms that might still check validity
    // even when validators are cleared for international flows.
    this.internetDataForm.patchValue({
      dataBundleId: `reloadly:${bundle.operatorId}:${bundle.description}`
    });
    this.nextStep();
  }

  // Filter flattened bundles for the detected/selected operator
  getReloadlyBundlesForSelected(): typeof this.reloadlyBundles {
    const opId = this.selectedOperator?.id || this.detectedOperator?.id || 0;
    console.log('[Enhanced Internet Data] getReloadlyBundlesForSelected - Debug Info:');
    console.log('  selectedOperator:', this.selectedOperator);
    console.log('  detectedOperator:', this.detectedOperator);
    console.log('  opId:', opId);
    console.log('  total reloadlyBundles:', this.reloadlyBundles.length);
    console.log('  first few bundle operatorIds:', this.reloadlyBundles.slice(0, 5).map(b => b.operatorId));
    console.log('  unique operatorIds in bundles:', [...new Set(this.reloadlyBundles.map(b => b.operatorId))]);
    
    // If no operator is selected/detected, return all bundles
    if (!opId) {
      console.log('  No operator selected/detected, returning all bundles');
      return this.reloadlyBundles;
    }
    
    // Filter by operator ID
    const filtered = this.reloadlyBundles.filter(b => b.operatorId === opId);
    console.log('  filtered bundles count:', filtered.length);
    console.log('  filtered bundles:', filtered.slice(0, 3));
    
    // If no bundles match the operator ID, but we have bundles, return all bundles
    // This handles the case where the operator ID from auto-detection doesn't match the bundle operator ID
    if (filtered.length === 0 && this.reloadlyBundles.length > 0) {
      console.log('  No bundles match operator ID, returning all bundles');
      return this.reloadlyBundles;
    }
    
    return filtered;
  }

  // Phone number handling
  onPhoneNumberInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const phoneNumber = target?.value || '';
    
    console.log('=== PHONE NUMBER INPUT ===');
    console.log('Raw input:', phoneNumber);
    console.log('Selected country:', this.selectedCountry?.isoName);
    console.log('Is Ghana?', this.selectedCountry?.isoName === this.GHANA_ISO);
    
    if (this.selectedCountry) {
      // Format phone number based on country
      let formatted: string;
      if (this.selectedCountry.isoName === this.GHANA_ISO) {
        formatted = this.enhancedAirtimeService.formatPhoneNumberForAPI(phoneNumber, this.GHANA_ISO);
        console.log('Ghana formatting result:', phoneNumber, '->', formatted);
      } else {
        formatted = this.enhancedAirtimeService.formatPhoneNumberForAPI(phoneNumber, this.selectedCountry.isoName);
        console.log('International formatting result:', phoneNumber, '->', formatted);
      }
      
      this.internetDataForm.patchValue({ recipientNumber: formatted });
      
      // Trigger validation and debug
      this.internetDataForm.get('recipientNumber')?.updateValueAndValidity();
      this.debugValidationState();
      
      // Auto-detection is now handled by the debounced form listener
      // This provides a better user experience by waiting for the user to finish typing
    }
  }

  // Native-like keyboard handling methods
  onInputFocus(event: any, fieldName: string) {
    // Scroll to the focused input
    const inputElement = event.target;
    if (inputElement) {
      setTimeout(() => {
        inputElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
      }, 300);
    }
    
    // Mark field as touched for validation if it's a form field
    if (this.internetDataForm && this.internetDataForm.get(fieldName)) {
      this.internetDataForm.get(fieldName)?.markAsTouched();
    }
  }

  onInputBlur() {
    // Handle any blur logic if needed
    // This method is called when input loses focus
  }

  private formatPhoneNumberForGhana(phoneNumber: string): string {
    // Remove all non-digits
    let cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Convert Ghanaian phone numbers to local format (0240000000)
    if (cleanNumber.length === 12 && cleanNumber.startsWith('233')) {
      // Convert 233244000000 -> 0244000000
      return '0' + cleanNumber.slice(3);
    } else if (cleanNumber.length === 13 && cleanNumber.startsWith('233')) {
      // Convert +233244000000 -> 0244000000
      return '0' + cleanNumber.slice(3);
    } else if (cleanNumber.length === 10 && cleanNumber.startsWith('0')) {
      // Keep as is: 0240000000
      return cleanNumber;
    }
    
    return phoneNumber;
  }

  private formatPhoneNumberForInternational(phoneNumber: string, countryIso: string): string {
    // For international numbers, ensure they start with +
    let cleanNumber = phoneNumber.replace(/\D/g, '');
    
    if (countryIso === this.GHANA_ISO) {
      return this.formatPhoneNumberForGhana(phoneNumber);
    }
    
    // For other countries, ensure proper international format
    if (!phoneNumber.startsWith('+')) {
      return '+' + cleanNumber;
    }
    
    return phoneNumber;
  }

  // Operator detection
  private async autoDetectOperator(phoneNumber: string) {
    if (!phoneNumber || !this.selectedCountry) return;
    
    // Enable auto-detection for both Ghana and international numbers
    // For Ghana numbers, this will help identify the correct network provider
    
    // Ensure phone number is complete enough for detection
    if (!this.isPhoneNumberComplete(phoneNumber)) {
      return;
    }
    
    this.isDetectingOperator = true;
    
    try {
      console.log('Auto-detecting operator for:', phoneNumber, 'in country:', this.selectedCountry.isoName);
      
      // Show subtle loading indicator
      this.showAutoDetectionStatus('Detecting network provider...');
      
      this.detectedOperator = await firstValueFrom(
        this.enhancedAirtimeService.autoDetectOperator(phoneNumber, this.selectedCountry.isoName)
      );
      
      if (this.detectedOperator) {
        // Auto-detection successful
        if (this.selectedCountry.isoName === this.GHANA_ISO) {
          // For Ghana: show detected network but don't auto-select (user should choose)
          this.showAutoDetectionStatus(
            `Detected network: ${this.detectedOperator.name}. Please select from available operators.`, 
            'info'
          );
          
          // Highlight the detected operator in the UI if available
          this.highlightDetectedOperator(this.detectedOperator);
        } else {
          // For international: auto-select the detected operator
          this.internetDataForm.patchValue({ operatorId: this.detectedOperator.id });
          this.selectedOperator = this.detectedOperator;
          
          // Show success notification with operator details
          this.notificationService.showSuccess(
            `Network detected: ${this.detectedOperator.name}`
          );
          
          // Load Reloadly bundles for selected country
          await this.loadReloadlyBundlesForCountry(this.selectedCountry.isoName);

          // Update status
          this.showAutoDetectionStatus(`Network detected: ${this.detectedOperator.name}`, 'success');
        }
        
        console.log('Operator auto-detected:', this.detectedOperator);
      }
    } catch (error) {
      console.error('Auto-detection failed:', error);
      
      // Only show warning if the phone number seems complete
      if (this.isPhoneNumberComplete(phoneNumber)) {
        this.notificationService.showWarn(
          'Could not auto-detect network provider. Please ensure the phone number is correct or select manually.'
        );
        
        // Update status
        this.showAutoDetectionStatus('Network detection failed', 'error');
      }
    } finally {
      this.isDetectingOperator = false;
      
      // Clear status after a delay
      setTimeout(() => {
        this.clearAutoDetectionStatus();
      }, 3000);
    }
  }

  /**
   * Checks if the phone number is complete enough for the selected country
   */
  private isPhoneNumberComplete(phoneNumber: string): boolean {
    if (!phoneNumber) return false;
    
    if (this.selectedCountry?.isoName === this.GHANA_ISO) {
      // For Ghana: allow both 9-digit (local) and 10-digit (with 0 prefix) formats
      return phoneNumber.length >= 9;
    } else {
      return phoneNumber.length >= 14;
    }
  }

  /**
   * Shows auto-detection status to the user
   */
  private showAutoDetectionStatus(message: string, type: 'info' | 'success' | 'error' = 'info') {
    // This can be implemented to show status in the UI
    // For now, we'll just log it
    console.log(`Auto-detection status [${type}]:`, message);
  }

  /**
   * Clears auto-detection status
   */
  private clearAutoDetectionStatus() {
    // This can be implemented to clear status from the UI
    console.log('Auto-detection status cleared');
  }

  /**
   * Highlights the detected operator in the UI for Ghana numbers
   */
  private highlightDetectedOperator(detectedOperator: Operator) {
    // Find the detected operator in the available operators list
    const matchingOperator = this.operators.find(op => 
      op.name.toLowerCase() === detectedOperator.name.toLowerCase()
    );
    
    if (matchingOperator) {
      console.log('Highlighting detected operator:', matchingOperator.name);
      // You can implement UI highlighting here if needed
      // For now, we'll just log it
    }
  }

  private async detectOperator(params: {
    phone: string;
    countryIsoCode: string;
  }) {
    try {
      // Use the enhanced airtime service to detect operator
      const result = await firstValueFrom(
        this.enhancedAirtimeService.autoDetectOperator(params.phone, params.countryIsoCode)
      );
      return { operator: result };
    } catch (error) {
      console.error('Error detecting operator:', error);
      return null;
    }
  }

  /**
   * Debug method to help troubleshoot validation issues
   */
  private debugValidationState(): void {
    const phoneControl = this.internetDataForm.get('recipientNumber');
    const phoneNumber = phoneControl?.value;
    const isPhoneValid = phoneControl?.valid || false;
    
    console.log('=== VALIDATION DEBUG ===');
    console.log('Current step:', this.currentStep);
    console.log('Phone number:', phoneNumber);
    console.log('Phone number length:', phoneNumber?.length);
    console.log('Is phone valid (form):', isPhoneValid);
    console.log('Can proceed to next step:', this.canProceed());
    console.log('Form errors:', phoneControl?.errors);
    console.log('Form touched:', phoneControl?.touched);
    console.log('Form dirty:', phoneControl?.dirty);
  }

  /**
   * Comprehensive phone number validation before payment initiation
   * This prevents invalid transactions and ensures proper formatting
   */
  private validatePhoneNumberBeforePayment(phoneNumber: string): boolean {
    if (!phoneNumber) {
      this.notificationService.showError('Phone number is required');
      return false;
    }

    console.log('=== PRE-PAYMENT PHONE VALIDATION ===');
    console.log('Phone number to validate:', phoneNumber);
    console.log('Selected country:', this.selectedCountry?.isoName);

    try {
      if (this.selectedCountry?.isoName === this.GHANA_ISO) {
        // Ghana-specific validation using the phone validation service
        return this.validateGhanaPhoneNumberForPayment(phoneNumber);
      } else {
        // International validation
        return this.validateInternationalPhoneNumberForPayment(phoneNumber);
      }
    } catch (error) {
      console.error('Phone validation error:', error);
      this.notificationService.showError('Phone number validation failed. Please try again.');
      return false;
    }
  }

  /**
   * Ghana phone number validation with network verification
   */
  private validateGhanaPhoneNumberForPayment(phoneNumber: string): boolean {
    // Basic Ghana validation - you can integrate with PhoneValidationService if needed
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    console.log('=== GHANA PHONE VALIDATION ===');
    console.log('Phone number to validate:', phoneNumber);
    console.log('Clean number:', cleanNumber);
    console.log('Clean number length:', cleanNumber.length);
    console.log('Selected operator:', this.selectedOperator?.name);
    
    if (cleanNumber.length < 9 || cleanNumber.length > 10) {
      this.notificationService.showError('Ghana phone number must be 9-10 digits');
      return false;
    }

    // Check if the phone number matches the selected network (if network was manually selected)
    if (this.selectedOperator) {
      const networkMatch = this.doesPhoneNumberMatchNetwork(cleanNumber, this.selectedOperator);
      console.log('Network match check:', networkMatch);
      console.log('Phone number prefix:', cleanNumber.substring(0, 3));
      console.log('Operator supported prefixes:', this.getOperatorPrefixes(this.selectedOperator));
      
      if (!networkMatch) {
        this.notificationService.showError(
          `Phone number ${cleanNumber} does not match the selected network ${this.selectedOperator.name}. ` +
          `Please verify the phone number or select the correct network.`
        );
        return false;
      }
    }

    console.log('Ghana phone validation passed:', cleanNumber);
    return true;
  }

  /**
   * International phone number validation
   */
  private validateInternationalPhoneNumberForPayment(phoneNumber: string): boolean {
    // Basic international validation
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    if (cleanNumber.length < 7 || cleanNumber.length > 15) {
      this.notificationService.showError('International phone number must be 7-15 digits');
      return false;
    }

    // Ensure the number starts with a valid country code
    if (!this.isValidInternationalFormat(phoneNumber)) {
      this.notificationService.showError('Please enter a valid international phone number with country code (e.g., +2348130671234)');
      return false;
    }

    console.log('International phone validation passed:', phoneNumber);
    return true;
  }
  /**
   * Check if phone number matches the selected network
   */
  private doesPhoneNumberMatchNetwork(phoneNumber: string, operator: Operator): boolean {
    if (!phoneNumber || !operator) return false;
    
    // Extract the prefix from the phone number (3 digits including the 0)
    const prefix = phoneNumber.substring(0, 3);
    
    // Check if the prefix matches the operator's supported prefixes
    const supportedPrefixes = this.getOperatorPrefixes(operator);
    
    // Check if the phone number starts with any of the supported prefixes
    return supportedPrefixes.some(supportedPrefix => phoneNumber.startsWith(supportedPrefix));
  }
  /**
   * Get supported prefixes for an operator
   */
  private getOperatorPrefixes(operator: Operator): string[] {
    // CORRECTED Ghana network prefixes (2025) - Based on official provider breakdown
    switch (operator.name?.toLowerCase()) {
      case 'mtn':
      case 'mtn ghana':
        // MTN Ghana: 024, 025, 053, 054, 055, 059
        return ['024', '025', '053', '054', '055', '059'];
      case 'telecel':
      case 'telecel ghana':
      case 'vodafone':
        // Telecel Ghana: 020, 050
        return ['020', '050'];
      case 'airtel':
      case 'airteltigo':
      case 'airteltigo ghana':
      case 'airtel-tigo':
        // AirtelTigo Ghana: 026, 027, 056, 057
        return ['026', '027', '056', '057'];
      case 'glo':
      case 'glo ghana':
      case 'glo mobile':
        // Glo Ghana: Using landline prefixes (no confirmed mobile prefixes)
        // Note: 055 conflict resolved in favor of MTN
        return ['021', '022', '023'];
      default:
        return [];
    }
  }
  /**
   * Validate international phone number format
   */
  private isValidInternationalFormat(phoneNumber: string): boolean {
    // Check if it starts with + and has a reasonable length
    if (!phoneNumber.startsWith('+')) {
      return false;
    }
    // Remove + and check if remaining is numeric and reasonable length
    const numberPart = phoneNumber.substring(1);
    const cleanNumber = numberPart.replace(/\D/g, '');
    
    return cleanNumber.length >= 7 && cleanNumber.length <= 15;
  }
  // Validation
  canProceed(): boolean {
    switch (this.currentStep) {
      case WizardStep.COUNTRY_SELECTION:
        return !!this.selectedCountry;
      case WizardStep.OPERATOR_SELECTION:
        // For non-Ghanaian countries, allow proceeding without operator selection since it will be auto-detected
        if (this.selectedCountry?.isoName !== this.GHANA_ISO) {
          return true;
        }
        return !!this.selectedOperator;
      case WizardStep.PHONE_NUMBER:
        // Check if phone number meets the minimum length requirement for the selected country
        const phoneNumber = this.internetDataForm.get('recipientNumber')?.value;
        const isPhoneValid = this.internetDataForm.get('recipientNumber')?.valid || false;
        return this.isPhoneNumberComplete(phoneNumber) && isPhoneValid;
      case WizardStep.DATA_BUNDLE_SELECTION:
        return !!this.selectedBundle || !!this.selectedReloadlyBundle || this.getReloadlyBundlesForSelected().length === 0;
      case WizardStep.CONFIRMATION:
        return this.internetDataForm.valid;
      default:
        return false;
    }
  }
  // Form submission
  async onSubmit() {
    if (!this.internetDataForm.valid) {
      this.notificationService.showWarn('Please fill all required fields');
      return;
    }

    // Enhanced phone number validation before payment
    const phoneNumber = this.internetDataForm.get('recipientNumber')?.value;
    if (!this.validatePhoneNumberBeforePayment(phoneNumber)) {
      return;
    }

    this.currentStep = WizardStep.PROCESSING;
    this.isProcessing = true;

    try {
      const formData = this.internetDataForm.value;
      
      if (this.selectedCountry?.isoName === this.GHANA_ISO) {
        await this.processGhanaInternetData(formData);
      } else {
        await this.processInternationalInternetData(formData);
      }
    } catch (error) {
      console.error('Error processing internet data purchase:', error);
      this.notificationService.showError('Transaction failed. Please try again.');
      this.currentStep = WizardStep.CONFIRMATION;
    } finally {
      this.isProcessing = false;
    }
  }

  private async processGhanaInternetData(formData: any) {
    try {
      // Extract amount from the selected bundle data
      const bundlePrice = parseFloat(this.selectedBundle?.price || '0');
      
      const params = {
        recipientNumber: this.formatPhoneNumberForGhana(formData.recipientNumber),
        dataCode: this.selectedBundle?.plan_id || '',
        network: this.selectedOperator?.id || '',
        amount: bundlePrice,
        description: `Data Bundle: ${this.selectedBundle?.volume} - ${this.selectedBundle?.validity}`,
        transType: 'DATABUNDLELIST',
        payTransRef: await this.utilService.generateReference()
      };

      this.internetDataParams = params;

      // Process payment through AdvansisPay
      const paymentResult = await firstValueFrom(
        this.advansisPayService.expressPayOnline({
          userId: this.userProfile._id,
          firstName: this.userProfile.firstName || '',
          lastName: this.userProfile.lastName || '',
          email: this.userProfile.email || '',
          phoneNumber: params.recipientNumber,
          username: this.userProfile.username || '',
          amount: params.amount,
          orderDesc: params.description,
          orderImgUrl: 'https://gravatar.com/dinosaursuperb49b1159b93'
        })
      );

      if (paymentResult && paymentResult.status === 201 && paymentResult.data?.checkoutUrl) {
        // Store transaction details
        await this.storage.setStorage('pendingTransaction', JSON.stringify({
          ...params,
          timestamp: new Date().toISOString()
        }));

        // Open payment gateway
        await this.browserService.openInAppBrowser(paymentResult.data.checkoutUrl);
        this.notificationService.showSuccess('Payment initiated successfully!');
        this.resetForm();
        this.currentStep = WizardStep.COUNTRY_SELECTION;
      } else {
        throw new Error('Failed to initiate payment');
      }
    } catch (error) {
      console.error('Error processing Ghana internet data:', error);
      throw error;
    }
  }

  private async processInternationalInternetData(formData: any) {
    try {
      // Prefer flattened Reloadly bundle selection
      const selected = this.selectedReloadlyBundle || this.reloadlyBundles.find(b => b.operatorId === (this.selectedOperator?.id || formData.operatorId));
      const amount = selected ? (selected.amount || (selected.localAmount ?? 0)) : 0;
      const description = selected ? `${selected.operatorName} - ${selected.description}` : 'International Data Bundle';

      const params = {
        recipientNumber: this.enhancedAirtimeService.formatPhoneNumberForAPI(
          formData.recipientNumber,
          formData.countryIso
        ),
        operatorId: this.selectedOperator?.id || formData.operatorId,
        amount,
        description,
        recipientEmail: this.userProfile.email || '',
        recipientCountryCode: formData.countryIso,
        senderNumber: this.userProfile.phoneNumber || '',
        payTransRef: await this.utilService.generateReference(),
        transType: 'INTERNATIONALDATA',
        customerEmail: this.userProfile.email || '',
      } as any;

      this.internetDataParams = params;

      // Process payment through AdvansisPay
      const paymentResult = await firstValueFrom(
        this.advansisPayService.expressPayOnline({
          userId: this.userProfile._id,
          firstName: this.userProfile.firstName || '',
          lastName: this.userProfile.lastName || '',
          email: this.userProfile.email || '',
          phoneNumber: params.recipientNumber,
          username: this.userProfile.username || '',
          amount: params.amount,
          orderDesc: params.description,
          orderImgUrl: 'https://gravatar.com/dinosaursuperb49b1159b93'
        })
      );

      if (paymentResult && paymentResult.status === 201 && paymentResult.data?.checkoutUrl) {
        // Store transaction details
        await this.storage.setStorage('pendingTransaction', JSON.stringify({
          ...params,
          timestamp: new Date().toISOString()
        }));

        // Open payment gateway
        await this.browserService.openInAppBrowser(paymentResult.data.checkoutUrl);
        this.notificationService.showSuccess('Payment initiated successfully!');
        this.resetForm();
        this.currentStep = WizardStep.COUNTRY_SELECTION;
      } else {
        throw new Error('Failed to initiate payment');
      }
    } catch (error) {
      console.error('Error processing international internet data:', error);
      throw error;
    }
  }
  // Utility methods
  private resetForm() {
    this.internetDataForm.reset();
    this.selectedCountry = null;
    this.selectedOperator = null;
    this.detectedOperator = null;
    this.selectedBundle = null;
    this.operators = [];
    this.dataBundles = [];
  }

  // Search functionality
  filterCountries(event: any) {
    const raw = (event?.target?.value ?? '').toString();
    const query = raw.trim().replace(/\s+/g, ' ').toLowerCase();
    if (query) {
      this.filteredCountries = this.countries.filter(country => 
        country.name.toLowerCase().includes(query) || 
        country.isoName.toLowerCase().includes(query)
      );
    } else {
      this.filteredCountries = this.countries;
    }
  }

  // Step progress calculation
  getStepProgress(): number {
    // For non-Ghanaian countries, adjust progress calculation since we skip operator selection
    if (this.selectedCountry?.isoName !== this.GHANA_ISO) {
      const totalSteps = 5; // Skip operator selection for international
      return ((this.currentStep + 1) / totalSteps) * 100;
    }
    return ((this.currentStep + 1) / 6) * 100;
  }

  // Formatted phone number for display
  getFormattedPhoneNumber(): string {
    const phoneNumber = this.internetDataForm.get('recipientNumber')?.value;
    if (!phoneNumber) return '';
    
    if (this.selectedCountry?.isoName === this.GHANA_ISO) {
      return this.formatPhoneNumberForDisplay(phoneNumber);
    }
    return phoneNumber;
  }

  private formatPhoneNumberForDisplay(phoneNumber: string): string {
    // Format for display purposes
    let cleanNumber = phoneNumber.replace(/\D/g, '');
    
    if (cleanNumber.length === 10 && cleanNumber.startsWith('0')) {
      return cleanNumber;
    } else if (cleanNumber.length === 12 && cleanNumber.startsWith('233')) {
      return '0' + cleanNumber.slice(3);
    }
    
    return phoneNumber;
  }

  getStepTitle(step: WizardStep): string {
    switch (step) {
      case WizardStep.COUNTRY_SELECTION:
        return 'Select Country';
      case WizardStep.OPERATOR_SELECTION:
        return 'Select Network';
      case WizardStep.PHONE_NUMBER:
        return 'Enter Phone Number';
      case WizardStep.DATA_BUNDLE_SELECTION:
        return 'Choose Data Bundle';
      case WizardStep.CONFIRMATION:
        return 'Confirm Purchase';
      case WizardStep.PROCESSING:
        return 'Processing...';
      default:
        return '';
    }
  }

  getStepDescription(step: WizardStep): string {
    switch (step) {
      case WizardStep.COUNTRY_SELECTION:
        return 'Choose the country for your data bundle';
      case WizardStep.OPERATOR_SELECTION:
        return 'Select your mobile network provider';
      case WizardStep.PHONE_NUMBER:
        return 'Enter the phone number for the data bundle. Your phone number is pre-filled for convenience.';
      case WizardStep.DATA_BUNDLE_SELECTION:
        return 'Choose the data plan that suits your needs';
      case WizardStep.CONFIRMATION:
        return 'Review your selection before proceeding';
      case WizardStep.PROCESSING:
        return 'Please wait while we process your request';
      default:
        return '';
    }
  }

  /**
   * Gets the expected phone number length message for the selected country
   */
  getExpectedPhoneNumberLength(): string {
    if (this.selectedCountry?.isoName === this.GHANA_ISO) {
      return 'Enter 10-digit phone number (e.g., 0240000000)';
    } else {
      return 'Enter complete international number with country code (e.g., +2348130671234)';
    }
  }

  // Helper method to format bundle price for display
  formatBundlePrice(price: string): string {
    const numPrice = parseFloat(price);
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2
    }).format(numPrice);
  }

  // Summary stage helper methods
  getSelectedBundleDescription(): string {
    if (this.selectedBundle) {
      // Ghana One4All bundle
      return `${this.selectedBundle.plan_name || this.selectedBundle.volume} (${this.selectedBundle.volume})`;
    } else if (this.selectedReloadlyBundle) {
      // International Reloadly bundle
      return this.selectedReloadlyBundle.description;
    }
    return 'No bundle selected';
  }

  getSelectedBundleValidity(): string {
    if (this.selectedBundle) {
      // Ghana One4All bundle
      return this.selectedBundle.validity || 'N/A';
    } else if (this.selectedReloadlyBundle) {
      // International Reloadly bundle - extract validity from description
      const description = this.selectedReloadlyBundle.description;
      const validityMatch = description.match(/validity\s+(\d+\s*(?:hours?|days?|weeks?|months?))/i);
      return validityMatch ? validityMatch[1] : 'N/A';
    }
    return 'N/A';
  }

  getSelectedBundlePrice(): string {
    if (this.selectedBundle) {
      // Ghana One4All bundle
      return `GH₵${this.selectedBundle.price}`;
    } else if (this.selectedReloadlyBundle) {
      // International Reloadly bundle
      const amount = this.selectedReloadlyBundle.localAmount ?? this.selectedReloadlyBundle.amount;
      const currency = this.selectedReloadlyBundle.localCurrency ?? this.selectedReloadlyBundle.currency;
      
      // Format the amount based on currency
      if (currency === 'NGN') {
        return `₦${amount.toFixed(2)}`;
      } else if (currency === 'USD') {
        return `$${amount.toFixed(2)}`;
      } else {
        return `${currency} ${amount.toFixed(2)}`;
      }
    }
    return 'N/A';
  }
}