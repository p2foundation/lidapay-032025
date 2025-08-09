import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonItem,
  IonLabel,
  IonTextarea,
  IonAlert,
  IonLoading,
  IonToast,
  IonBackButton,
  IonButtons,
  IonList,
  IonListHeader,
  IonBadge,
  IonChip,
  IonGrid,
  IonRow,
  IonCol,
  IonProgressBar,
  IonSpinner,
  IonRippleEffect,
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  repeatOutline,
  cashOutline,
  cellularOutline,
  walletOutline,
  cardOutline,
  calculatorOutline,
  informationCircleOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  warningOutline,
  timeOutline,
  locationOutline,
  personOutline,
  callOutline,
  mailOutline,
  helpCircleOutline,
  settingsOutline,
  refreshOutline,
  swapHorizontalOutline,
  trendingUpOutline,
  trendingDownOutline,
  starOutline,
  giftOutline,
  shieldCheckmarkOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
} from 'ionicons/icons';

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
  imports: [
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonIcon,
    IonCard,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonItem,
    IonLabel,
    IonTextarea,
    IonAlert,
    IonBackButton,
    IonButtons,
    IonBadge,
    IonSpinner,
    CommonModule,
    FormsModule,
    TranslateModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AirtimeConversionPage implements OnInit {
  isLoading: boolean = false;
  isProcessing: boolean = false;
  showSuccessAlert: boolean = false;
  showErrorAlert: boolean = false;
  showConfirmAlert: boolean = false;
  showInfoAlert: boolean = false;

  // Form data
  selectedProvider: string = '';
  phoneNumber: string = '';
  airtimeAmount: number = 0;
  selectedConversionOption: string = '';
  recipientPhoneNumber: string = '';
  recipientName: string = '';
  notes: string = '';

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
  processingFee: number = 0;
  totalAmount: number = 0;

  // Alert messages
  alertMessage: string = '';
  errorMessage: string = '';

  constructor(
    private router: Router,
    private translate: TranslateService
  ) {
    addIcons({
      arrowBackOutline,
      repeatOutline,
      cashOutline,
      cellularOutline,
      walletOutline,
      cardOutline,
      calculatorOutline,
      informationCircleOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      warningOutline,
      timeOutline,
      locationOutline,
      personOutline,
      callOutline,
      mailOutline,
      helpCircleOutline,
      settingsOutline,
      refreshOutline,
      swapHorizontalOutline,
      trendingUpOutline,
      trendingDownOutline,
      starOutline,
      giftOutline,
      shieldCheckmarkOutline,
      lockClosedOutline,
      eyeOutline,
      eyeOffOutline,
    });
    this.translate.setDefaultLang('en');
    this.translate.use('en');
  }

  ngOnInit() {
    this.loadData();
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
      if (this.networkProviders.length > 0) {
        this.selectedProvider = this.networkProviders[0].id;
      }
      
      this.calculateConversion();
    } catch (error) {
      console.error('Error loading data:', error);
      this.showError('Failed to load conversion data. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  onProviderChange() {
    this.calculateConversion();
  }

  onAmountChange() {
    this.calculateConversion();
  }

  onConversionOptionChange() {
    this.calculateConversion();
  }

  calculateConversion() {
    if (!this.selectedConversionOption || !this.airtimeAmount) {
      this.convertedAmount = 0;
      this.processingFee = 0;
      this.totalAmount = 0;
      return;
    }

    const option = this.conversionOptions.find(opt => opt.id === this.selectedConversionOption);
    if (!option) return;

    // Calculate converted amount
    this.convertedAmount = this.airtimeAmount * option.rate;
    
    // Calculate processing fee
    this.processingFee = option.fees;
    
    // Calculate total amount (converted amount - fees)
    this.totalAmount = Math.max(0, this.convertedAmount - this.processingFee);
  }

  validateForm(): boolean {
    if (!this.selectedProvider) {
      this.showError('Please select a network provider');
      return false;
    }

    if (!this.phoneNumber || this.phoneNumber.length < 10) {
      this.showError('Please enter a valid phone number');
      return false;
    }

    if (!this.airtimeAmount || this.airtimeAmount <= 0) {
      this.showError('Please enter a valid airtime amount');
      return false;
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

  async processConversion() {
    if (!this.validateForm()) return;

    await Haptics.impact({ style: ImpactStyle.Medium });
    
            this.alertMessage = `Are you sure you want to convert ₵${this.airtimeAmount.toLocaleString()} airtime to ${this.getSelectedOptionName()}?`;
    this.showConfirmAlert = true;
  }

  async confirmConversion() {
    this.showConfirmAlert = false;
    this.isProcessing = true;

    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simulate success
      this.showSuccess('Airtime conversion successful! Your funds will be available shortly.');
      
      // Reset form
      this.resetForm();
      
    } catch (error) {
      console.error('Conversion error:', error);
      this.showError('Conversion failed. Please try again.');
    } finally {
      this.isProcessing = false;
    }
  }

  getConfirmButtons() {
    return [
      {
        text: 'Cancel',
        role: 'cancel'
      },
      {
        text: 'Confirm',
        handler: () => {
          this.confirmConversion();
        }
      }
    ];
  }

  resetForm() {
    this.phoneNumber = '';
    this.airtimeAmount = 0;
    this.recipientPhoneNumber = '';
    this.recipientName = '';
    this.notes = '';
    this.calculateConversion();
  }

  getSelectedOptionName(): string {
    const option = this.conversionOptions.find(opt => opt.id === this.selectedConversionOption);
    return option ? option.name : '';
  }

  getSelectedOption(): ConversionOption | undefined {
    return this.conversionOptions.find(opt => opt.id === this.selectedConversionOption);
  }

  getProviderName(): string {
    const provider = this.networkProviders.find(prov => prov.id === this.selectedProvider);
    return provider ? provider.name : '';
  }

  showSuccess(message: string) {
    this.alertMessage = message;
    this.showSuccessAlert = true;
  }

  showError(message: string) {
    this.errorMessage = message;
    this.showErrorAlert = true;
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

  getRatePercentage(rate: number): string {
    return `${(rate * 100).toFixed(0)}%`;
  }
} 