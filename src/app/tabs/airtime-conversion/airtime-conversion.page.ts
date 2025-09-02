import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { 
  AlertController, 
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonAlert,
  IonBackButton,
  IonButtons,
  IonBadge,
  IonSpinner
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { 
  repeatOutline,
  informationCircleOutline,
  checkmarkOutline,
  checkmarkCircle,
  flashOutline,
  starOutline,
  trendingUpOutline,
  timeOutline,
  cashOutline,
  cardOutline,
  checkmarkCircleOutline,
  shieldCheckmarkOutline,
  helpCircleOutline,
  cellularOutline,
  callOutline,
  swapHorizontalOutline,
  documentTextOutline,
  chevronBackOutline,
  chevronForwardOutline,
  chevronUpOutline,
  chevronDownOutline,
  calculatorOutline,
  personOutline,
  arrowBackOutline,
  walletOutline,
  closeCircleOutline,
  warningOutline,
  locationOutline,
  mailOutline,
  settingsOutline,
  refreshOutline,
  trendingDownOutline,
  giftOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline
} from 'ionicons/icons';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface WizardStep {
  title: string;
  subtitle: string;
  icon: string;
}

interface ConversionOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  rate: number; // Conversion rate (e.g., 0.8 means 80% of airtime value)
  minAmount: number;
  maxAmount: number;
  processingTime: string;
  fees: number;
  isPopular?: boolean;
  isRecommended?: boolean;
}

interface NetworkProvider {
  id: string;
  name: string;
  code: string;
  logo: string;
  isActive: boolean;
}

@Component({
  selector: 'app-airtime-conversion',
  templateUrl: './airtime-conversion.page.html',
  styleUrls: ['./airtime-conversion.page.scss'],
  standalone: true,
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms ease-in', style({ transform: 'translateX(0%)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ transform: 'translateX(-100%)', opacity: 0 }))
      ])
    ])
  ],
  imports: [
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonIcon,
    IonInput,
    IonLabel,
    IonAlert,
    IonBackButton,
    IonButtons,
    IonBadge,
    IonSpinner,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})

export class AirtimeConversionPage implements OnInit {
  // Step management
  activeStep: number = 0;
  stepCompletionStatus: boolean[] = [false, false, false, false];
  
  // Form data
  @ViewChild(IonContent) content!: IonContent;
  conversionForm: FormGroup;
  selectedProvider: string = '';
  phoneNumber: string = '';
  airtimeAmount: number = 0;
  selectedConversionOption: string = '';
  
  // UI state
  isLoading: boolean = false;
  isProcessing: boolean = false;
  
  // Conversion calculation
  processingFee: number = 0;
  totalAmount: number = 0;

  // Alert properties
  showInfoAlert: boolean = false;

  wizardSteps: WizardStep[] = [
    {
      title: 'Network Provider',
      subtitle: 'Choose your network',
      icon: 'cellular-outline'
    },
    {
      title: 'Airtime Details',
      subtitle: 'Enter phone & amount',
      icon: 'call-outline'
    },
    {
      title: 'Conversion Method',
      subtitle: 'Select how to convert',
      icon: 'swap-horizontal-outline'
    },
    {
      title: 'Review & Confirm',
      subtitle: 'Verify your details',
      icon: 'document-text-outline'
    }
  ];

  // Sample data for demonstration
  samplePhoneNumber: string = '0241234567';
  sampleAmount: number = 100;

  // Conversion options
  conversionOptions: ConversionOption[] = [
    {
      id: 'cash',
      name: 'Convert to Cash',
      description: 'Get cash directly to your wallet',
      icon: 'cash-outline',
      rate: 0.85,
      minAmount: 100,
      maxAmount: 50000,
      processingTime: '5-10 minutes',
      fees: 0,
      isPopular: true,
      isRecommended: true,
    },
    {
      id: 'wallet',
      name: 'Wallet Credit',
      description: 'Add funds to your digital wallet',
      icon: 'wallet-outline',
      rate: 0.90,
      minAmount: 50,
      maxAmount: 100000,
      processingTime: 'Instant',
      fees: 0,
      isPopular: true,
    },
    {
      id: 'bank-transfer',
      name: 'Bank Transfer',
      description: 'Transfer to your bank account',
      icon: 'card-outline',
      rate: 0.80,
      minAmount: 500,
      maxAmount: 500000,
      processingTime: '1-2 hours',
      fees: 50,
    },
    {
      id: 'data-bundle',
      name: 'Data Bundle',
      description: 'Convert to internet data bundle',
      icon: 'cellular-outline',
      rate: 0.95,
      minAmount: 100,
      maxAmount: 10000,
      processingTime: 'Instant',
      fees: 0,
    },
    {
      id: 'gift-card',
      name: 'Gift Card',
      description: 'Convert to various gift cards',
      icon: 'gift-outline',
      rate: 0.88,
      minAmount: 200,
      maxAmount: 25000,
      processingTime: '15-30 minutes',
      fees: 25,
    },
  ];

  // Network providers
  networkProviders: NetworkProvider[] = [
    { id: 'mtn', name: 'MTN', code: 'MTN', logo: 'assets/icons/mtn.png', isActive: true },
    { id: 'airtel', name: 'Airtel', code: 'AIRTEL', logo: 'assets/icons/airtel.png', isActive: true },
    { id: 'glo', name: 'Glo', code: 'GLO', logo: 'assets/icons/glo.png', isActive: true },
    { id: '9mobile', name: '9mobile', code: '9MOBILE', logo: 'assets/icons/9mobile.png', isActive: true },
  ];

  // Calculated values
  convertedAmount: number = 0;

  // Alert messages
  alertMessage: string = '';
  errorMessage: string = '';

  constructor(
    private router: Router,
    private translate: TranslateService,
    private formBuilder: FormBuilder,
    private alertController: AlertController
  ) {
    this.conversionForm = this.formBuilder.group({
      provider: ['', Validators.required],
      phoneNumber: ['', [Validators.required, Validators.pattern('^(0|\\+233|233)[0-9]{9}$')]],
      amount: ['', [Validators.required, Validators.min(1)]],
      conversionOption: ['', Validators.required]
    });
    addIcons({repeatOutline,informationCircleOutline,checkmarkOutline,flashOutline,starOutline,trendingUpOutline,timeOutline,cashOutline,cardOutline,checkmarkCircleOutline,shieldCheckmarkOutline,helpCircleOutline,cellularOutline,callOutline,swapHorizontalOutline,documentTextOutline,chevronBackOutline,chevronForwardOutline,chevronUpOutline,chevronDownOutline,calculatorOutline,personOutline,arrowBackOutline,walletOutline,closeCircleOutline,warningOutline,locationOutline,mailOutline,settingsOutline,refreshOutline,trendingDownOutline,giftOutline,lockClosedOutline,eyeOutline,eyeOffOutline,});
    this.translate.setDefaultLang('en');
    this.translate.use('en');
  }

  ngOnInit() {
    this.activeStep = 0;
    this.loadData();
    
    // Watch form changes
    this.conversionForm.get('amount')?.valueChanges.subscribe(() => {
      this.onAmountChange();
    });
    
    this.conversionForm.get('conversionOption')?.valueChanges.subscribe(() => {
      this.onConversionOptionChange();
    });
  }

  async loadData() {
    this.isLoading = true;
    try {
      // Simulate API call to load conversion rates and providers
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Set default values
      if (this.conversionOptions.length > 0) {
        this.selectedConversionOption = this.conversionOptions[0].id;
      }
      
      this.calculateConversion();
      
      // Ensure first step is expanded by default
      this.activeStep = 0;
    } catch (error) {
      console.error('❌ Error loading data:', error);
      this.showError('Failed to load conversion data. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }
  


  onProviderChange() {
    this.calculateConversion();
  }

  onAmountChange(): void {
    this.calculateConversion();
  }

  onConversionOptionChange() {
    this.calculateConversion();
  }

  calculateConversion(): void {
    if (this.airtimeAmount > 0 && this.selectedConversionOption) {
      const option = this.getSelectedOption();
      if (option) {
        this.processingFee = option.fees || 0;
        this.totalAmount = (this.airtimeAmount * option.rate) - this.processingFee;
        this.totalAmount = Math.max(0, this.totalAmount); // Ensure non-negative
      }
    }
  }

  validateForm(): boolean {
    // Mark all fields as touched to show validation messages
    Object.keys(this.conversionForm.controls).forEach(field => {
      const control = this.conversionForm.get(field);
      if (control) {
        control.markAsTouched({ onlySelf: true });
      }
    });

    if (!this.selectedProvider) {
      this.showError('Please select a network provider');
      this.scrollToTop();
      return false;
    }

    if (this.conversionForm.invalid) {
      const errors = [];
      
      if (this.conversionForm.get('phoneNumber')?.hasError('required')) {
        errors.push('Phone number is required');
      } else if (this.conversionForm.get('phoneNumber')?.hasError('pattern')) {
        errors.push('Please enter a valid Ghanaian phone number (e.g., 0241234567 or +233241234567)');
      }
      
      if (this.conversionForm.get('amount')?.hasError('required')) {
        errors.push('Amount is required');
      } else if (this.conversionForm.get('amount')?.hasError('min')) {
        errors.push('Amount must be greater than 0');
      }
      
      if (errors.length > 0) {
        this.showError(errors.join('\n'));
        this.scrollToTop();
        return false;
      }
    }

    const option = this.conversionOptions.find(opt => opt.id === this.selectedConversionOption);
    if (!option) {
      this.showError('Please select a conversion option');
      return false;
    }

    if (this.airtimeAmount < option.minAmount) {
      this.showError(`Minimum amount for ${option.name} is ₵${option.minAmount.toLocaleString()}`);
      return false;
    }

    if (this.airtimeAmount > option.maxAmount) {
      this.showError(`Maximum amount for ${option.name} is ₵${option.maxAmount.toLocaleString()}`);
      return false;
    }

    return true;
  }



  async confirmConversion() {
    this.isProcessing = true;

    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
      
      // Simulate API call with error handling
      const success = await this.simulateApiCall();
      
      if (success) {
        await this.showSuccessAlert('Airtime conversion successful!', 'Your funds will be available shortly.');
        this.resetForm();
        this.activeStep = 0; // Reset to first step
        this.scrollToTop();
      } else {
        throw new Error('Conversion failed');
      }
      
    } catch (error) {
      console.error('Conversion error:', error);
      await this.showErrorAlert('Conversion Failed', 'An error occurred while processing your request. Please try again.');
    } finally {
      this.isProcessing = false;
    }
  }
  
  private async simulateApiCall(): Promise<boolean> {
    // Simulate API call with 90% success rate for demo purposes
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(Math.random() < 0.9);
      }, 2000);
    });
  }
  
  private async showSuccessAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
  
  private async showErrorAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
  
  private scrollToTop() {
    if (this.content) {
      this.content.scrollToTop(500);
    }
  }
  


  resetForm() {
    this.phoneNumber = '';
    this.airtimeAmount = 0;
    this.calculateConversion();
  }

  getSelectedOption(): ConversionOption | undefined {
    return this.conversionOptions.find(opt => opt.id === this.selectedConversionOption);
  }



  async goBack() {
    await Haptics.impact({ style: ImpactStyle.Light });
    this.router.navigate(['/tabs/home']);
  }

  async showInfo() {
    await Haptics.impact({ style: ImpactStyle.Light });
    this.showInfoAlert = true;
  }

  formatCurrency(amount: number): string {
    return `₵${amount.toLocaleString()}`;
  }



  // Enhanced UI methods with validation


  getProviderColor(providerId: string): string {
    const colors: { [key: string]: string } = {
      'mtn': '#FFC107',      // MTN Yellow
      'airtel': '#E91E63',   // Airtel Pink
      'glo': '#4CAF50',      // Glo Green
      '9mobile': '#FF9800'   // 9mobile Orange
    };
    return colors[providerId] || '#2196F3';
  }

  getProviderInitials(providerName: string): string {
    if (providerName === '9mobile') return '9M';
    return providerName.substring(0, 2).toUpperCase();
  }

  // Step management methods
  toggleStep(stepIndex: number): void {
    // Can only access completed steps and the next available step
    if (stepIndex === 0 || this.isStepCompleted(stepIndex - 1) || stepIndex === this.getNextAvailableStep()) {
      if (this.activeStep === stepIndex) {
        // If clicking the same step, find another step to open instead
        const nextStep = this.getNextAvailableStep();
        this.activeStep = nextStep;
      } else {
        this.activeStep = stepIndex;
      }
    }
  }

  isStepCompleted(stepIndex: number): boolean {
    return this.stepCompletionStatus[stepIndex] || false;
  }

  validateStep(stepIndex: number): void {
    let isValid = false;
    
    switch (stepIndex) {
      case 0: // Network Provider
        isValid = !!this.selectedProvider;
        break;
      case 1: // Airtime Details
        isValid = !!this.phoneNumber && this.airtimeAmount > 0;
        break;
      case 2: // Conversion Method
        isValid = !!this.selectedConversionOption;
        break;
      case 3: // Review & Confirm
        isValid = this.canConfirmConversion();
        break;
    }
    
    if (isValid) {
      this.stepCompletionStatus[stepIndex] = true;
      // Auto-advance to next step if available
      if (stepIndex < this.stepCompletionStatus.length - 1) {
        this.activeStep = stepIndex + 1;
      }
    }
  }

  getNextAvailableStep(): number {
    for (let i = 0; i < this.stepCompletionStatus.length; i++) {
      if (!this.stepCompletionStatus[i]) {
        return i;
      }
    }
    return this.stepCompletionStatus.length - 1;
  }

  canConfirmConversion(): boolean {
    return !!(this.selectedProvider && 
           this.phoneNumber && 
           this.airtimeAmount > 0 && 
           this.selectedConversionOption);
  }

  // Helper methods for wizard
  getProviderName(): string {
    const provider = this.networkProviders.find(p => p.id === this.selectedProvider);
    return provider ? provider.name : 'Not selected';
  }

  getSelectedOptionName(): string {
    const option = this.conversionOptions.find(o => o.id === this.selectedConversionOption);
    return option ? option.name : 'Not selected';
  }

  // TrackBy function for performance
  trackByProvider(index: number, provider: NetworkProvider): string {
    return provider.id;
  }

  // Form control getters for type safety
  get phoneNumberControl() {
    return this.conversionForm.get('phoneNumber') as FormControl;
  }

  get amountControl() {
    return this.conversionForm.get('amount') as FormControl;
  }

  // Missing methods that are referenced in HTML
  selectProvider(providerId: string): void {
    this.selectedProvider = providerId;
    this.validateStep(0);
  }

  selectConversionOption(optionId: string): void {
    this.selectedConversionOption = optionId;
    this.validateStep(2);
  }

  getRatePercentage(rate: number): string {
    return `${(rate * 100).toFixed(0)}%`;
  }

  fillSampleData(): void {
    this.phoneNumber = this.samplePhoneNumber;
    this.airtimeAmount = this.sampleAmount;
    this.onAmountChange();
  }

  processConversion(): void {
    if (this.canConfirmConversion()) {
      this.isProcessing = true;
      // Simulate processing
      setTimeout(() => {
        this.isProcessing = false;
        this.showSuccess('Conversion successful!');
      }, 2000);
    }
  }

  showSuccess(message: string): void {
    this.alertMessage = message;
    console.log('✅ Success:', message);
  }

  showError(message: string): void {
    this.errorMessage = message;
    console.log('❌ Error:', message);
  }

  scrollToStep(stepIndex: number): void {
    // Scroll to the specified step
    setTimeout(() => {
      if (this.content) {
        this.content.scrollToTop(500);
      }
    }, 100);
  }
} 