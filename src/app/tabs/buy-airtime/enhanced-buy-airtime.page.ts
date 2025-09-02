import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil, firstValueFrom } from 'rxjs';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonLabel,
  IonInput,
  IonCard,
  IonCardContent,
  IonButtons,
  IonBackButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonChip,
  IonSpinner,
  IonNote,
  ModalController,
} from '@ionic/angular/standalone';

import {
  EnhancedAirtimeService,
  Country,
  Operator,
  AirtimeRequest,
} from 'src/app/services/enhanced-airtime.service';
import { NotificationService } from 'src/app/services/notification.service';
import { AccountService } from 'src/app/services/auth/account.service';
import { AdvansisPayService } from 'src/app/services/payments/advansis-pay.service';
import { StorageService } from 'src/app/services/storage.service';
import { UtilsService } from 'src/app/services/utils.service';
import { ReloadlyService } from 'src/app/services/reloadly.service';
import { Profile } from 'src/app/interfaces';

enum WizardStep {
  COUNTRY_SELECTION = 0,
  OPERATOR_SELECTION = 1,
  PHONE_NUMBER = 2,
  AMOUNT_SELECTION = 3,
  CONFIRMATION = 4,
  PROCESSING = 5,
}

@Component({
  selector: 'app-enhanced-buy-airtime',
  templateUrl: './enhanced-buy-airtime.page.html',
  styleUrls: ['./enhanced-buy-airtime.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonLabel,
    IonInput,
    IonCard,
    IonCardContent,
    IonButtons,
    IonBackButton,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonChip,
    IonSpinner,
    IonNote,
  ],
})
export class EnhancedBuyAirtimePage implements OnInit, OnDestroy {
  currentStep = WizardStep.COUNTRY_SELECTION;
  wizardSteps = WizardStep;

  // Form data
  airtimeForm: FormGroup;

  // Data
  countries: Country[] = [];
  operators: Operator[] = [];
  selectedCountry: Country | null = null;
  selectedOperator: Operator | null = null;
  detectedOperator: Operator | null = null;
  userProfile: Profile = {} as Profile;

  // UI States
  isLoading = false;
  isDetectingOperator = false;
  showOperatorModal = false;

  // Quick amounts
  quickAmounts = [1, 5, 10, 20, 50, 100, 200];

  // Payment and transaction properties
  private readonly GHANA_ISO = 'GH';
  topupParams: any = {};

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
    private modalController: ModalController
  ) {
    this.airtimeForm = this.formBuilder.group({
      countryIso: ['', Validators.required],
      operatorId: ['', Validators.required],
      recipientNumber: ['', [Validators.required]],
      amount: ['', [Validators.required, Validators.min(1)]],
      autoDetect: [true],
    });
  }

  ngOnInit() {
    this.loadUserProfile();
    this.loadCountries();
    this.setupFormListeners();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }



  private async loadUserProfile() {
    try {
      const response = await firstValueFrom(this.accountService.getProfile());
      if (response) {
        this.userProfile = response;
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }

  /**
   * Populate the recipient phone number field with the user's own phone number
   * This provides a convenient default that users can choose to accept or change
   */
  private populateUserPhoneNumber() {
    if (!this.userProfile?.phoneNumber) return;
    
    console.log('Populating recipient phone number with user phone:', this.userProfile.phoneNumber);
    
    // Format the user's phone number based on the selected country
    let formattedNumber = this.userProfile.phoneNumber;
    
    if (this.selectedCountry?.isoName === this.GHANA_ISO) {
      // For Ghana, ensure local format (0240000000)
      formattedNumber = this.enhancedAirtimeService.formatPhoneNumberForAPI(
        this.userProfile.phoneNumber,
        this.GHANA_ISO
      );
    } else {
      // For other countries, use the enhanced airtime service
      formattedNumber = this.enhancedAirtimeService.formatPhoneNumberForAPI(
        this.userProfile.phoneNumber,
        this.selectedCountry?.isoName || ''
      );
    }
    
    // Update the form with the user's phone number
    this.airtimeForm.patchValue({ recipientNumber: formattedNumber });
    console.log('Recipient phone number populated with:', formattedNumber);
    
    // Show a notification to inform the user
    this.notificationService.showToast(
      `Your phone number (${formattedNumber}) has been pre-filled. You can change it if needed.`,
      'primary',
      4000
    );
  }

  private loadCountries() {
    this.isLoading = true;
    
    // Add a minimum loading time to show the loading state properly
    const loadingPromise = new Promise(resolve => setTimeout(resolve, 800));
    
    this.enhancedAirtimeService
      .getCountries()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async (countries) => {
          // Wait for minimum loading time
          await loadingPromise;
          
          this.countries = countries;
          
          // Try to detect user's home country intelligently
          await this.detectUserHomeCountry(countries);
        },
        error: (error) => {
          console.error('Error loading countries:', error);
          this.notificationService.showError('Failed to load countries');
        },
        complete: () => {
          this.isLoading = false;
        },
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

  private setupFormListeners() {
    // Phone number input listener
    this.airtimeForm
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
              this.airtimeForm.get('recipientNumber')?.setValue(formattedNumber, { emitEvent: false });
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
              this.airtimeForm.get('recipientNumber')?.setValue(formattedNumber, { emitEvent: false });
              console.log('Phone number formatted:', phoneNumber, '->', formattedNumber);
            }
          }
          
          // Auto-detect operator for international countries
          if (this.airtimeForm.get('autoDetect')?.value && this.selectedCountry?.isoName !== this.GHANA_ISO) {
            this.autoDetectOperator(formattedNumber);
          }
          
          // Reset flag after formatting is complete
          setTimeout(() => {
            this.isFormattingPhone = false;
          }, 100);
        }
      });
  }

  private loadOperators(countryIso: string) {
    // For non-Ghanaian countries, skip operator loading since we'll use auto-detection
    if (countryIso !== this.GHANA_ISO) {
      this.operators = [];
      this.selectedOperator = null;
      this.airtimeForm.patchValue({ operatorId: '' });
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
          this.airtimeForm.patchValue({ operatorId: '' });
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

  private autoDetectOperator(phoneNumber: string) {
    if (!phoneNumber || !this.selectedCountry) return;

    console.log(
      'Starting auto-detection for:',
      this.selectedCountry.name,
      'phone:',
      phoneNumber
    );
    this.isDetectingOperator = true;

    this.enhancedAirtimeService
      .autoDetectOperator(phoneNumber, this.selectedCountry.isoName)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (operator) => {
          console.log('Auto-detection successful:', operator);
          this.detectedOperator = operator;
          this.airtimeForm.patchValue({ operatorId: operator.id });
          this.selectedOperator = operator;

          // For non-Ghanaian countries, show a notification that operator was detected
          if (this.selectedCountry?.isoName !== this.GHANA_ISO) {
            this.notificationService.showSuccess(
              `Network detected: ${operator.name}`
            );
          }
        },
        error: (error) => {
          console.error('Auto-detection failed:', error);
          // For non-Ghanaian countries, show a warning but don't block the flow
          if (this.selectedCountry?.isoName !== this.GHANA_ISO) {
            this.notificationService.showWarn(
              'Could not auto-detect network. Please ensure the phone number is correct.'
            );
          }
        },
        complete: () => {
          this.isDetectingOperator = false;
        },
      });
  }

  selectCountry(country: Country) {
    console.log('=== COUNTRY SELECTION ===');
    console.log('Selected country:', country);
    console.log('Country ISO:', country.isoName);
    console.log('Is Ghana?', country.isoName === this.GHANA_ISO);
    
    this.selectedCountry = country;
    this.airtimeForm.patchValue({ countryIso: country.isoName });

    // Save user's country preference for future use
    this.saveUserCountryPreference(country);

    // Clear any previous operator selection
    this.selectedOperator = null;
    this.detectedOperator = null;
    this.airtimeForm.patchValue({ operatorId: '' });

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

  private updateFormValidation(countryIso: string) {
    const operatorIdControl = this.airtimeForm.get('operatorId');
    
    if (countryIso === this.GHANA_ISO) {
      // For Ghana, operator selection is required
      operatorIdControl?.setValidators([Validators.required]);
    } else {
      // For international countries, operator selection is not required (auto-detection will be used)
      operatorIdControl?.clearValidators();
    }
    
    operatorIdControl?.updateValueAndValidity();
  }

  // Method to ensure phone number is formatted correctly
  private ensurePhoneNumberFormatted(): void {
    const phoneNumber = this.airtimeForm.get('recipientNumber')?.value;
    if (phoneNumber && this.selectedCountry?.isoName) {
      // For Ghana, ensure we use the local format without any country code prefix
      if (this.selectedCountry.isoName === this.GHANA_ISO) {
        const formattedNumber = this.enhancedAirtimeService.formatPhoneNumberForAPI(
          phoneNumber,
          this.GHANA_ISO
        );
        if (formattedNumber !== phoneNumber) {
          this.airtimeForm.patchValue({ recipientNumber: formattedNumber });
          console.log('Phone number formatted in ensurePhoneNumberFormatted - Ghana:', phoneNumber, '->', formattedNumber);
        }
      } else {
        const formattedNumber = this.enhancedAirtimeService.formatPhoneNumberForAPI(
          phoneNumber,
          this.selectedCountry.isoName
        );
        if (formattedNumber !== phoneNumber) {
          this.airtimeForm.patchValue({ recipientNumber: formattedNumber });
          console.log('Phone number formatted in ensurePhoneNumberFormatted - International:', phoneNumber, '->', formattedNumber);
        }
      }
    }
  }

  selectOperator(operator: Operator) {
    this.selectedOperator = operator;
    this.airtimeForm.patchValue({ operatorId: operator.id });
    this.showOperatorModal = false;
    this.nextStep();
  }

  selectAmount(amount: number) {
    console.log('=== AMOUNT SELECTION ===');
    console.log('Selected amount:', amount);
    console.log('Currency:', this.selectedCountry?.currencyCode);
    this.airtimeForm.patchValue({ amount });
    console.log('Form amount updated to:', amount);
  }

  onPhoneNumberInput(event: any) {
    let phoneNumber = event.target.value;
    
    console.log('=== PHONE NUMBER INPUT ===');
    console.log('Raw input:', phoneNumber);
    console.log('Selected country:', this.selectedCountry?.isoName);
    console.log('Is Ghana?', this.selectedCountry?.isoName === this.GHANA_ISO);
    
    // For Ghana, ensure we format to local format without any country code prefix
    if (this.selectedCountry?.isoName === this.GHANA_ISO) {
      console.log('Processing Ghana phone number...');
      const formattedNumber = this.enhancedAirtimeService.formatPhoneNumberForAPI(
        phoneNumber,
        this.GHANA_ISO
      );
      
      console.log('Ghana formatting result:', phoneNumber, '->', formattedNumber);
      
      if (formattedNumber !== phoneNumber) {
        phoneNumber = formattedNumber;
        // Update the input field directly
        event.target.value = formattedNumber;
        console.log('Input field updated to:', formattedNumber);
      }
    } else {
      console.log('Processing international phone number...');
      // For other countries, use the enhanced airtime service
      const formattedNumber = this.enhancedAirtimeService.formatPhoneNumberForAPI(
        phoneNumber,
        this.selectedCountry?.isoName || ''
      );
      
      console.log('International formatting result:', phoneNumber, '->', formattedNumber);
      
      if (formattedNumber !== phoneNumber) {
        phoneNumber = formattedNumber;
        // Update the input field directly
        event.target.value = formattedNumber;
      }
    }
    
    // Update the form
    this.airtimeForm.patchValue({ recipientNumber: phoneNumber });
    console.log('Form updated with phone number:', phoneNumber);
  }

  private getGhanaNetworkProvider(phoneNumber: string): string {
    if (!phoneNumber) return 'Unknown';
    
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    let nineDigitNumber = '';
    
    if (cleanNumber.length === 10 && cleanNumber.startsWith('0')) {
      nineDigitNumber = cleanNumber.slice(1);
    } else if (cleanNumber.length === 9) {
      nineDigitNumber = cleanNumber;
    } else if (cleanNumber.length === 12 && cleanNumber.startsWith('233')) {
      nineDigitNumber = cleanNumber.slice(3);
    } else if (cleanNumber.length === 13 && cleanNumber.startsWith('233')) {
      nineDigitNumber = cleanNumber.slice(3);
    } else {
      return 'Unknown';
    }
    
    if (nineDigitNumber.length !== 9) return 'Unknown';
    
    const prefix = nineDigitNumber.substring(0, 2);
    
    // Ghana mobile prefixes (2025) - CORRECTED based on official provider breakdown
    // MTN Ghana: 024, 025, 053, 054, 055, 059 (using 2-digit prefixes: 24, 25, 53, 54, 55, 59)
    if (['24', '25', '53', '54', '55', '59'].includes(prefix)) {
      return 'MTN Ghana';
    } 
    // Telecel Ghana: 020, 050 (using 2-digit prefixes: 20, 50)
    else if (['20', '50'].includes(prefix)) {
      return 'Telecel Ghana';
    } 
    // AirtelTigo Ghana: 026, 027, 056, 057 (using 2-digit prefixes: 26, 27, 56, 57)
    else if (['26', '27', '56', '57'].includes(prefix)) {
      return 'AirtelTigo Ghana';
    } 
    // Glo Ghana: 021, 022, 023 (using 2-digit prefixes: 21, 22, 23)
    // Note: 055 conflict resolved in favor of MTN
    else if (['21', '22', '23'].includes(prefix)) {
      return 'Glo Ghana';
    } 
    else {
      return 'Unknown';
    }
  }

  private validateGhanaPhoneNumber(phoneNumber: string): boolean {
    if (!phoneNumber) return false;
    
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Valid Ghana mobile prefixes (2025) - STRICTLY ENFORCED
    const validPrefixes = ['020', '024', '025', '026', '027', '050', '053', '054', '055', '056', '057', '059'];
    
    let nineDigitNumber = '';
    
    if (cleanNumber.length === 10 && cleanNumber.startsWith('0')) {
      // 0XXXXXXXXX format
      nineDigitNumber = cleanNumber.slice(1);
    } else if (cleanNumber.length === 9) {
      // XXXXXXXXX format
      nineDigitNumber = cleanNumber;
    } else if (cleanNumber.length === 12 && cleanNumber.startsWith('233')) {
      // 233XXXXXXXXX format
      nineDigitNumber = cleanNumber.slice(3);
    } else if (cleanNumber.length === 13 && cleanNumber.startsWith('233')) {
      // +233XXXXXXXXX format
      nineDigitNumber = cleanNumber.slice(3);
    } else {
      return false;
    }
    
    if (nineDigitNumber.length !== 9) return false;
    
    const prefix = nineDigitNumber.substring(0, 2);
    const isValid = validPrefixes.includes(prefix);
    
    console.log(`Ghana phone validation: ${phoneNumber} -> prefix ${prefix} -> ${isValid ? 'VALID' : 'INVALID'}`);
    return isValid;
  }

  validatePhoneNumber(): boolean {
    const phoneNumber = this.airtimeForm.get('recipientNumber')?.value;
    const countryIso = this.airtimeForm.get('countryIso')?.value;
    
    if (!phoneNumber || !countryIso) return false;
    
    if (countryIso === this.GHANA_ISO) {
      // Use strict Ghana validation
      return this.validateGhanaPhoneNumber(phoneNumber);
    } else {
      // International validation (7-15 digits)
      const cleanNumber = phoneNumber.replace(/\D/g, '');
      return cleanNumber.length >= 7 && cleanNumber.length <= 15;
    }
  }

  nextStep() {
    if (this.currentStep < WizardStep.CONFIRMATION) {
      this.currentStep++;

      // For non-Ghanaian countries, skip operator selection step
      if (
        this.currentStep === WizardStep.OPERATOR_SELECTION &&
        this.selectedCountry?.isoName !== this.GHANA_ISO
      ) {
        this.currentStep = WizardStep.PHONE_NUMBER;
      }
      
      // When reaching phone number step, populate with user's phone number if available
      if (this.currentStep === WizardStep.PHONE_NUMBER && this.userProfile?.phoneNumber) {
        this.populateUserPhoneNumber();
      }
      
      // When reaching confirmation step, ensure phone number is formatted for Ghana
      if (this.currentStep === WizardStep.CONFIRMATION) {
        this.ensurePhoneNumberFormatted();
      }
    }
  }

  previousStep() {
    if (this.currentStep > WizardStep.COUNTRY_SELECTION) {
      this.currentStep--;

      // For non-Ghanaian countries, skip operator selection step when going back
      if (
        this.currentStep === WizardStep.OPERATOR_SELECTION &&
        this.selectedCountry?.isoName !== this.GHANA_ISO
      ) {
        this.currentStep = WizardStep.COUNTRY_SELECTION;
      }
    }
  }

  goToStep(step: WizardStep) {
    this.currentStep = step;
    
    // When going to confirmation step, ensure phone number is formatted for Ghana
    if (step === WizardStep.CONFIRMATION) {
      this.ensurePhoneNumberFormatted();
    }
  }

  async submitAirtime() {
    console.log('=== SUBMIT AIRTIME ===');
    console.log('Form valid:', this.airtimeForm.valid);
    
    if (!this.airtimeForm.valid) {
      this.notificationService.showWarn('Please fill all required fields');
      return;
    }

    // Ensure phone number is formatted before submission
    console.log('Ensuring phone number is formatted...');
    this.ensurePhoneNumberFormatted();

    const formData = this.airtimeForm.value;
    const countryIso = formData.countryIso;
    const isGhana = countryIso === this.GHANA_ISO;
    
    console.log('=== SUBMISSION SUMMARY ===');
    console.log('Country ISO:', countryIso);
    console.log('Is Ghana?', isGhana);
    console.log('Phone Number:', formData.recipientNumber);
    console.log('Amount:', formData.amount);
    console.log('Operator ID:', formData.operatorId);
    console.log('Selected Operator:', this.selectedOperator?.name);
    console.log('Detected Operator:', this.detectedOperator?.name);

    // For non-Ghanaian countries, ensure we have operator information from auto-detection
    if (!isGhana && !this.selectedOperator && !this.detectedOperator) {
      this.notificationService.showWarn(
        'Please enter a valid phone number to auto-detect the network'
      );
      return;
    }

    this.currentStep = WizardStep.PROCESSING;

    try {
      // Check user profile
      if (!this.userProfile?._id) {
        await this.getUserProfile();
      }

      if (isGhana) {
        console.log('Processing Ghana airtime...');
        await this.processGhanaAirtime(formData);
      } else {
        console.log('Processing international airtime...');
        await this.processInternationalAirtime(formData);
      }
    } catch (error: any) {
      console.error('Airtime submission error:', error);
      this.notificationService.showError(error.message || 'Transaction failed');
      this.currentStep = WizardStep.CONFIRMATION;
    }
  }

  private async processGhanaAirtime(formData: any) {
    console.log('=== PROCESS GHANA AIRTIME ===');
    console.log('Form data received:', formData);
    
    const modalResult = await this.presentWaitingModal();

    try {
      // Format the phone number for the API (ensure it's in local Ghanaian format)
      console.log('Formatting phone number for Ghana API...');
      console.log('Original phone number:', formData.recipientNumber);
      console.log('Country ISO:', formData.countryIso);
      
      const apiPhoneNumber = this.enhancedAirtimeService.formatPhoneNumberForAPI(
        formData.recipientNumber,
        formData.countryIso
      );
      
      console.log('API phone number formatted:', formData.recipientNumber, '->', apiPhoneNumber);

      // Prepare Ghana airtime parameters (for storage only - not for direct API call)
      this.topupParams = {
        recipientNumber: apiPhoneNumber, // Use the formatted number (like 0240000000) for API
        description: `Airtime recharge for ${
          formData.operatorId
        }: ${apiPhoneNumber} - GH₵${
          formData.amount
        } (${new Date().toLocaleString()})`,
        amount: this.formatAmount(formData.amount),
        network: formData.operatorId,
        payTransRef: await this.utilService.generateReference(),
        transType: 'AIRTIMETOPUP',
        customerEmail: this.userProfile.email || '',
      };

      // Express Pay Parameters
      const expressPayParams = {
        userId: this.userProfile._id,
        firstName: this.userProfile.firstName || '',
        lastName: this.userProfile.lastName || '',
        email: this.userProfile.email || '',
        phoneNumber: apiPhoneNumber, // Use the formatted number (like 0240000000)
        username: this.userProfile?.username || '',
        amount: Number(formData.amount),
        orderDesc: this.topupParams.description,
        orderImgUrl: 'https://gravatar.com/dinosaursuperb49b1159b93',
      };

      console.log('=== GHANA AIRTIME PARAMS ===');
      console.log('Topup params:', this.topupParams);
      console.log('Express pay params:', expressPayParams);
      console.log('Phone number in topup params:', this.topupParams.recipientNumber);
      console.log('Phone number in express pay params:', expressPayParams.phoneNumber);

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
      await this.storage.setStorage(
        'pendingTransaction',
        JSON.stringify({
          ...this.topupParams,
          ...expressPayParams,
          timestamp: new Date().toISOString(),
        })
      );

      // Initiate payment (don't call airtime service directly)
      const response = await firstValueFrom(
        this.advansisPayService.expressPayOnline(expressPayParams)
      );

      console.log(
        '[Ghana Payment response]=>',
        JSON.stringify(response, null, 2)
      );

      if (!response || !response.data?.checkoutUrl) {
        throw new Error('Payment service did not return a checkout URL');
      }

      // Validate response
      if (!response.data.token || !response.data['order-id']) {
        throw new Error('Invalid payment response: Missing required fields');
      }

      // Store additional transaction details
      await this.storage.setStorage(
        'pendingTransaction',
        JSON.stringify({
          ...this.topupParams,
          ...expressPayParams,
          timestamp: new Date().toISOString(),
          transactionToken: response.data.token,
          orderId: response.data['order-id'],
        })
      );

      // Open checkout URL
      window.open(response.data.checkoutUrl, '_system');

      // Reset form and go back to first step
      this.resetForm();
      this.currentStep = WizardStep.COUNTRY_SELECTION;
      this.notificationService.showSuccess('Payment initiated successfully');
    } catch (error: any) {
      console.error('Ghana airtime processing error:', error);
      this.notificationService.showError(error.message || 'Transaction failed');
      this.currentStep = WizardStep.CONFIRMATION;
    } finally {
      if (modalResult.modal) {
        await modalResult.modal.dismiss();
      }
    }
  }

  private async processInternationalAirtime(formData: any) {
    const modalResult = await this.presentWaitingModal();

    try {
      // Use the already detected operator from the wizard
      const operator = this.selectedOperator || this.detectedOperator;
      console.log('Processing international airtime with operator:', operator);

      if (!operator) {
        throw new Error(
          'No operator detected. Please ensure the phone number is correct.'
        );
      }

      modalResult.updateStatus('Preparing transaction...');

      // Prepare international topup parameters (for storage only - not for direct API call)
      this.topupParams = {
        operatorId: operator.id,
        amount: Number(formData.amount),
        description: `International airtime recharge for ${formData.recipientNumber} (${operator.name})`,
        recipientEmail: this.userProfile.email || '',
        recipientNumber: this.enhancedAirtimeService.formatPhoneNumberForAPI(
          formData.recipientNumber,
          formData.countryIso
        ),
        recipientCountryCode: formData.countryIso,
        senderNumber: this.userProfile.phoneNumber || '',
        payTransRef: await this.utilService.generateReference(),
        transType: 'GLOBALAIRTOPUP',
        customerEmail: this.userProfile.email || '',
      };

      // Prepare payment parameters
      modalResult.updateStatus('Preparing payment...');
      const expressPayParams = {
        userId: this.userProfile._id,
        firstName: this.userProfile.firstName || '',
        lastName: this.userProfile.lastName || '',
        email: this.userProfile.email || '',
        phoneNumber: this.enhancedAirtimeService.formatPhoneNumberForAPI(
          formData.recipientNumber,
          formData.countryIso
        ),
        username: this.userProfile.username || '',
        amount: Number(formData.amount),
        orderDesc: `International airtime recharge for ${this.enhancedAirtimeService.formatPhoneNumberForAPI(
          formData.recipientNumber,
          formData.countryIso
        )} (${operator.name})`,
        orderImgUrl: 'https://gravatar.com/dinosaursuperb49b1159b93',
      };

      // Store transaction details
      modalResult.updateStatus('Saving transaction details...');
      console.log('[International Airtime] => topupParams', this.topupParams);
      console.log(
        '[International Airtime] => expressPayParams',
        expressPayParams
      );

      await this.storage.setStorage(
        'pendingTransaction',
        JSON.stringify({
          ...this.topupParams,
          ...expressPayParams,
          timestamp: new Date().toISOString(),
        })
      );

      // Initiate payment (don't call airtime service directly)
      modalResult.updateStatus('Initiating payment...');
      const response = await firstValueFrom(
        this.advansisPayService.expressPayOnline(expressPayParams)
      );

      console.log('[International Payment response]=>', response);

      if (response && response.status === 201 && response.data?.checkoutUrl) {
        modalResult.updateStatus('Redirecting to payment gateway...');
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await modalResult.modal.dismiss();
        window.open(response.data.checkoutUrl, '_system');

        // Reset form and go back to first step
        this.resetForm();
        this.currentStep = WizardStep.COUNTRY_SELECTION;
        this.notificationService.showSuccess('Payment initiated successfully');
      } else {
        throw new Error('Failed to initiate payment');
      }
    } catch (error: any) {
      console.error('International airtime processing error:', error);
      this.notificationService.showError(error.message || 'Transaction failed');
      this.currentStep = WizardStep.CONFIRMATION;
    } finally {
      if (modalResult.modal) {
        await modalResult.modal.dismiss();
      }
    }
  }

  private async detectOperator(params: {
    phone: string;
    countryIsoCode: string;
  }) {
    console.log('Calling autoDetectOperator with:', {
      phone: params.phone,
      countryIsoCode: params.countryIsoCode,
    });

    try {
      const response = await firstValueFrom(
        this.reloadlyService.autoDetectOperator({
          phone: params.phone,
          countryIsoCode: params.countryIsoCode,
        })
      );

      console.log('[autoDetectOperator] => response:', response);

      if (response && (response.operatorId || response.id)) {
        return {
          operatorId: response.operatorId || response.id,
          operatorName: response.operatorName || response.name,
        };
      } else {
        throw new Error('Failed to detect operator');
      }
    } catch (error) {
      console.error('Operator detection error:', error);
      throw new Error('Failed to detect network operator');
    }
  }

  private async getUserProfile() {
    try {
      const response = await firstValueFrom(this.accountService.getProfile());
      if (response) {
        this.userProfile = response;
      } else {
        throw new Error('Failed to load user profile');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      throw new Error('Failed to load user profile');
    }
  }

  private formatAmount(amount: number): number {
    return Number(amount) * 100; // Convert to kobo
  }

  formatPhoneNumberForGhana(phoneNumber: string): string {
    if (!phoneNumber) return '';

    console.log('Formatting Ghana phone number:', phoneNumber);
    
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    console.log('Clean number:', cleanNumber);
    
    // Convert Ghanaian phone numbers to local format (0240000000)
    if (cleanNumber.length === 12 && cleanNumber.startsWith('233')) {
      // Convert 2330244588584 -> 0244588584 (remove 233 prefix and keep the rest)
      const result = cleanNumber.slice(3);
      console.log('12-digit format converted:', result);
      return result;
    } else if (cleanNumber.length === 13 && cleanNumber.startsWith('233')) {
      // Convert +2330244588584 -> 0244588584 (remove 233 prefix and keep the rest)
      const result = cleanNumber.slice(3);
      console.log('13-digit format converted:', result);
      return result;
    } else if (cleanNumber.length === 10 && cleanNumber.startsWith('0')) {
      // Keep as is: 0244588584
      console.log('10-digit format kept as is:', cleanNumber);
      return cleanNumber;
    } else if (cleanNumber.length === 11 && cleanNumber.startsWith('233')) {
      // Convert 233244000000 -> 0244000000 (remove 233 prefix and add 0)
      const result = '0' + cleanNumber.slice(3);
      console.log('11-digit format converted:', result);
      return result;
    } else if (cleanNumber.length === 9 && !cleanNumber.startsWith('0')) {
      // Convert 244000000 -> 0244000000 (add 0 prefix)
      const result = '0' + cleanNumber;
      console.log('9-digit format converted:', result);
      return result;
    }
    
    // For any other format, try to make it work
    console.log('Other format, returning as is:', phoneNumber);
    return phoneNumber;
  }

  formatPhoneNumberForDisplay(phoneNumber: string): string {
    if (!phoneNumber) return '';

    // For Ghana, ensure we show the local format without any country code prefix
    if (this.selectedCountry?.isoName === this.GHANA_ISO) {
      const formatted = this.enhancedAirtimeService.formatPhoneNumberForAPI(
        phoneNumber,
        this.GHANA_ISO
      );
      console.log('formatPhoneNumberForDisplay - Ghana:', phoneNumber, '->', formatted);
      return formatted;
    }

    // For other countries, use the enhanced airtime service
    return this.enhancedAirtimeService.formatPhoneNumberForAPI(
      phoneNumber,
      this.selectedCountry?.isoName || ''
    );
  }

  private async presentWaitingModal(): Promise<{
    modal: HTMLIonModalElement;
    updateStatus: (message: string) => void;
  }> {
    const modal = await this.modalController.create({
      component: 'ion-loading',
      componentProps: {
        message: 'Processing...',
        spinner: 'crescent',
      },
    });
    await modal.present();

    const updateStatus = (message: string) => {
      modal.componentProps = { ...modal.componentProps, message };
    };

    return { modal, updateStatus };
  }

  private resetForm() {
    this.airtimeForm.reset({
      autoDetect: true,
    });
    this.selectedCountry = null;
    this.selectedOperator = null;
    this.detectedOperator = null;
  }

  getStepProgress(): number {
    // Calculate total steps, accounting for skipped operator selection for non-Ghanaian countries
    const totalSteps = this.selectedCountry?.isoName !== this.GHANA_ISO ? 5 : 6;
    const currentStepIndex = this.currentStep;

    // Adjust step index if we're past operator selection for non-Ghanaian countries
    let adjustedStepIndex = currentStepIndex;
    if (
      this.selectedCountry?.isoName !== this.GHANA_ISO &&
      currentStepIndex > WizardStep.OPERATOR_SELECTION
    ) {
      adjustedStepIndex = currentStepIndex - 1;
    }

    return ((adjustedStepIndex + 1) / totalSteps) * 100;
  }

  getStepTitle(): string {
    switch (this.currentStep) {
      case WizardStep.COUNTRY_SELECTION:
        return 'Select Country';
      case WizardStep.OPERATOR_SELECTION:
        return 'Select Network';
      case WizardStep.PHONE_NUMBER:
        return 'Enter Phone Number';
      case WizardStep.AMOUNT_SELECTION:
        return 'Select Amount';
      case WizardStep.CONFIRMATION:
        return 'Confirm Purchase';
      case WizardStep.PROCESSING:
        return 'Processing...';
      default:
        return 'Buy Airtime';
    }
  }

  getStepDescription(): string {
    switch (this.currentStep) {
      case WizardStep.COUNTRY_SELECTION:
        return 'Choose the country for airtime topup';
      case WizardStep.OPERATOR_SELECTION:
        if (this.selectedCountry?.isoName !== this.GHANA_ISO) {
          return 'Network will be auto-detected from phone number';
        }
        return 'Select your mobile network provider';
      case WizardStep.PHONE_NUMBER:
        if (this.selectedCountry?.isoName !== this.GHANA_ISO) {
          return 'Enter the phone number to recharge (network will be auto-detected). Your phone number is pre-filled for convenience.';
        }
        return 'Enter the phone number to recharge. Your phone number is pre-filled for convenience.';
      case WizardStep.AMOUNT_SELECTION:
        return 'Choose the amount to recharge';
      case WizardStep.CONFIRMATION:
        return 'Review and confirm your purchase';
      case WizardStep.PROCESSING:
        return 'Please wait while we process your request';
      default:
        return '';
    }
  }

  getFormattedPhoneNumber(): string {
    const phoneNumber = this.airtimeForm.get('recipientNumber')?.value;
    if (!phoneNumber) return '';
    
    console.log('=== GET FORMATTED PHONE NUMBER ===');
    console.log('Current form phone number:', phoneNumber);
    console.log('Selected country:', this.selectedCountry?.isoName);
    console.log('Is Ghana?', this.selectedCountry?.isoName === this.GHANA_ISO);
    
    // For Ghana, ensure we show the local format without any country code prefix
    if (this.selectedCountry?.isoName === this.GHANA_ISO) {
      console.log('Formatting Ghana phone number for display...');
      const formatted = this.enhancedAirtimeService.formatPhoneNumberForAPI(
        phoneNumber,
        this.GHANA_ISO
      );
      
      console.log('Ghana display formatting result:', phoneNumber, '->', formatted);
      
      // If the formatted number is different, update the form
      if (formatted !== phoneNumber) {
        this.airtimeForm.patchValue({ recipientNumber: formatted });
        console.log('Form updated with formatted number:', formatted);
      }
      
      return formatted;
    }
    
    // For other countries, use the enhanced airtime service
    console.log('Formatting international phone number for display...');
    const formatted = this.enhancedAirtimeService.formatPhoneNumberForAPI(
      phoneNumber,
      this.selectedCountry?.isoName || ''
    );
    
    console.log('International display formatting result:', phoneNumber, '->', formatted);
    
    // If the formatted number is different, update the form
    if (formatted !== phoneNumber) {
      this.airtimeForm.patchValue({ recipientNumber: formatted });
      console.log('Form updated with formatted number:', formatted);
    }
    
    return formatted;
  }

  canProceed(): boolean {
    switch (this.currentStep) {
      case WizardStep.COUNTRY_SELECTION:
        return !!this.selectedCountry;
      case WizardStep.OPERATOR_SELECTION:
        // For non-Ghanaian countries, operator selection is not required (auto-detection will be used)
        if (this.selectedCountry?.isoName !== this.GHANA_ISO) {
          return true;
        }
        return !!this.selectedOperator;
      case WizardStep.PHONE_NUMBER:
        return this.validatePhoneNumber();
      case WizardStep.AMOUNT_SELECTION:
        return this.airtimeForm.get('amount')?.value > 0;
      case WizardStep.CONFIRMATION:
        return this.airtimeForm.valid;
      default:
        return false;
    }
  }
}
