import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
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
} from '@ionic/angular/standalone';

import { EnhancedAirtimeService, Country, Operator } from '../../services/enhanced-airtime.service';
import { NotificationService } from '../../services/notification.service';
import { AccountService } from '../../services/auth/account.service';
import { AdvansisPayService } from '../../services/payments/advansis-pay.service';
import { StorageService } from '../../services/storage.service';
import { UtilsService } from '../../services/utils.service';
import { ReloadlyService } from '../../services/reloadly.service';
import { InternetDataService } from '../../services/one4all/internet.data.service';
import { Profile } from '../../interfaces/profile.interface';

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

  // UI States
  isLoading = false;
  isDetectingOperator = false;
  showOperatorModal = false;
  isProcessing = false;
  searchQuery = '';
  filteredCountries: Country[] = [];

  // Payment and transaction properties
  private readonly GHANA_ISO = 'GH';
  internetDataParams: any = {};

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
    private internetDataService: InternetDataService
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
    this.loadUserProfile();
    this.loadCountries();
    this.setupFormListeners();
    this.filteredCountries = this.countries; // Initialize filtered countries
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Navigation methods
  nextStep() {
    if (this.currentStep < WizardStep.PROCESSING) {
      this.currentStep++;
    }
  }

  previousStep() {
    if (this.currentStep > WizardStep.COUNTRY_SELECTION) {
      this.currentStep--;
    }
  }

  goToStep(step: WizardStep) {
    this.currentStep = step;
  }

  // Form setup and listeners
  private setupFormListeners() {
    // Listen to phone number changes for auto-detection
    this.internetDataForm
      .get('recipientNumber')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((phoneNumber) => {
        if (phoneNumber && this.internetDataForm.get('autoDetect')?.value) {
          this.autoDetectOperator(phoneNumber);
        }
      });
  }

  // Data loading methods
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
    this.enhancedAirtimeService.getCountries().subscribe({
      next: (countries) => {
        this.countries = countries;
        this.filteredCountries = countries; // Initialize filtered countries
        console.log('[Enhanced Internet Data] Countries loaded:', countries.length);
        console.log('[Enhanced Internet Data] First few countries:', countries.slice(0, 5));
        console.log('[Enhanced Internet Data] Ghana found:', countries.find(c => c.isoName === this.GHANA_ISO));
        // Don't auto-select Ghana - let user choose
        // const ghana = countries.find(c => c.isoName === this.GHANA_ISO);
        // if (ghana) {
        //   this.selectCountry(ghana);
        // }
      },
      error: (error) => {
        console.error('Error loading countries:', error);
        this.notificationService.showError('Failed to load countries');
      }
    });
  }

  private loadOperators(countryIso: string) {
    this.enhancedAirtimeService.getOperators(countryIso).subscribe({
      next: (operators) => {
        this.operators = operators;
      },
      error: (error) => {
        console.error('Error loading operators:', error);
        this.notificationService.showError('Failed to load operators');
      }
    });
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

  // Selection methods
  selectCountry(country: Country) {
    console.log('[Enhanced Internet Data] Country selected:', country);
    this.selectedCountry = country;
    this.internetDataForm.patchValue({ countryIso: country.isoName });

    // Clear any previous operator selection
    this.selectedOperator = null;
    this.detectedOperator = null;
    this.internetDataForm.patchValue({ operatorId: '' });

    // Load operators only for Ghana
    if (country.isoName === this.GHANA_ISO) {
      console.log('[Enhanced Internet Data] Loading Ghana operators...');
      this.loadOperators(country.isoName);
    } else {
      // For non-Ghanaian countries, clear operators array
      console.log('[Enhanced Internet Data] Clearing operators for international country');
      this.operators = [];
    }

    console.log('[Enhanced Internet Data] Moving to next step, current step:', this.currentStep);
    this.nextStep();
    console.log('[Enhanced Internet Data] New step:', this.currentStep);
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
    this.internetDataForm.patchValue({
      dataBundleId: bundle.plan_id
    });
    this.nextStep();
  }

  // Phone number handling
  onPhoneNumberInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const phoneNumber = target?.value || '';
    
    if (this.selectedCountry) {
      // Format phone number based on country
      let formatted: string;
      if (this.selectedCountry.isoName === this.GHANA_ISO) {
        formatted = this.formatPhoneNumberForGhana(phoneNumber);
      } else {
        formatted = this.formatPhoneNumberForInternational(phoneNumber, this.selectedCountry.isoName);
      }
      
      this.internetDataForm.patchValue({ recipientNumber: formatted });
      
      // Auto-detect operator for non-Ghanaian countries when phone number is entered
      if (this.selectedCountry.isoName !== this.GHANA_ISO && formatted.length >= 7) {
        this.autoDetectOperator(formatted);
      }
    }
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
    if (!this.selectedCountry) return;

    this.isDetectingOperator = true;
    try {
      const params = {
        phone: phoneNumber,
        countryIsoCode: this.selectedCountry.isoName
      };
      
      const result = await this.detectOperator(params);
      if (result && result.operator) {
        this.detectedOperator = result.operator;
        this.internetDataForm.patchValue({
          operatorId: result.operator.id
        });
        this.notificationService.showSuccess(`Detected: ${result.operator.name}`);
      }
    } catch (error) {
      console.error('Error detecting operator:', error);
    } finally {
      this.isDetectingOperator = false;
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

  // Validation
  canProceed(): boolean {
    switch (this.currentStep) {
      case WizardStep.COUNTRY_SELECTION:
        return !!this.selectedCountry;
      case WizardStep.OPERATOR_SELECTION:
        return !!this.selectedOperator || !!this.detectedOperator;
      case WizardStep.PHONE_NUMBER:
        return this.internetDataForm.get('recipientNumber')?.valid || false;
      case WizardStep.DATA_BUNDLE_SELECTION:
        return !!this.selectedBundle;
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
        window.open(paymentResult.data.checkoutUrl, '_system');
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
      // For international data, we'll use a similar flow but with different parameters
      const bundlePrice = parseFloat(this.selectedBundle?.price || '0');
      
      const params = {
        recipientNumber: formData.recipientNumber,
        dataCode: this.selectedBundle?.plan_id || '',
        operatorId: formData.operatorId,
        amount: bundlePrice,
        description: `International Data Bundle: ${this.selectedBundle?.volume} - ${this.selectedBundle?.validity}`,
        transType: 'INTERNATIONALDATA',
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
        window.open(paymentResult.data.checkoutUrl, '_system');
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
    const query = event.target.value.toLowerCase();
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
        return 'Enter the phone number for the data bundle';
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

  // Helper method to format bundle price for display
  formatBundlePrice(price: string): string {
    const numPrice = parseFloat(price);
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2
    }).format(numPrice);
  }
}