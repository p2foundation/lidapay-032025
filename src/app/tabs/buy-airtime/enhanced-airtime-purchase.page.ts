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
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { Subject, takeUntil, firstValueFrom } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { EnhancedAirtimeService, Country, Operator, AirtimeRequest } from '../../services/enhanced-airtime.service';
import { NotificationService } from '../../services/notification.service';
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
  
  // Search
  searchTerm: string = '';
  
  // Amount selection
  quickAmounts = [5, 10, 20, 50, 100, 200];
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
    private translate: TranslateService
  ) {
    addIcons({globeOutline,searchOutline,closeCircle,checkmark,alertCircleOutline,refreshOutline,cellularOutline,callOutline,checkmarkCircle,cardOutline,informationCircleOutline,chevronBack,chevronForward,arrowBack,arrowForward,close,locationOutline,timeOutline,});
    
    this.initializeForm();
  }

  ngOnInit() {
    this.loadCountries();
    this.setupFormListeners();
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

  async loadCountries() {
    this.isLoadingCountries = true;
    try {
      this.countries = await firstValueFrom(this.enhancedAirtimeService.getCountries());
      console.log('Countries loaded:', this.countries.length, this.countries);
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
    console.log('onCountryChange called with:', countryIso);
    this.selectedCountry = this.countries.find(c => c.isoName === countryIso) || null;
    console.log('Selected country:', this.selectedCountry);
    
    // Update form value
    this.airtimeForm.patchValue({ countryIso: countryIso });
    
    // Clear any previous operator selection
    this.selectedOperator = null;
    this.detectedOperator = null;
    this.airtimeForm.patchValue({ operatorId: '' });
    
    // Load operators only for Ghana
    if (this.selectedCountry && countryIso === this.GHANA_ISO) {
      await this.loadOperators(countryIso);
    } else {
      // For non-Ghanaian countries, clear operators array
      this.operators = [];
    }
  }

  async loadOperators(countryIso: string) {
    console.log('loadOperators called with:', countryIso);
    // For non-Ghanaian countries, skip operator loading since we'll use auto-detection
    if (countryIso !== this.GHANA_ISO) {
      console.log('Skipping operator loading for non-Ghanaian country:', countryIso);
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
    
    console.log('Starting auto-detection for:', this.selectedCountry.name, 'phone:', phoneNumber);
    this.isDetectingOperator = true;
    
    try {
      this.detectedOperator = await firstValueFrom(
        this.enhancedAirtimeService.autoDetectOperator(phoneNumber, this.selectedCountry.isoName)
      );
      
      if (this.detectedOperator) {
        console.log('Auto-detection successful:', this.detectedOperator);
        this.airtimeForm.patchValue({ operatorId: this.detectedOperator.id });
        this.selectedOperator = this.detectedOperator;
        
        // For non-Ghanaian countries, show a notification that operator was detected
        if (this.selectedCountry.isoName !== this.GHANA_ISO) {
          this.notificationService.showSuccess(`Network detected: ${this.detectedOperator.name}`);
        }
      }
    } catch (error) {
      console.error('Auto-detection failed:', error);
      // For non-Ghanaian countries, show a warning but don't block the flow
      if (this.selectedCountry.isoName !== this.GHANA_ISO) {
        this.notificationService.showWarn('Could not auto-detect network. Please ensure the phone number is correct.');
      }
    } finally {
      this.isDetectingOperator = false;
    }
  }

  onOperatorSelect(operator: Operator) {
    this.selectedOperator = operator;
    this.airtimeForm.patchValue({ operatorId: operator.id });
  }

  onPhoneNumberInput(event: any) {
    const phoneNumber = event.target.value;
    if (this.selectedCountry) {
      const formatted = this.enhancedAirtimeService.formatPhoneNumber(phoneNumber, this.selectedCountry.isoName);
      this.airtimeForm.patchValue({ recipientNumber: formatted });
      
      // Auto-detect operator for non-Ghanaian countries when phone number is entered
      if (this.selectedCountry.isoName !== this.GHANA_ISO && formatted.length >= 7) {
        console.log('Auto-detecting operator for:', this.selectedCountry.name, 'with phone:', formatted);
        this.autoDetectOperator(formatted);
      }
    }
  }

  selectAmount(amount: number) {
    this.selectedAmount = amount;
    this.airtimeForm.patchValue({ amount: amount });
    this.showCustomAmount = false;
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
        return this.airtimeForm.get('recipientNumber')?.valid || false;
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
    if (!this.airtimeForm.valid) {
      this.notificationService.showError('Please fill in all required fields');
      return;
    }

    const formValue = this.airtimeForm.value;
    
    // For non-Ghanaian countries, ensure we have a detected operator
    if (this.selectedCountry?.isoName !== this.GHANA_ISO && !this.detectedOperator) {
      this.notificationService.showError('Please ensure the phone number is correct for network detection');
      return;
    }
    
    const request: AirtimeRequest = {
      countryIso: formValue.countryIso,
      operatorId: formValue.operatorId || this.detectedOperator?.id,
      recipientNumber: formValue.recipientNumber,
      amount: formValue.amount
    };

    this.currentStep = PurchaseStep.PROCESSING;
    this.isProcessing = true;

    try {
      const response = await firstValueFrom(this.enhancedAirtimeService.submitAirtime(request));
      
      // Show success message
      const alert = await this.alertController.create({
        header: 'Success!',
        message: `Airtime purchase successful! Transaction ID: ${response.transactionId}`,
        buttons: [
          {
            text: 'OK',
            handler: () => {
              this.router.navigate(['/tabs/home']);
            }
          }
        ]
      });
      await alert.present();
      
    } catch (error) {
      console.error('Purchase error:', error);
      this.notificationService.showError('Purchase failed. Please try again.');
      this.currentStep = PurchaseStep.TRANSACTION_SUMMARY;
    } finally {
      this.isProcessing = false;
    }
  }

  getOperatorImage(operator: Operator): string {
    const operatorName = operator.name.toLowerCase();
    const imageMap: { [key: string]: string } = {
      'mtn': 'assets/imgs/operators/mtn.png',
      'vodafone': 'assets/imgs/operators/vodafone.png',
      'airteltigo': 'assets/imgs/operators/airteltigo.png',
      'glo': 'assets/imgs/operators/glo.png',
      'busy': 'assets/imgs/operators/busy.png',
      'surfline': 'assets/imgs/operators/surfline.png',
      'telecel': 'assets/imgs/operators/telecel.png'
    };
    
    return imageMap[operatorName] || 'assets/imgs/operators/default.png';
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