import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
  LoadingController,
  ToastController,
  AlertController,
  ModalController,
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { Subject, takeUntil, firstValueFrom, debounceTime, distinctUntilChanged } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { EnhancedAirtimeService, Country, Operator, AirtimeRequest } from '../../services/enhanced-airtime.service';
import { NotificationService } from '../../services/notification.service';
import { AccountService } from '../../services/auth/account.service';
import { AdvansisPayService } from '../../services/payments/advansis-pay.service';
import { StorageService } from '../../services/storage.service';
import { UtilsService } from '../../services/utils.service';
import { ReloadlyService } from '../../services/reloadly/reloadly.service';
import { Profile } from '../../interfaces/profile.interface';
import { WaitingModalComponent } from '../../components/waiting-modal/waiting-modal.component';
import { addIcons } from 'ionicons';
import {
  arrowBack,
  arrowForward,
  checkmark,
  close,
  cellularOutline,
  globeOutline,
  locationOutline,
  cardOutline,
  timeOutline,
  informationCircleOutline,
  chevronForward,
  chevronBack, callOutline, checkmarkCircle, alertCircleOutline, refreshOutline, searchOutline, closeCircle } from 'ionicons/icons';

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
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
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
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController,
    private translate: TranslateService,
    private accountService: AccountService,
    private advansisPayService: AdvansisPayService,
    private storage: StorageService,
    private utilService: UtilsService,
    private reloadlyService: ReloadlyService,
    private modalController: ModalController
  ) {
    addIcons({globeOutline,searchOutline,closeCircle,checkmark,alertCircleOutline,refreshOutline,cellularOutline,callOutline,checkmarkCircle,cardOutline,informationCircleOutline,chevronBack,chevronForward,arrowBack,arrowForward,close,locationOutline,timeOutline,});
    
    this.initializeForm();
  }

  ngOnInit() {
    this.loadUserProfile();
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
    try {
      const response = await firstValueFrom(this.accountService.getProfile());
      if (response) {
        this.userProfile = response;
      }
    } catch (error) {
      // Profile loading failed - continue with default values
    }
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
      this.countries = await firstValueFrom(this.enhancedAirtimeService.getCountries());
      // Countries loaded successfully
      if (this.countries.length > 0) {
        // Don't auto-select any country, let user choose
        this.filteredCountries = [...this.countries];
      }
    } catch (error) {
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
    if (this.canProceedToNextStep()) {
      this.currentStep++;
      
      // For non-Ghanaian countries, skip network selection step
      if (this.currentStep === PurchaseStep.NETWORK_SELECTION && 
          this.selectedCountry?.isoName !== this.GHANA_ISO) {
        this.currentStep = PurchaseStep.RECIPIENT_NUMBER;
      }
    }
  }

  previousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      
      // For non-Ghanaian countries, skip network selection step when going back
      if (this.currentStep === PurchaseStep.NETWORK_SELECTION && 
          this.selectedCountry?.isoName !== this.GHANA_ISO) {
        this.currentStep = PurchaseStep.COUNTRY_SELECTION;
      }
    }
  }

  goToStep(step: PurchaseStep) {
    if (step <= this.currentStep) {
      this.currentStep = step;
    }
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

  getOperatorImage(operator: Operator): string {
    // Use the operator's logo property directly since it's already correctly set in the service
    return operator.logo || 'assets/imgs/operators/mtn.png';
  }

  private async presentWaitingModal(): Promise<ModalResult> {
    const modal = await this.modalController.create({
      component: WaitingModalComponent,
      cssClass: 'waiting-modal',
      backdropDismiss: false
    });
    await modal.present();
    
    const updateStatus = (message: string) => {
      // Update modal content if needed
    };
    
    return { modal, updateStatus };
  }

  private formatAmount(amount: number): number {
    return Number(amount.toFixed(2));
  }

  private async processGhanaAirtime(formData: AirtimeFormData) {
    console.log('=== PROCESS GHANA AIRTIME ===');
    console.log('Form data received:', formData);
    
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
      window.open(response.data.checkoutUrl, '_system');

      // Reset form and go back to first step
      this.currentStep = PurchaseStep.COUNTRY_SELECTION;
      this.notificationService.showSuccess('Payment initiated successfully');

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
      this.notificationService.showError(errorMessage);
      this.currentStep = PurchaseStep.TRANSACTION_SUMMARY;
    } finally {
      if (modalResult.modal) {
        await modalResult.modal.dismiss();
      }
    }
  }

  private async processInternationalAirtime(formData: AirtimeFormData) {
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
        await modalResult.modal.dismiss();
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
      if (modalResult.modal) {
        await modalResult.modal.dismiss();
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
} 