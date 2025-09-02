import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { firstValueFrom, Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonBackButton,
  IonButtons,
  IonItem,
  IonButton,
  IonIcon,
  IonInput,
  IonLabel,
  IonNote,
  IonChip,
  IonSpinner,
  IonSkeletonText,
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { EnhancedAirtimeService, Country, Operator } from 'src/app/services/enhanced-airtime.service';
import { NotificationService } from 'src/app/services/notification.service';
import { PhoneValidationService } from 'src/app/services/utils/phone-validation.service';
import { AdvansisPayService } from '../../services/payments/advansis-pay.service';
import { StorageService } from '../../services/storage.service';
import { UtilsService } from '../../services/utils.service';
import { ReloadlyService } from '../../services/reloadly/reloadly.service';
import { Profile } from '../../interfaces/profile.interface';
import { WaitingModalComponent } from '../../components/waiting-modal/waiting-modal.component';
import { AccountService } from '../../services/auth/account.service';
import { StateService } from '../../services/state.service';
import { addIcons } from 'ionicons';
import {
  arrowBack,
  arrowForward,
  close,
  cellularOutline,
  globeOutline,
  locationOutline,
  cardOutline,
  timeOutline,
  informationCircleOutline,
  chevronForward,
  chevronBack, 
  callOutline, 
  checkmarkCircle, 
  alertCircleOutline, 
  refreshOutline, 
  searchOutline, 
  closeCircle, bugOutline } from 'ionicons/icons';

// Interfaces for better type safety
interface AirtimeFormData {
  countryIso: string;
  operatorId: string | number;
  recipientNumber: string;
  amount: number;
  autoDetect: boolean;
}

interface PaymentParams {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  username: string;
  amount: number;
  orderDesc: string;
  orderImgUrl: string;
}

interface TopupParams {
  recipientNumber: string;
  description: string;
  amount: number;
  network: string | number;
  payTransRef: string;
  transType: string;
  customerEmail: string;
  operatorId?: number;
  recipientEmail?: string;
  recipientCountryCode?: string;
  senderNumber?: string;
}

interface ModalResult {
  modal: HTMLIonModalElement;
  updateStatus: (message: string) => void;
}

enum PurchaseStep {
  COUNTRY_SELECTION = 0,
  NETWORK_SELECTION = 1,
  RECIPIENT_NUMBER = 2,
  AMOUNT_SELECTION = 3,
  TRANSACTION_SUMMARY = 4,
  PROCESSING = 5
}

@Component({
  selector: 'app-enhanced-airtime-purchase',
  templateUrl: './enhanced-airtime-purchase.page.html',
  styleUrls: ['./enhanced-airtime-purchase.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonBackButton,
    IonButtons,
    IonItem,
    IonButton,
    IonIcon,
    IonInput,
    IonLabel,
    IonNote,
    IonChip,
    IonSpinner,
    IonSkeletonText,
  ],
})
export class EnhancedAirtimePurchasePage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Step management
  currentStep = PurchaseStep.COUNTRY_SELECTION;
  PurchaseStep = PurchaseStep;
  
  // Form
  airtimeForm!: FormGroup;
  
  // Data
  countries: Country[] = [];
  filteredCountries: Country[] = [];
  operators: Operator[] = [];
  selectedCountry: Country | null = null;
  selectedOperator: Operator | null = null;
  detectedOperator: Operator | null = null;
  isDetectingOperator = false;
  userProfile: Profile = {} as Profile;
  
  // Search
  searchTerm: string = '';
  
  // Amount selection
  quickAmounts = [1, 5, 10, 20, 50, 100, 200];
  selectedAmount: number | null = null;
  
  // Loading states
  isLoading = false;
  isLoadingCountries = false;
  isLoadingOperators = false;
  isProcessing = false;
  
  // UI state
    showCustomAmount = false;
  private readonly GHANA_ISO = 'GH';

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private enhancedAirtimeService: EnhancedAirtimeService,
    private notificationService: NotificationService,
    private translate: TranslateService,
    private advansisPayService: AdvansisPayService,
    private storage: StorageService,
    private utilService: UtilsService,
    private reloadlyService: ReloadlyService,
    private phoneValidationService: PhoneValidationService,
    private accountService: AccountService,
    private stateService: StateService
  ) {
    addIcons({globeOutline,searchOutline,closeCircle,checkmarkCircle,alertCircleOutline,refreshOutline,cellularOutline,callOutline,bugOutline,cardOutline,informationCircleOutline,chevronBack,chevronForward,arrowBack,arrowForward,close,locationOutline,timeOutline});
    
    this.initializeForm();
  }

  async ngOnInit() {
    console.log('=== NGONINIT CALLED ===');
    console.log('Current step:', this.currentStep);
    
    await this.loadUserProfile();
    this.logProfileStatus();
    this.loadCountries();
    this.setupFormListeners();
    
    // Set default country for initial validation
    this.selectedCountry = { isoName: 'GH', name: 'Ghana', currencyCode: 'GHS', currencyName: 'Ghanaian Cedi' } as Country;
    
    // Set initial validation for default country (GH)
    this.updatePhoneNumberValidation();
    
    // Ensure form is properly initialized
    setTimeout(() => {
      this.debugValidationState();
    }, 100);
    
    // Watch for step changes to populate phone number when reaching step 3
    this.watchStepChanges();
    
    console.log('=== END NGONINIT ===');
  }

  ionViewWillEnter() {
    console.log('=== ION VIEW WILL ENTER ===');
    console.log('Current step:', this.currentStep);
    
    // If we're on the recipient number step, try to populate
    if (this.currentStep === PurchaseStep.RECIPIENT_NUMBER) {
      console.log('On phone step, triggering population...');
      setTimeout(() => {
        this.prefillPhoneFromStorageIfAvailable();
      }, 300);
    }
    console.log('=== END ION VIEW WILL ENTER ===');
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm() {
    this.airtimeForm = this.formBuilder.group({
      countryIso: ['GH', Validators.required],
      operatorId: ['', Validators.required],
      recipientNumber: ['', [Validators.required, Validators.minLength(10)]],
      amount: ['', [Validators.required, Validators.min(1)]],
      autoDetect: [true]
    });
  }

  /**
   * Updates phone number validation based on selected country
   */
  private updatePhoneNumberValidation() {
    const recipientNumberControl = this.airtimeForm.get('recipientNumber');
    if (recipientNumberControl) {
      // Clear existing validators
      recipientNumberControl.clearValidators();
      
      // Add appropriate validators based on country
      if (this.selectedCountry?.isoName === this.GHANA_ISO) {
        // Ghana: minimum 10 digits (local format) - allow both 9 and 10 digit formats
        recipientNumberControl.addValidators([Validators.required, Validators.minLength(9)]);
      } else {
        // International: minimum 14-15 digits (with country code)
        recipientNumberControl.addValidators([Validators.required, Validators.minLength(14)]);
      }
      
      // Trigger validation
      recipientNumberControl.updateValueAndValidity();
    }
  }

  private async loadUserProfile() {
    console.log('=== LOADING USER PROFILE ===');
    console.log('Current step when loading profile:', this.currentStep);
    
    try {
      console.log('Attempting to load profile from AccountService...');
      const response = await firstValueFrom(this.accountService.getProfile());
      
      if (response) {
        console.log('Profile loaded from AccountService successfully');
        console.log('Profile phone number:', response.phoneNumber);
        
        this.userProfile = response;
        
        // If we're on the recipient number step and have a phone number, populate it
        if (this.currentStep === PurchaseStep.RECIPIENT_NUMBER && response.phoneNumber) {
          console.log('Profile loaded and on phone step, triggering population...');
          setTimeout(() => {
            this.populateUserPhoneNumber();
          }, 100);
        }
        
        return;
      }
    } catch (accountError) {
      console.log('AccountService failed, trying StateService...');
    }

    // Fallback to StateService
    console.log('Attempting to load profile from StateService...');
    const currentState = this.stateService.getCurrentState();
    
    if (currentState?.profile) {
      this.userProfile = currentState.profile;
      console.log('Profile loaded from StateService successfully');
      console.log('Profile phone number:', this.userProfile.phoneNumber);
      
      // If we're on the recipient number step and have a phone number, populate it
      if (this.currentStep === PurchaseStep.RECIPIENT_NUMBER && this.userProfile.phoneNumber) {
        console.log('Profile loaded from StateService and on phone step, triggering population...');
        setTimeout(() => {
          this.populateUserPhoneNumber();
        }, 100);
      }
    } else {
      console.error('No profile available from either service');
      
      // Try storage as final fallback
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
        
        // If we're on the recipient number step and have a phone number, populate it
        if (this.currentStep === PurchaseStep.RECIPIENT_NUMBER && storedProfile.phoneNumber) {
          console.log('Profile loaded from storage and on phone step, triggering population...');
          console.log('Setting timeout for 100ms...');
          setTimeout(() => {
            console.log('Timeout fired, calling populateUserPhoneNumber...');
            this.populateUserPhoneNumber();
          }, 100);
        } else {
          console.log('Not triggering population from storage - reasons:');
          console.log('  - Current step:', this.currentStep);
          console.log('  - Phone step?', this.currentStep === PurchaseStep.RECIPIENT_NUMBER);
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
    this.airtimeForm.patchValue({ recipientNumber: formattedNumber });
    
    // Verify the form was updated
    const formValueAfterPatch = this.airtimeForm.get('recipientNumber')?.value;
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
    console.log('Current form recipientNumber value:', this.airtimeForm.get('recipientNumber')?.value);
    
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
      const currentFormValue = this.airtimeForm.get('recipientNumber')?.value;
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

  private isProfileValid(): boolean {
    return !!(this.userProfile && 
      this.userProfile._id && 
      this.userProfile.firstName && 
      this.userProfile.lastName && 
      this.userProfile.email);
  }

  private logProfileStatus() {
    console.log('=== PROFILE STATUS ===');
    console.log('Profile object:', this.userProfile);
    console.log('Profile valid:', this.isProfileValid());
    if (this.userProfile) {
      console.log('Profile fields:', {
        _id: this.userProfile._id,
        firstName: this.userProfile.firstName,
        lastName: this.userProfile.lastName,
        email: this.userProfile.email,
        username: this.userProfile.username
      });
    }
    console.log('=====================');
  }

  private setupFormListeners() {
    // Listen to phone number changes for auto-detection with debouncing
    this.airtimeForm.get('recipientNumber')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(1000), // Wait 1 second after user stops typing
        distinctUntilChanged() // Only trigger if value actually changed
      )
      .subscribe(phoneNumber => {
        if (phoneNumber && this.airtimeForm.get('autoDetect')?.value) {
          // Only auto-detect for international numbers (non-Ghana) and when phone number is complete
          if (this.selectedCountry && this.selectedCountry.isoName !== this.GHANA_ISO) {
            // For international numbers, wait until the number is complete (14-15 digits)
            if (this.isPhoneNumberComplete(phoneNumber)) {
              this.autoDetectOperator(phoneNumber);
            } else if (!this.isPhoneNumberComplete(phoneNumber) && this.detectedOperator) {
              // Clear detected operator if phone number becomes too short
              this.detectedOperator = null;
              this.selectedOperator = null;
              this.airtimeForm.patchValue({ operatorId: '' });
              this.clearAutoDetectionStatus();
            }
          }
        }
      });
  }

  async loadCountries() {
    this.isLoadingCountries = true;
    try {
      // Add a minimum loading time to show the loading state properly
      const loadingPromise = new Promise(resolve => setTimeout(resolve, 800));
      const countriesPromise = firstValueFrom(this.enhancedAirtimeService.getCountries());
      
      // Wait for both the minimum loading time and the actual data
      const [countries] = await Promise.all([countriesPromise, loadingPromise]);
      
      this.countries = countries;
      // Countries loaded successfully
      if (this.countries.length > 0) {
        // Don't auto-select any country, let user choose
        this.filteredCountries = [...this.countries];
      }
    } catch (error) {
      console.error('Error loading countries:', error);
      this.notificationService.showError('Failed to load countries');
    } finally {
      this.isLoadingCountries = false;
    }
  }

  filterCountries() {
    if (!this.searchTerm.trim()) {
      this.filteredCountries = [...this.countries];
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredCountries = this.countries.filter(country =>
        country.name.toLowerCase().includes(searchLower) ||
        country.currencyCode.toLowerCase().includes(searchLower) ||
        country.currencyName.toLowerCase().includes(searchLower) ||
        country.isoName.toLowerCase().includes(searchLower)
      );
    }
  }

  clearSearch() {
    this.searchTerm = '';
    this.filteredCountries = [...this.countries];
  }

  async onCountryChange(countryIso: string) {
    console.log('=== COUNTRY SELECTION ===');
    console.log('Selected country ISO:', countryIso);
    
    this.selectedCountry = this.countries.find(c => c.isoName === countryIso) || null;
    console.log('Selected country:', this.selectedCountry);
    console.log('Is Ghana?', countryIso === this.GHANA_ISO);
    
    // Update form value
    this.airtimeForm.patchValue({ countryIso: countryIso });
    
    // Update phone number validation based on selected country
    this.updatePhoneNumberValidation();
    
    // Clear any previous operator selection
    this.selectedOperator = null;
    this.detectedOperator = null;
    this.airtimeForm.patchValue({ operatorId: '' });
    
    // Load operators only for Ghana
    if (this.selectedCountry && countryIso === this.GHANA_ISO) {
      console.log('Loading Ghana operators...');
      await this.loadOperators(countryIso);
    } else {
      // For non-Ghanaian countries, clear operators array
      console.log('Clearing operators for international country');
      this.operators = [];
    }
    
    console.log('=== END COUNTRY SELECTION ===');
  }

  // Watch for step changes to trigger phone number population
  private watchStepChanges() {
    console.log('=== WATCH STEP CHANGES CALLED ===');
    console.log('Current step:', this.currentStep);
    
    // Check if we're already on step 3 and populate if needed
    if (this.currentStep === PurchaseStep.RECIPIENT_NUMBER) {
      console.log('Already on recipient number step, triggering population...');
      setTimeout(() => {
        this.prefillPhoneFromStorageIfAvailable();
      }, 500);
    }
    console.log('=== END WATCH STEP CHANGES ===');
  }

  async loadOperators(countryIso: string) {
    // For non-Ghanaian countries, skip operator loading since we'll use auto-detection
    if (countryIso !== this.GHANA_ISO) {
      this.operators = [];
      this.selectedOperator = null;
      this.airtimeForm.patchValue({ operatorId: '' });
      return;
    }

    this.isLoadingOperators = true;
    try {
      this.operators = await firstValueFrom(this.enhancedAirtimeService.getOperators(countryIso));
    } catch (error) {
      console.error('Error loading operators:', error);
      this.notificationService.showError('Failed to load network providers');
    } finally {
      this.isLoadingOperators = false;
    }
  }

    async autoDetectOperator(phoneNumber: string) {
    if (!phoneNumber || !this.selectedCountry) return;
    
    // Only auto-detect for international numbers (non-Ghana)
    if (this.selectedCountry.isoName === this.GHANA_ISO) {
      return;
    }
    
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
        this.airtimeForm.patchValue({ operatorId: this.detectedOperator.id });
        this.selectedOperator = this.detectedOperator;
        
        // Show success notification with operator details
        this.notificationService.showSuccess(
          `Network detected: ${this.detectedOperator.name}`
        );
        
        // Update status
        this.showAutoDetectionStatus(`Network detected: ${this.detectedOperator.name}`, 'success');
        
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
   * Gets the expected phone number length message for the selected country
   */
  getExpectedPhoneNumberLength(): string {
    if (this.selectedCountry?.isoName === this.GHANA_ISO) {
      return 'Enter 10-digit phone number (e.g., 0240000000)';
    } else {
      return 'Enter complete international number with country code (e.g., +2348130671234)';
    }
  }

  /**
   * Checks if the phone number is complete enough for the selected country
   */
  isPhoneNumberComplete(phoneNumber: string): boolean {
    if (!phoneNumber) return false;
    
    if (this.selectedCountry?.isoName === this.GHANA_ISO) {
      // For Ghana: allow both 9-digit (local) and 10-digit (with 0 prefix) formats
      return phoneNumber.length >= 9;
    } else {
      return phoneNumber.length >= 14;
    }
  }

  onOperatorSelect(operator: Operator) {
    this.selectedOperator = operator;
    this.airtimeForm.patchValue({ operatorId: operator.id });
  }

  onPhoneNumberInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const phoneNumber = target?.value || '';
    
    console.log('=== PHONE NUMBER INPUT ===');
    console.log('Raw input:', phoneNumber);
    console.log('Selected country:', this.selectedCountry?.isoName);
    console.log('Is Ghana?', this.selectedCountry?.isoName === this.GHANA_ISO);
    
    // Clear previously detected operator when user starts typing again
    if (this.detectedOperator && !this.isPhoneNumberComplete(phoneNumber)) {
      this.detectedOperator = null;
      this.selectedOperator = null;
      this.airtimeForm.patchValue({ operatorId: '' });
      this.clearAutoDetectionStatus();
    }
    
    if (this.selectedCountry) {
      // For Ghana, use formatPhoneNumberForAPI to ensure local format without country code prefix
      // For other countries, use formatPhoneNumber for display formatting
      let formatted: string;
      if (this.selectedCountry.isoName === this.GHANA_ISO) {
        formatted = this.enhancedAirtimeService.formatPhoneNumberForAPI(phoneNumber, this.selectedCountry.isoName);
        console.log('Ghana formatting result:', phoneNumber, '->', formatted);
      } else {
        formatted = this.enhancedAirtimeService.formatPhoneNumber(phoneNumber, this.selectedCountry.isoName);
        console.log('International formatting result:', phoneNumber, '->', formatted);
      }
      
      this.airtimeForm.patchValue({ recipientNumber: formatted });
      
      // Trigger validation and debug
      this.airtimeForm.get('recipientNumber')?.updateValueAndValidity();
      this.debugValidationState();
      
      // Auto-detection is now handled by the debounced form listener
      // This provides a better user experience by waiting for the user to finish typing
    }
  }

  selectAmount(amount: number) {
    console.log('=== AMOUNT SELECTION ===');
    console.log('Selected amount:', amount);
    console.log('Currency:', this.selectedCountry?.currencyCode);
    
    this.selectedAmount = amount;
    this.airtimeForm.patchValue({ amount: amount });
    this.showCustomAmount = false;
    
    console.log('Form amount updated to:', amount);
  }

  showCustomAmountInput() {
    this.showCustomAmount = true;
    this.selectedAmount = null;
    this.airtimeForm.patchValue({ amount: '' });
  }

  // Step navigation
  nextStep() {
    console.log('=== NEXT STEP CALLED ===');
    console.log('Current step before increment:', this.currentStep);
    
    if (this.canProceedToNextStep()) {
      this.currentStep++;
      console.log('Step incremented to:', this.currentStep);
      
      // For non-Ghanaian countries, skip network selection step
      if (this.currentStep === PurchaseStep.NETWORK_SELECTION && 
          this.selectedCountry?.isoName !== this.GHANA_ISO) {
        console.log('Skipping network selection for international country, jumping to phone step');
        this.currentStep = PurchaseStep.RECIPIENT_NUMBER;
        console.log('Now on step:', this.currentStep);
      }
      
      // When reaching recipient number step, trigger phone number population
      if (this.currentStep === PurchaseStep.RECIPIENT_NUMBER) {
        console.log('Reached recipient number step, triggering population...');
        setTimeout(() => {
          this.prefillPhoneFromStorageIfAvailable();
        }, 100);
      }
    } else {
      console.log('Cannot proceed to next step - validation failed');
    }
    console.log('=== END NEXT STEP ===');
  }

  previousStep() {
    console.log('=== PREVIOUS STEP CALLED ===');
    console.log('Current step before decrement:', this.currentStep);
    
    if (this.currentStep > 0) {
      this.currentStep--;
      console.log('Step decremented to:', this.currentStep);
      
      // For non-Ghanaian countries, skip network selection step when going back
      if (this.currentStep === PurchaseStep.NETWORK_SELECTION && 
          this.selectedCountry?.isoName !== this.GHANA_ISO) {
        console.log('Skipping network selection when going back, jumping to country step');
        this.currentStep = PurchaseStep.COUNTRY_SELECTION;
        console.log('Now on step:', this.currentStep);
      }
    } else {
      console.log('Already at first step, cannot decrement');
    }
    console.log('=== END PREVIOUS STEP ===');
  }

  goToStep(step: PurchaseStep) {
    console.log('=== GO TO STEP CALLED ===');
    console.log('Requested step:', step);
    console.log('Current step:', this.currentStep);
    
    if (step <= this.currentStep) {
      console.log('Going to step:', step);
      this.currentStep = step;
      
      // When reaching recipient number step via goToStep, also populate
      if (this.currentStep === PurchaseStep.RECIPIENT_NUMBER) {
        console.log('Reached recipient number step, triggering population...');
        setTimeout(() => {
          this.prefillPhoneFromStorageIfAvailable();
        }, 100);
      }
    } else {
      console.log('Cannot go to step, it\'s beyond current step');
    }
    console.log('=== END GO TO STEP ===');
  }

  /**
   * Debug method to help troubleshoot validation issues
   */
  debugValidationState(): void {
    const phoneControl = this.airtimeForm.get('recipientNumber');
    const phoneNumber = phoneControl?.value;
    const isPhoneValid = phoneControl?.valid || false;
    const isPhoneComplete = this.isPhoneNumberComplete(phoneNumber);
    
    console.log('=== VALIDATION DEBUG ===');
    console.log('Current step:', this.currentStep);
    console.log('Phone number:', phoneNumber);
    console.log('Phone number length:', phoneNumber?.length);
    console.log('Is phone valid (form):', isPhoneValid);
    console.log('Is phone complete (custom):', isPhoneComplete);
    console.log('Can proceed to next step:', this.canProceedToNextStep());
    console.log('Form errors:', phoneControl?.errors);
    console.log('Form touched:', phoneControl?.touched);
    console.log('Form dirty:', phoneControl?.dirty);
  }

  canProceedToNextStep(): boolean {
    switch (this.currentStep) {
      case PurchaseStep.COUNTRY_SELECTION:
        return !!this.selectedCountry;
      case PurchaseStep.NETWORK_SELECTION:
        // For non-Ghanaian countries, allow proceeding without operator selection since it will be auto-detected
        if (this.selectedCountry?.isoName !== this.GHANA_ISO) {
          return true;
        }
        return !!this.selectedOperator;
      case PurchaseStep.RECIPIENT_NUMBER:
        // Check if phone number meets the minimum length requirement for the selected country
        const phoneNumber = this.airtimeForm.get('recipientNumber')?.value;
        const isPhoneValid = this.airtimeForm.get('recipientNumber')?.valid || false;
        return this.isPhoneNumberComplete(phoneNumber) && isPhoneValid;
      case PurchaseStep.AMOUNT_SELECTION:
        return this.airtimeForm.get('amount')?.valid || false;
      default:
        return true;
    }
  }

  getStepProgress(): number {
    // For non-Ghanaian countries, adjust progress calculation since we skip network selection
    if (this.selectedCountry?.isoName !== this.GHANA_ISO) {
      const totalSteps = Object.keys(PurchaseStep).length / 2 - 1; // Subtract 1 for skipped step
      return ((this.currentStep + 1) / totalSteps) * 100;
    }
    return ((this.currentStep + 1) / (Object.keys(PurchaseStep).length / 2)) * 100;
  }

  getStepTitle(): string {
    switch (this.currentStep) {
      case PurchaseStep.COUNTRY_SELECTION:
        return 'Select Country';
      case PurchaseStep.NETWORK_SELECTION:
        return 'Choose Network';
      case PurchaseStep.RECIPIENT_NUMBER:
        return 'Enter Phone Number';
      case PurchaseStep.AMOUNT_SELECTION:
        return 'Select Amount';
      case PurchaseStep.TRANSACTION_SUMMARY:
        return 'Confirm Purchase';
      case PurchaseStep.PROCESSING:
        return 'Processing...';
      default:
        return '';
    }
  }

  getStepDescription(): string {
    switch (this.currentStep) {
      case PurchaseStep.COUNTRY_SELECTION:
        return 'Choose the country for your airtime purchase';
      case PurchaseStep.NETWORK_SELECTION:
        return 'Select the mobile network provider';
      case PurchaseStep.RECIPIENT_NUMBER:
        return 'Enter the phone number to top up';
      case PurchaseStep.AMOUNT_SELECTION:
        return 'Choose the amount to purchase';
      case PurchaseStep.TRANSACTION_SUMMARY:
        return 'Review and confirm your purchase';
      case PurchaseStep.PROCESSING:
        return 'Please wait while we process your request';
      default:
        return '';
    }
  }

  async confirmPurchase() {
    console.log('=== CONFIRM PURCHASE ===');
    console.log('Form valid:', this.airtimeForm.valid);
    
    if (!this.airtimeForm.valid) {
      this.notificationService.showError('Please fill in all required fields');
      return;
    }

    const formValue = this.airtimeForm.value;
    
    console.log('=== SUBMISSION SUMMARY ===');
    console.log('Country ISO:', formValue.countryIso);
    console.log('Is Ghana?', formValue.countryIso === this.GHANA_ISO);
    console.log('Phone Number:', formValue.recipientNumber);
    console.log('Amount:', formValue.amount);
    console.log('Operator ID:', formValue.operatorId);
    console.log('Selected Operator:', this.selectedOperator?.name);
    console.log('Detected Operator:', this.detectedOperator?.name);
    
    // Enhanced phone number validation before payment
    if (!this.validatePhoneNumberBeforePayment(formValue.recipientNumber)) {
      return;
    }
    
    // For non-Ghanaian countries, ensure we have a detected operator
    if (this.selectedCountry?.isoName !== this.GHANA_ISO && !this.detectedOperator) {
      this.notificationService.showError('Please ensure the phone number is correct for network detection');
      return;
    }

    this.currentStep = PurchaseStep.PROCESSING;
    this.isProcessing = true;

    try {
      // Use the proper payment flow based on country
      if (this.selectedCountry?.isoName === this.GHANA_ISO) {
        console.log('Processing Ghana airtime...');
        await this.processGhanaAirtime(formValue);
      } else {
        console.log('Processing international airtime...');
        await this.processInternationalAirtime(formValue);
      }
    } catch (error) {
      this.notificationService.showError('Purchase failed. Please try again.');
      this.currentStep = PurchaseStep.TRANSACTION_SUMMARY;
    } finally {
      this.isProcessing = false;
    }
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
    // Use the phone validation service
    const validation = this.phoneValidationService.validateGhanaPhoneNumberForPayment(phoneNumber);
    
    if (!validation.isValid) {
      this.notificationService.showError(validation.error || 'Invalid Ghana phone number format');
      return false;
    }

    // Check if the phone number matches the selected network (if network was manually selected)
    if (this.selectedOperator && !this.doesPhoneNumberMatchNetwork(validation.sanitized, this.selectedOperator)) {
      this.notificationService.showError(
        `Phone number ${validation.sanitized} does not match the selected network ${this.selectedOperator.name}. ` +
        `Please verify the phone number or select the correct network.`
      );
      return false;
    }

    // Show warning if sanitization was needed
    if (validation.warning) {
      console.log('Phone validation warning:', validation.warning);
      // Optionally show this warning to the user
    }

    console.log('Ghana phone validation passed:', validation);
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
    
    // Extract the prefix from the phone number
    const prefix = phoneNumber.substring(0, 3);
    
    // Check if the prefix matches the operator's supported prefixes
    // This is a simplified check - you might want to enhance this based on your operator data
    const supportedPrefixes = this.getOperatorPrefixes(operator);
    
    return supportedPrefixes.some(prefix => phoneNumber.startsWith(prefix));
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

  getOperatorImage(operator: Operator): string {
    // Use the operator's logo property directly since it's already correctly set in the service
    return operator.logo || 'assets/imgs/operators/mtn.png';
  }

  private async presentWaitingModal(): Promise<ModalResult> {
    // For now, just log the modal creation since modalController is not available
    console.log('Modal would be presented here');
    
    const updateStatus = (message: string) => {
      console.log('Modal status update:', message);
    };
    
    // Return a mock modal result with a safe dismiss method
    return { 
      modal: {
        dismiss: async () => {
          console.log('Mock modal dismissed');
          return Promise.resolve();
        }
      } as any, 
      updateStatus 
    };
  }

  private formatAmount(amount: number): number {
    return Number(amount.toFixed(2));
  }

  private async processGhanaAirtime(formData: AirtimeFormData) {
    console.log('=== PROCESS GHANA AIRTIME ===');
    console.log('Form data received:', formData);
    
    // Log profile status before processing
    this.logProfileStatus();
    
    // Check if profile is valid before proceeding
    if (!this.isProfileValid()) {
      this.notificationService.showError('User profile is incomplete. Please update your profile information.');
      return;
    }
    
    const modalResult = await this.presentWaitingModal();

    try {
      // Format phone number for API (no spaces)
      console.log('Formatting phone number for Ghana API...');
      console.log('Original phone number:', formData.recipientNumber);
      console.log('Country ISO:', formData.countryIso);
      
      const formattedPhoneNumber = this.enhancedAirtimeService.formatPhoneNumberForAPI(formData.recipientNumber, this.GHANA_ISO);
      
      console.log('API phone number formatted:', formData.recipientNumber, '->', formattedPhoneNumber);
      
      // Prepare Ghana airtime parameters (for storage only - not for direct API call)
      const topupParams: TopupParams = {
        recipientNumber: formattedPhoneNumber,
        description: `Airtime recharge for ${formData.operatorId}: ${formattedPhoneNumber} - GH₵${formData.amount} (${new Date().toLocaleString()})`,
        amount: this.formatAmount(formData.amount),
        network: formData.operatorId,
        payTransRef: await this.utilService.generateReference(),
        transType: 'AIRTIMETOPUP',
        customerEmail: 'info@advansistechnologies.com'
      };

      // Express Pay Parameters
      const expressPayParams: PaymentParams = {
        userId: this.userProfile._id,
        firstName: this.userProfile.firstName || '',
        lastName: this.userProfile.lastName || '',
        email: this.userProfile.email || '',
        phoneNumber: formattedPhoneNumber,
        username: this.userProfile?.username || '',
        amount: Number(formData.amount),
        orderDesc: topupParams.description,
        orderImgUrl: 'https://gravatar.com/dinosaursuperb49b1159b93',
      };

      console.log('Ghana payment parameters prepared:', {
        userId: expressPayParams.userId,
        firstName: expressPayParams.firstName,
        lastName: expressPayParams.lastName,
        email: expressPayParams.email,
        phoneNumber: expressPayParams.phoneNumber,
        username: expressPayParams.username,
        amount: expressPayParams.amount
      });

      // Payment parameters prepared

      // Validate profile information
      if (!expressPayParams.firstName || !expressPayParams.lastName || !expressPayParams.email) {
        throw new Error('Missing required user profile information. Please update your profile.');
      }

      // Store transaction details
      await this.storage.setStorage('pendingTransaction', JSON.stringify({
        ...topupParams,
        ...expressPayParams,
        timestamp: new Date().toISOString(),
      }));

      // Initiate payment (don't call airtime service directly)
      const response = await firstValueFrom(
        this.advansisPayService.expressPayOnline(expressPayParams)
      );

      // Payment response received

      if (!response || !response.data?.checkoutUrl) {
        throw new Error('Payment service did not return a checkout URL');
      }

      // Validate response
      if (!response.data.token || !response.data['order-id']) {
        throw new Error('Invalid payment response: Missing required fields');
      }

      // Store additional transaction details
      await this.storage.setStorage('pendingTransaction', JSON.stringify({
        ...topupParams,
        ...expressPayParams,
        timestamp: new Date().toISOString(),
        transactionToken: response.data.token,
        orderId: response.data['order-id']
      }));

              // Open checkout URL
        console.log('Opening checkout URL:', response.data.checkoutUrl);
        window.open(response.data.checkoutUrl, '_system');

      // Reset form and go back to first step
      this.currentStep = PurchaseStep.COUNTRY_SELECTION;
      this.notificationService.showSuccess('Payment initiated successfully');

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
      this.notificationService.showError(errorMessage);
      this.currentStep = PurchaseStep.TRANSACTION_SUMMARY;
    } finally {
      try {
        if (modalResult.modal && typeof modalResult.modal.dismiss === 'function') {
          await modalResult.modal.dismiss();
        }
      } catch (dismissError) {
        console.log('Modal dismiss error (non-critical):', dismissError);
      }
    }
  }

  private async processInternationalAirtime(formData: AirtimeFormData) {
    // Log profile status before processing
    this.logProfileStatus();
    
    // Check if profile is valid before proceeding
    if (!this.isProfileValid()) {
      this.notificationService.showError('User profile is incomplete. Please update your profile information.');
      return;
    }

    const modalResult = await this.presentWaitingModal();

    try {
      // Use the already detected operator from the wizard
      const operator = this.selectedOperator || this.detectedOperator;
      // Processing international airtime
      
      if (!operator) {
        throw new Error('No operator detected. Please ensure the phone number is correct.');
      }

      modalResult.updateStatus('Preparing transaction...');

      // Format phone number for API (no spaces)
      const formattedPhoneNumber = this.enhancedAirtimeService.formatPhoneNumberForAPI(formData.recipientNumber, formData.countryIso);

      // Prepare international topup parameters (for storage only - not for direct API call)
      const topupParams: TopupParams = {
        operatorId: operator.id,
        amount: Number(formData.amount),
        description: `International airtime recharge for ${formattedPhoneNumber} (${operator.name})`,
        recipientEmail: this.userProfile.email || '',
        recipientNumber: formattedPhoneNumber,
        recipientCountryCode: formData.countryIso,
        senderNumber: this.userProfile.phoneNumber || '',
        network: operator.id,
        payTransRef: await this.utilService.generateReference(),
        transType: 'GLOBALAIRTOPUP',
        customerEmail: 'info@advansistechnologies.com'
      };

      // Prepare payment parameters
      modalResult.updateStatus('Preparing payment...');
      const expressPayParams: PaymentParams = {
        userId: this.userProfile._id,
        firstName: this.userProfile.firstName || '',
        lastName: this.userProfile.lastName || '',
        email: this.userProfile.email || '',
        phoneNumber: formattedPhoneNumber,
        username: this.userProfile.username || '',
        amount: Number(formData.amount),
        orderDesc: `International airtime recharge for ${formattedPhoneNumber} (${operator.name})`,
        orderImgUrl: 'https://gravatar.com/dinosaursuperb49b1159b93',
      };

      console.log('Payment parameters prepared:', {
        userId: expressPayParams.userId,
        firstName: expressPayParams.firstName,
        lastName: expressPayParams.lastName,
        email: expressPayParams.email,
        phoneNumber: expressPayParams.phoneNumber,
        username: expressPayParams.username,
        amount: expressPayParams.amount
      });

      // Validate profile information
      if (
        !expressPayParams.firstName ||
        !expressPayParams.lastName ||
        !expressPayParams.email
      ) {
        throw new Error(
          'Missing required user profile information. Please update your profile.'
        );
      }

      // Store transaction details
      modalResult.updateStatus('Saving transaction details...');

      await this.storage.setStorage('pendingTransaction', JSON.stringify({
        ...topupParams,
        ...expressPayParams,
        timestamp: new Date().toISOString(),
      }));

      // Initiate payment (don't call airtime service directly)
      modalResult.updateStatus('Initiating payment...');
      const response = await firstValueFrom(
        this.advansisPayService.expressPayOnline(expressPayParams)
      );

      // Payment response received

      if (response && response.status === 201 && response.data?.checkoutUrl) {
        modalResult.updateStatus('Redirecting to payment gateway...');
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        // Safely dismiss modal
        try {
          if (modalResult.modal && typeof modalResult.modal.dismiss === 'function') {
            await modalResult.modal.dismiss();
          }
        } catch (dismissError) {
          console.log('Modal dismiss error (non-critical):', dismissError);
        }
        
        console.log('Opening checkout URL:', response.data.checkoutUrl);
        window.open(response.data.checkoutUrl, '_system');

        // Reset form and go back to first step
        this.currentStep = PurchaseStep.COUNTRY_SELECTION;
        this.notificationService.showSuccess('Payment initiated successfully');
      } else {
        throw new Error('Failed to initiate payment');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
      this.notificationService.showError(errorMessage);
      this.currentStep = PurchaseStep.TRANSACTION_SUMMARY;
    } finally {
      try {
        if (modalResult.modal && typeof modalResult.modal.dismiss === 'function') {
          await modalResult.modal.dismiss();
        }
      } catch (dismissError) {
        console.log('Modal dismiss error (non-critical):', dismissError);
      }
    }
  }

  isFlagUrl(flag: string | undefined): boolean {
    return !!(flag && flag.startsWith('http'));
  }

  getFlagDisplay(flag: string | undefined): string {
    return flag || '🏳️';
  }

  getCountryName(country: Country | null): string {
    return country?.name || 'Unknown Country';
  }

  goBack() {
    if (this.currentStep > 0) {
      this.previousStep();
    } else {
      this.router.navigate(['/tabs/home']);
    }
  }

  /**
   * Debug method to help troubleshoot phone number population issues
   */
  debugPhonePopulation() {
    console.log('=== DEBUG PHONE POPULATION TRIGGERED ===');
    console.log('Current step:', this.currentStep);
    console.log('Current userProfile:', this.userProfile);
    console.log('Form recipientNumber value:', this.airtimeForm.get('recipientNumber')?.value);
    console.log('Selected country:', this.selectedCountry);
    
    // Check storage directly
    this.storage.getStorage('profile').then(storedProfile => {
      console.log('Direct storage check - profile:', storedProfile);
      console.log('Direct storage check - phone number:', storedProfile?.phoneNumber);
    });
    
    // Check if we can populate
    if (this.userProfile?.phoneNumber) {
      console.log('Can populate with current profile');
      this.populateUserPhoneNumber();
    } else {
      console.log('No phone number in current profile, trying storage...');
      this.prefillPhoneFromStorageIfAvailable();
    }
    
    console.log('=== END DEBUG PHONE POPULATION ===');
  }

  /**
   * Public method to manually trigger phone number population
   * This can be called from the template or other components
   */
  public manualPopulatePhone() {
    console.log('=== MANUAL PHONE POPULATION TRIGGERED ===');
    console.log('Current step:', this.currentStep);
    console.log('Current userProfile:', this.userProfile);
    
    if (this.currentStep === PurchaseStep.RECIPIENT_NUMBER) {
      console.log('On phone step, triggering population...');
      this.prefillPhoneFromStorageIfAvailable();
    } else {
      console.log('Not on phone step, current step:', this.currentStep);
    }
    
    console.log('=== END MANUAL PHONE POPULATION ===');
  }

  /**
   * Clear the pre-filled phone number to allow user to enter a different number
   */
  public clearPhoneNumber() {
    console.log('=== CLEAR PHONE NUMBER ===');
    console.log('Current form value before clearing:', this.airtimeForm.get('recipientNumber')?.value);
    
    // Clear the phone number field
    this.airtimeForm.patchValue({ recipientNumber: '' });
    
    // Mark the field as touched and dirty for validation
    const phoneControl = this.airtimeForm.get('recipientNumber');
    if (phoneControl) {
      phoneControl.markAsTouched();
      phoneControl.markAsDirty();
    }
    
    console.log('Form value after clearing:', this.airtimeForm.get('recipientNumber')?.value);
    
    // Show notification to user
    this.notificationService.showToast(
      'Phone number cleared. You can now enter a different number.',
      'info',
      3000
    );
    
    console.log('=== END CLEAR PHONE NUMBER ===');
  }

  /**
   * Simple test method to check current state
   */
  public testCurrentState() {
    console.log('=== TEST CURRENT STATE ===');
    console.log('Current step:', this.currentStep);
    console.log('PurchaseStep.RECIPIENT_NUMBER:', PurchaseStep.RECIPIENT_NUMBER);
    console.log('Are we on phone step?', this.currentStep === PurchaseStep.RECIPIENT_NUMBER);
    console.log('User profile:', this.userProfile);
    console.log('User profile phone:', this.userProfile?.phoneNumber);
    console.log('Form recipientNumber value:', this.airtimeForm.get('recipientNumber')?.value);
    console.log('Selected country:', this.selectedCountry);
    console.log('Form valid:', this.airtimeForm.valid);
    console.log('Form dirty:', this.airtimeForm.dirty);
    console.log('Form touched:', this.airtimeForm.touched);
    console.log('=== END TEST CURRENT STATE ===');
  }
} 