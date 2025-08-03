import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonBackButton,
  IonButtons,
  IonButton,
  IonIcon,
  IonInput,
  IonLabel,
  IonItem,
  IonCard,
  IonChip,
  IonBadge,
  IonSpinner,
  IonNote,
  IonList,
  IonRadioGroup,
  IonRadio,
  IonCheckbox,
  IonTextarea,
  IonModal,
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  arrowBack,
  arrowForward,
  checkmark,
  close,
  swapHorizontalOutline,
  globeOutline,
  homeOutline,
  cardOutline,
  walletOutline,
  businessOutline,
  personOutline,
  callOutline,
  mailOutline,
  locationOutline,
  timeOutline,
  informationCircleOutline,
  chevronForward,
  chevronBack,
  checkmarkCircle,
  alertCircleOutline,
  refreshOutline,
  searchOutline,
  closeCircle,
  addOutline,
  removeOutline,
  calculatorOutline,
  shieldCheckmarkOutline,
  speedometerOutline,
  trendingUpOutline,
  cashOutline,
  phonePortraitOutline,
} from 'ionicons/icons';

enum TransferStep {
  TRANSFER_TYPE = 0,
  RECIPIENT_INFO = 1,
  AMOUNT_CURRENCY = 2,
  PAYMENT_METHOD = 3,
  CONFIRMATION = 4,
  PROCESSING = 5
}

interface TransferType {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
  features: string[];
}

interface Bank {
  id: string;
  name: string;
  code: string;
  logo: string;
  country: string;
}

interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  exchangeRate: number;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  description: string;
  processingTime: string;
  fees: string;
}

@Component({
  selector: 'app-remitstar',
  templateUrl: './remitstar.page.html',
  styleUrls: ['./remitstar.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonBackButton,
    IonButtons,
    IonButton,
    IonIcon,
    IonInput,
    IonLabel,
    IonItem,
    IonCard,
    IonChip,
    IonBadge,
    IonSpinner,
    IonNote,
    IonList,
    IonRadioGroup,
    IonRadio,
    IonCheckbox,
    IonTextarea,
    IonModal,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class RemitstarPage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Step management
  currentStep = TransferStep.TRANSFER_TYPE;
  TransferStep = TransferStep;
  
  // Form
  transferForm!: FormGroup;
  
  // Data
  transferTypes: TransferType[] = [
    {
      id: 'domestic',
      title: 'Domestic Transfer',
      description: 'Send money within Ghana',
      icon: 'home-outline',
      color: 'primary',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      features: ['Instant Transfer', 'Low Fees', '24/7 Service', 'Secure']
    },
    {
      id: 'international',
      title: 'International Transfer',
      description: 'Send money worldwide',
      icon: 'globe-outline',
      color: 'secondary',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      features: ['Global Coverage', 'Competitive Rates', 'Fast Delivery', 'Trackable']
    }
  ];
  
  banks: Bank[] = [
    { id: '1', name: 'Ghana Commercial Bank', code: 'GCB', logo: 'assets/imgs/banks/gcb.png', country: 'GH' },
    { id: '2', name: 'Ecobank Ghana', code: 'ECO', logo: 'assets/imgs/banks/ecobank.png', country: 'GH' },
    { id: '3', name: 'Standard Chartered Bank', code: 'SCB', logo: 'assets/imgs/banks/standard-chartered.png', country: 'GH' },
    { id: '4', name: 'Barclays Bank Ghana', code: 'BBG', logo: 'assets/imgs/banks/barclays.png', country: 'GH' },
    { id: '5', name: 'Zenith Bank Ghana', code: 'ZBG', logo: 'assets/imgs/banks/zenith.png', country: 'GH' },
    { id: '6', name: 'Access Bank Ghana', code: 'ABG', logo: 'assets/imgs/banks/access.png', country: 'GH' },
    { id: '7', name: 'Fidelity Bank Ghana', code: 'FBG', logo: 'assets/imgs/banks/fidelity.png', country: 'GH' },
    { id: '8', name: 'Cal Bank', code: 'CAL', logo: 'assets/imgs/banks/cal.png', country: 'GH' }
  ];
  
  currencies: Currency[] = [
    { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', flag: '🇬🇭', exchangeRate: 1 },
    { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', exchangeRate: 0.12 },
    { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', exchangeRate: 0.11 },
    { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', exchangeRate: 0.095 },
    { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬', exchangeRate: 18.5 },
    { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', flag: '🇰🇪', exchangeRate: 15.2 }
  ];
  
  paymentMethods: PaymentMethod[] = [
    {
      id: 'mobile_money',
      name: 'Mobile Money',
      icon: 'phone-portrait-outline',
      description: 'Pay with MTN, Vodafone, or AirtelTigo',
      processingTime: 'Instant',
      fees: '1.5%'
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      icon: 'bank-outline',
      description: 'Direct bank transfer',
      processingTime: '1-2 hours',
      fees: '2%'
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: 'card-outline',
      description: 'Visa, Mastercard, or local cards',
      processingTime: 'Instant',
      fees: '2.5%'
    },
    {
      id: 'wallet',
      name: 'Digital Wallet',
      icon: 'wallet-outline',
      description: 'Pay from your digital wallet',
      processingTime: 'Instant',
      fees: '1%'
    }
  ];
  
  selectedTransferType: TransferType | null = null;
  selectedBank: Bank | null = null;
  selectedCurrency: Currency | null = null;
  selectedPaymentMethod: PaymentMethod | null = null;
  
  // UI States
  isLoading = false;
  isProcessing = false;
  showBankModal = false;
  showCurrencyModal = false;
  
  // Quick amounts
  quickAmounts = [50, 100, 200, 500, 1000, 2000];
  selectedAmount: number | null = null;
  showCustomAmount = false;

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private translate: TranslateService
  ) {
          addIcons({
        swapHorizontalOutline,
        chevronForward,
        personOutline,
        calculatorOutline,
        cardOutline,
        timeOutline,
        shieldCheckmarkOutline,
        chevronBack,
        checkmark,
        close,
        arrowBack,
        arrowForward,
        globeOutline,
        homeOutline,
        walletOutline,
        businessOutline,
        callOutline,
        mailOutline,
        locationOutline,
        informationCircleOutline,
        checkmarkCircle,
        alertCircleOutline,
        refreshOutline,
        searchOutline,
        closeCircle,
        addOutline,
        removeOutline,
        speedometerOutline,
        trendingUpOutline,
        cashOutline,
        phonePortraitOutline,
      });
  }

  ngOnInit() {
    this.initializeForm();
    this.setupFormListeners();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm() {
    this.transferForm = this.formBuilder.group({
      transferType: ['', Validators.required],
      recipientName: ['', [Validators.required, Validators.minLength(2)]],
      recipientPhone: ['', [Validators.required, Validators.pattern(/^(\+233|0)[0-9]{9}$/)]],
      recipientEmail: ['', [Validators.email]],
      recipientBank: ['', Validators.required],
      accountNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10,16}$/)]],
      accountName: ['', [Validators.required, Validators.minLength(2)]],
      amount: ['', [Validators.required, Validators.min(1)]],
      currency: ['GHS', Validators.required],
      paymentMethod: ['', Validators.required],
      purpose: ['', Validators.required],
      termsAccepted: [false, Validators.requiredTrue]
    });
  }

  private setupFormListeners() {
    // Listen to transfer type changes
    this.transferForm.get('transferType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(type => {
        if (type) {
          this.selectedTransferType = this.transferTypes.find(t => t.id === type) || null;
        }
      });

    // Listen to currency changes
    this.transferForm.get('currency')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(currency => {
        if (currency) {
          this.selectedCurrency = this.currencies.find(c => c.code === currency) || null;
        }
      });

    // Listen to payment method changes
    this.transferForm.get('paymentMethod')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(method => {
        if (method) {
          this.selectedPaymentMethod = this.paymentMethods.find(p => p.id === method) || null;
        }
      });
  }

  selectTransferType(type: TransferType) {
    this.selectedTransferType = type;
    this.transferForm.patchValue({ transferType: type.id });
    this.nextStep();
  }

  selectAmount(amount: number) {
    this.selectedAmount = amount;
    this.transferForm.patchValue({ amount });
    this.showCustomAmount = false;
  }

  showCustomAmountInput() {
    this.showCustomAmount = true;
    this.selectedAmount = null;
    this.transferForm.patchValue({ amount: '' });
  }

  openBankModal() {
    this.showBankModal = true;
  }

  closeBankModal() {
    this.showBankModal = false;
  }

  selectBank(bank: Bank) {
    this.selectedBank = bank;
    this.transferForm.patchValue({ 
      recipientBank: bank.id,
      accountName: this.transferForm.get('recipientName')?.value || ''
    });
    this.closeBankModal();
  }

  openCurrencyModal() {
    this.showCurrencyModal = true;
  }

  closeCurrencyModal() {
    this.showCurrencyModal = false;
  }

  selectCurrency(currency: Currency) {
    this.selectedCurrency = currency;
    this.transferForm.patchValue({ currency: currency.code });
    this.closeCurrencyModal();
  }

  nextStep() {
    if (this.currentStep < TransferStep.CONFIRMATION) {
      this.currentStep++;
    }
  }

  previousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  goToStep(step: TransferStep) {
    this.currentStep = step;
  }

  canProceedToNextStep(): boolean {
    switch (this.currentStep) {
      case TransferStep.TRANSFER_TYPE:
        return !!this.selectedTransferType;
      case TransferStep.RECIPIENT_INFO:
        return !!(this.transferForm.get('recipientName')?.valid && 
               this.transferForm.get('recipientPhone')?.valid &&
               this.transferForm.get('recipientBank')?.valid &&
               this.transferForm.get('accountNumber')?.valid &&
               this.transferForm.get('accountName')?.valid);
      case TransferStep.AMOUNT_CURRENCY:
        return !!(this.transferForm.get('amount')?.valid && 
               this.transferForm.get('currency')?.valid &&
               this.transferForm.get('purpose')?.valid);
      case TransferStep.PAYMENT_METHOD:
        return !!this.transferForm.get('paymentMethod')?.valid;
      default:
        return false;
    }
  }

  getStepProgress(): number {
    return ((this.currentStep + 1) / (Object.keys(TransferStep).length / 2)) * 100;
  }

  getStepTitle(): string {
    switch (this.currentStep) {
      case TransferStep.TRANSFER_TYPE:
        return 'Transfer Type';
      case TransferStep.RECIPIENT_INFO:
        return 'Recipient Information';
      case TransferStep.AMOUNT_CURRENCY:
        return 'Amount & Currency';
      case TransferStep.PAYMENT_METHOD:
        return 'Payment Method';
      case TransferStep.CONFIRMATION:
        return 'Confirm Transfer';
      case TransferStep.PROCESSING:
        return 'Processing...';
      default:
        return '';
    }
  }

  getStepDescription(): string {
    switch (this.currentStep) {
      case TransferStep.TRANSFER_TYPE:
        return 'Choose your transfer type';
      case TransferStep.RECIPIENT_INFO:
        return 'Enter recipient details';
      case TransferStep.AMOUNT_CURRENCY:
        return 'Set amount and currency';
      case TransferStep.PAYMENT_METHOD:
        return 'Select payment method';
      case TransferStep.CONFIRMATION:
        return 'Review and confirm';
      case TransferStep.PROCESSING:
        return 'Please wait while we process your transfer';
      default:
        return '';
    }
  }

  async confirmTransfer() {
    if (!this.transferForm.valid) {
      return;
    }

    this.currentStep = TransferStep.PROCESSING;
    this.isProcessing = true;

    try {
      // Simulate transfer processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Here you would call your transfer service
      console.log('Transfer confirmed:', this.transferForm.value);
      
      // Navigate to success page or show success message
      this.router.navigate(['/tabs/receipt'], {
        state: {
          type: 'transfer',
          data: this.transferForm.value,
          status: 'success'
        }
      });
      
    } catch (error) {
      console.error('Transfer failed:', error);
      this.currentStep = TransferStep.CONFIRMATION;
    } finally {
      this.isProcessing = false;
    }
  }

  goBack() {
    if (this.currentStep > 0) {
      this.previousStep();
    } else {
      this.router.navigate(['/tabs/home']);
    }
  }
}
