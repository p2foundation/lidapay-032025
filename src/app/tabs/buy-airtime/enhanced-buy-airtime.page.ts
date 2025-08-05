import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil, firstValueFrom } from 'rxjs';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonItem, 
  IonLabel, IonInput, IonSelect, IonSelectOption, IonCard, IonCardContent,
  IonButtons, IonBackButton, IonIcon, IonGrid, IonRow, IonCol, IonChip,
  IonSpinner, IonAlert, IonToast, IonModal, IonList, IonAvatar, IonBadge,
  ModalController
} from '@ionic/angular/standalone';

import { EnhancedAirtimeService, Country, Operator, AirtimeRequest } from 'src/app/services/enhanced-airtime.service';
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
  PROCESSING = 5
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
    IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonItem,
    IonLabel, IonInput, IonSelect, IonSelectOption, IonCard, IonCardContent,
    IonButtons, IonBackButton, IonIcon, IonGrid, IonRow, IonCol, IonChip,
    IonSpinner, IonAlert, IonToast, IonModal, IonList, IonAvatar, IonBadge
  ]
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
  quickAmounts = [5, 10, 20, 50, 100, 200, 500];
  
  // Payment and transaction properties
  private readonly GHANA_ISO = 'GH';
  topupParams: any = {};
  
  private destroy$ = new Subject<void>();

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
      recipientNumber: ['', [Validators.required, Validators.minLength(7)]],
      amount: ['', [Validators.required, Validators.min(1)]],
      autoDetect: [true]
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

  private loadCountries() {
    this.isLoading = true;
    this.enhancedAirtimeService.getCountries()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (countries) => {
          this.countries = countries;
          // Don't auto-select Ghana, let user choose
        },
        error: (error) => {
          console.error('Error loading countries:', error);
          this.notificationService.showError('Failed to load countries');
        },
        complete: () => {
          this.isLoading = false;
        }
      });
  }

  private setupFormListeners() {
    // Listen to phone number changes for auto-detection
    this.airtimeForm.get('recipientNumber')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(phoneNumber => {
        if (phoneNumber && this.airtimeForm.get('autoDetect')?.value) {
          this.autoDetectOperator(phoneNumber);
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
    this.enhancedAirtimeService.getOperators(countryIso)
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
        }
      });
  }

  private autoDetectOperator(phoneNumber: string) {
    if (!phoneNumber || !this.selectedCountry) return;

    console.log('Starting auto-detection for:', this.selectedCountry.name, 'phone:', phoneNumber);
    this.isDetectingOperator = true;
    
    this.enhancedAirtimeService.autoDetectOperator(phoneNumber, this.selectedCountry.isoName)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (operator) => {
          console.log('Auto-detection successful:', operator);
          this.detectedOperator = operator;
          this.airtimeForm.patchValue({ operatorId: operator.id });
          this.selectedOperator = operator;
          
          // For non-Ghanaian countries, show a notification that operator was detected
          if (this.selectedCountry?.isoName !== this.GHANA_ISO) {
            this.notificationService.showSuccess(`Network detected: ${operator.name}`);
          }
        },
        error: (error) => {
          console.error('Auto-detection failed:', error);
          // For non-Ghanaian countries, show a warning but don't block the flow
          if (this.selectedCountry?.isoName !== this.GHANA_ISO) {
            this.notificationService.showWarn('Could not auto-detect network. Please ensure the phone number is correct.');
          }
        },
        complete: () => {
          this.isDetectingOperator = false;
        }
      });
  }

  selectCountry(country: Country) {
    console.log('Selected country:', country);
    this.selectedCountry = country;
    this.airtimeForm.patchValue({ countryIso: country.isoName });
    
    // Clear any previous operator selection
    this.selectedOperator = null;
    this.detectedOperator = null;
    this.airtimeForm.patchValue({ operatorId: '' });
    
    // Load operators only for Ghana
    if (country.isoName === this.GHANA_ISO) {
      this.loadOperators(country.isoName);
    } else {
      // For non-Ghanaian countries, clear operators array
      this.operators = [];
    }
    
    this.nextStep();
  }

  selectOperator(operator: Operator) {
    this.selectedOperator = operator;
    this.airtimeForm.patchValue({ operatorId: operator.id });
    this.showOperatorModal = false;
    this.nextStep();
  }

  selectAmount(amount: number) {
    this.airtimeForm.patchValue({ amount });
  }

  onPhoneNumberInput(event: any) {
    const phoneNumber = event.target.value;
    if (this.selectedCountry) {
      // For Ghanaian numbers, ensure proper formatting
      if (this.selectedCountry.isoName === this.GHANA_ISO) {
        // Clean the input and ensure it's in the correct format
        const cleanNumber = phoneNumber.replace(/\D/g, '');
        let formattedNumber = '';
        
        if (cleanNumber.length === 10 && cleanNumber.startsWith('0')) {
          // Keep as is: 0244588584
          formattedNumber = cleanNumber;
        } else if (cleanNumber.length === 9) {
          // Add 0 prefix: 244588584 -> 0244588584
          formattedNumber = '0' + cleanNumber;
        } else if (cleanNumber.length === 12 && cleanNumber.startsWith('233')) {
          // Convert to local format: 233244588584 -> 0244588584
          formattedNumber = '0' + cleanNumber.slice(3);
        } else if (cleanNumber.length === 13 && cleanNumber.startsWith('233')) {
          // Convert to local format: +233244588584 -> 0244588584
          formattedNumber = '0' + cleanNumber.slice(3);
        } else {
          // For any other format, try to make it valid
          if (cleanNumber.length >= 9) {
            formattedNumber = '0' + cleanNumber.slice(-9);
          } else {
            formattedNumber = phoneNumber; // Keep original if can't format
          }
        }
        
        this.airtimeForm.patchValue({ recipientNumber: formattedNumber });
      } else {
        // For non-Ghanaian countries, use the enhanced service formatting
        const formatted = this.enhancedAirtimeService.formatPhoneNumber(phoneNumber, this.selectedCountry.isoName);
        this.airtimeForm.patchValue({ recipientNumber: formatted });
        
        // Auto-detect operator for non-Ghanaian countries when phone number is entered
        if (formatted.length >= 7) {
          console.log('Auto-detecting operator for:', this.selectedCountry.name, 'with phone:', formatted);
          this.autoDetectOperator(formatted);
        }
      }
    }
  }

  validatePhoneNumber(): boolean {
    const phoneNumber = this.airtimeForm.get('recipientNumber')?.value;
    const countryIso = this.airtimeForm.get('countryIso')?.value;
    
    if (!phoneNumber || !countryIso) return false;
    
    // For non-Ghanaian countries, basic validation is sufficient since operator will be auto-detected
    if (countryIso !== this.GHANA_ISO) {
      return phoneNumber.length >= 7;
    }
    
    return this.enhancedAirtimeService.validatePhoneNumber(phoneNumber, countryIso);
  }

  nextStep() {
    if (this.currentStep < WizardStep.CONFIRMATION) {
      this.currentStep++;
      
      // For non-Ghanaian countries, skip operator selection step
      if (this.currentStep === WizardStep.OPERATOR_SELECTION && 
          this.selectedCountry?.isoName !== this.GHANA_ISO) {
        this.currentStep = WizardStep.PHONE_NUMBER;
      }
    }
  }

  previousStep() {
    if (this.currentStep > WizardStep.COUNTRY_SELECTION) {
      this.currentStep--;
      
      // For non-Ghanaian countries, skip operator selection step when going back
      if (this.currentStep === WizardStep.OPERATOR_SELECTION && 
          this.selectedCountry?.isoName !== this.GHANA_ISO) {
        this.currentStep = WizardStep.COUNTRY_SELECTION;
      }
    }
  }

  goToStep(step: WizardStep) {
    this.currentStep = step;
  }

  async submitAirtime() {
    if (!this.airtimeForm.valid) {
      this.notificationService.showWarn('Please fill all required fields');
      return;
    }

    const formData = this.airtimeForm.value;
    const countryIso = formData.countryIso;
    const isGhana = countryIso === this.GHANA_ISO;

    // For non-Ghanaian countries, ensure we have operator information from auto-detection
    if (!isGhana && !this.selectedOperator && !this.detectedOperator) {
      this.notificationService.showWarn('Please enter a valid phone number to auto-detect the network');
      return;
    }

    this.currentStep = WizardStep.PROCESSING;

    try {
      // Check user profile
      if (!this.userProfile?._id) {
        await this.getUserProfile();
      }

      if (isGhana) {
        await this.processGhanaAirtime(formData);
      } else {
        await this.processInternationalAirtime(formData);
      }
    } catch (error: any) {
      console.error('Airtime submission error:', error);
      this.notificationService.showError(error.message || 'Transaction failed');
      this.currentStep = WizardStep.CONFIRMATION;
    }
  }

  private async processGhanaAirtime(formData: any) {
    const modalResult = await this.presentWaitingModal();

    try {
      // Ensure phone number is in the correct format for API (233 format)
      let apiPhoneNumber = formData.recipientNumber;
      const cleanNumber = apiPhoneNumber.replace(/\D/g, '');
      
      // Convert to proper 233 format for API
      if (cleanNumber.length === 10 && cleanNumber.startsWith('0')) {
        // Convert 0244588584 -> 233244588584
        apiPhoneNumber = '233' + cleanNumber.slice(1);
      } else if (cleanNumber.length === 9) {
        // Convert 244588584 -> 233244588584
        apiPhoneNumber = '233' + cleanNumber;
      } else if (cleanNumber.length === 12 && cleanNumber.startsWith('233')) {
        // Keep as is: 233244588584
        apiPhoneNumber = cleanNumber;
      } else if (cleanNumber.length === 13 && cleanNumber.startsWith('233')) {
        // Remove + from +233244588584 -> 233244588584
        apiPhoneNumber = cleanNumber.slice(1);
      } else {
        // For any other format, try to make it valid
        if (cleanNumber.length >= 9) {
          apiPhoneNumber = '233' + cleanNumber.slice(-9);
        } else {
          throw new Error('Invalid phone number format. Please enter a valid Ghanaian phone number.');
        }
      }

      // Prepare Ghana airtime parameters (for storage only - not for direct API call)
      this.topupParams = {
        recipientNumber: apiPhoneNumber,
        description: `Airtime recharge for ${formData.operatorId}: ${this.formatPhoneNumberForDisplay(formData.recipientNumber)} - GH₵${formData.amount} (${new Date().toLocaleString()})`,
        amount: this.formatAmount(formData.amount),
        network: formData.operatorId,
        payTransRef: await this.utilService.generateReference(),
        transType: 'AIRTIMETOPUP',
        customerEmail: 'info@advansistechnologies.com'
      };

      // Express Pay Parameters
      const expressPayParams = {
        userId: this.userProfile._id,
        firstName: this.userProfile.firstName || '',
        lastName: this.userProfile.lastName || '',
        email: this.userProfile.email || '',
        phoneNumber: apiPhoneNumber,
        username: this.userProfile?.username || '',
        amount: Number(formData.amount),
        orderDesc: this.topupParams.description,
        orderImgUrl: 'https://gravatar.com/dinosaursuperb49b1159b93',
      };

      console.log('[Ghana Airtime] => Payment params:', expressPayParams);
      console.log('[Ghana Airtime] => Airtime params:', this.topupParams);

      // Validate profile information
      if (!expressPayParams.firstName || !expressPayParams.lastName || !expressPayParams.email) {
        throw new Error('Missing required user profile information. Please update your profile.');
      }

      // Store transaction details
      await this.storage.setStorage('pendingTransaction', JSON.stringify({
        ...this.topupParams,
        ...expressPayParams,
        timestamp: new Date().toISOString(),
      }));

      // Initiate payment (don't call airtime service directly)
      const response = await firstValueFrom(
        this.advansisPayService.expressPayOnline(expressPayParams)
      );

      console.log('[Ghana Payment response]=>', JSON.stringify(response, null, 2));

      if (!response || !response.data?.checkoutUrl) {
        throw new Error('Payment service did not return a checkout URL');
      }

      // Validate response
      if (!response.data.token || !response.data['order-id']) {
        throw new Error('Invalid payment response: Missing required fields');
      }

      // Store additional transaction details
      await this.storage.setStorage('pendingTransaction', JSON.stringify({
        ...this.topupParams,
        ...expressPayParams,
        timestamp: new Date().toISOString(),
        transactionToken: response.data.token,
        orderId: response.data['order-id']
      }));

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
        throw new Error('No operator detected. Please ensure the phone number is correct.');
      }

      modalResult.updateStatus('Preparing transaction...');

      // Prepare international topup parameters (for storage only - not for direct API call)
      this.topupParams = {
        operatorId: operator.id,
        amount: Number(formData.amount),
        description: `International airtime recharge for ${formData.recipientNumber} (${operator.name})`,
        recipientEmail: this.userProfile.email || '',
        recipientNumber: this.enhancedAirtimeService.formatPhoneNumberForAPI(formData.recipientNumber, formData.countryIso),
        recipientCountryCode: formData.countryIso,
        senderNumber: this.userProfile.phoneNumber || '',
        payTransRef: await this.utilService.generateReference(),
        transType: 'GLOBALAIRTOPUP',
        customerEmail: 'info@advansistechnologies.com'
      };

      // Prepare payment parameters
      modalResult.updateStatus('Preparing payment...');
      const expressPayParams = {
        userId: this.userProfile._id,
        firstName: this.userProfile.firstName || '',
        lastName: this.userProfile.lastName || '',
        email: this.userProfile.email || '',
        phoneNumber: this.enhancedAirtimeService.formatPhoneNumberForAPI(formData.recipientNumber, formData.countryIso),
        username: this.userProfile.username || '',
        amount: Number(formData.amount),
        orderDesc: `International airtime recharge for ${formData.recipientNumber} (${operator.name})`,
        orderImgUrl: 'https://gravatar.com/dinosaursuperb49b1159b93',
      };

      // Store transaction details
      modalResult.updateStatus('Saving transaction details...');
      console.log('[International Airtime] => topupParams', this.topupParams);
      console.log('[International Airtime] => expressPayParams', expressPayParams);

      await this.storage.setStorage('pendingTransaction', JSON.stringify({
        ...this.topupParams,
        ...expressPayParams,
        timestamp: new Date().toISOString(),
      }));

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

  private async detectOperator(params: { phone: string; countryIsoCode: string }) {
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

      if (response && response.operatorId) {
        return {
          operatorId: response.operatorId,
          operatorName: response.operatorName,
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

  formatPhoneNumberForDisplay(phoneNumber: string): string {
    if (!phoneNumber) return '';
    
    // Clean the phone number
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // For Ghanaian numbers, convert to local format (starting with 0)
    if (this.selectedCountry?.isoName === this.GHANA_ISO) {
      if (cleanNumber.length === 12 && cleanNumber.startsWith('233')) {
        // Convert 233244588584 -> 0244588584
        return '0' + cleanNumber.slice(3);
      } else if (cleanNumber.length === 10 && cleanNumber.startsWith('0')) {
        // Keep as is: 0244588584
        return cleanNumber;
      } else if (cleanNumber.length === 9) {
        // Convert 244588584 -> 0244588584
        return '0' + cleanNumber;
      } else if (cleanNumber.length === 13 && cleanNumber.startsWith('233')) {
        // Convert +233244588584 -> 0244588584
        return '0' + cleanNumber.slice(3);
      }
    }
    
    // For other countries or invalid formats, return as is
    return phoneNumber;
  }

  private async presentWaitingModal(): Promise<{ modal: HTMLIonModalElement; updateStatus: (message: string) => void }> {
    const modal = await this.modalController.create({
      component: 'ion-loading',
      componentProps: {
        message: 'Processing...',
        spinner: 'crescent'
      }
    });
    await modal.present();

    const updateStatus = (message: string) => {
      modal.componentProps = { ...modal.componentProps, message };
    };

    return { modal, updateStatus };
  }

  private resetForm() {
    this.airtimeForm.reset({
      autoDetect: true
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
    if (this.selectedCountry?.isoName !== this.GHANA_ISO && currentStepIndex > WizardStep.OPERATOR_SELECTION) {
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
          return 'Enter the phone number to recharge (network will be auto-detected)';
        }
        return 'Enter the phone number to recharge';
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