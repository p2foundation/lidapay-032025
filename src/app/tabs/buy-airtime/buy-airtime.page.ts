import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  ModalController,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonItem,
  IonLabel,
  IonList,
  IonIcon,
  IonCard,
  IonCardContent,
  IonButtons,
  IonBackButton,
  IonNote,
  IonGrid,
  IonRow,
  IonCol,
  IonSkeletonText,
  IonChip,
  IonSpinner,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';
import { WaitingModalComponent } from 'src/app/components/waiting-modal/waiting-modal.component';
import { Profile } from 'src/app/interfaces';
import { AccountService } from 'src/app/services/auth/account.service';
import { NotificationService } from 'src/app/services/notification.service';
import { OperatorService } from 'src/app/services/operator.service';
import { AdvansisPayService } from 'src/app/services/payments/advansis-pay.service';
import { StorageService } from 'src/app/services/storage.service';
import { UtilsService } from 'src/app/services/utils.service';
import { EnhancedAirtimeService, Country, Operator } from 'src/app/services/enhanced-airtime.service';

@Component({
  selector: 'app-buy-airtime',
  templateUrl: './buy-airtime.page.html',
  styleUrls: ['./buy-airtime.page.scss'],
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
    IonInput,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonItem,
    IonLabel,
    IonList,
    IonIcon,
    IonCard,
    IonCardContent,
    IonButtons,
    IonBackButton,
    IonNote,
    IonGrid,
    IonRow,
    IonCol,
    IonSkeletonText,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class BuyAirtimePage implements OnInit, OnDestroy {
  airtimeForm!: FormGroup;

  // Enhanced data
  countries: Country[] = [];
  operators: Operator[] = [];
  selectedCountry: Country | null = null;
  selectedOperator: Operator | null = null;
  detectedOperator: Operator | null = null;
  
  // Legacy data
  retailer = '233241603241';
  recipientNumber = 0;
  amount = '';
  network = 0;
  description = '';
  email = '';
  isLoading: boolean = true;
  isDetectingOperator = false;

  topupParams: any = {
    recipientNumber: '',
    description: '',
    amount: '',
    customerEmail: 'info@advansistechnologies.com',
    transType: 'AIRTIMETOPUP',
    payTransRef: '',
  };

  public checkoutURL = '';
  public pswitchObject: any = {};
  public userProfile: Profile = {} as Profile;
  loading: any;
  loaderToShow: any;
  
  // Quick amounts
  quickAmounts = [5, 10, 20, 50, 100, 200, 500];
  
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private storage: StorageService,
    private notificationService: NotificationService,
    private utilService: UtilsService,
    private accountService: AccountService,
    private modalController: ModalController,
    private advansisPayService: AdvansisPayService,
    private enhancedAirtimeService: EnhancedAirtimeService
  ) {}

  async ngOnInit() {
    this.isLoading = true; // Explicitly set loading state
    try {
      this.initializeForm();
      await this.getUserProfile();
      this.loadCountries();
      this.setupFormListeners();
    } catch (error) {
      console.error('Initialization error:', error);
      this.notificationService.showError('Failed to initialize page');
    } finally {
      this.isLoading = false; // Make sure to set loading to false when done
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm() {
    this.airtimeForm = this.formBuilder.group({
      countryIso: ['GH', Validators.required], // Default to Ghana
      network: ['', Validators.required],
      recipientNumber: ['', [Validators.required, Validators.minLength(10)]],
      amount: ['', [Validators.required, Validators.min(1)]],
      autoDetect: [true]
    });
  }

  private loadCountries() {
    this.enhancedAirtimeService.getCountries()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (countries) => {
          this.countries = countries;
          // Set Ghana as default
          const ghana = countries.find(c => c.isoName === 'GH');
          if (ghana) {
            this.selectedCountry = ghana;
            this.loadOperators(ghana.isoName);
          }
        },
        error: (error) => {
          console.error('Error loading countries:', error);
          this.notificationService.showError('Failed to load countries');
        }
      });
  }

  private loadOperators(countryIso: string) {
    this.enhancedAirtimeService.getOperators(countryIso)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (operators) => {
          this.operators = operators;
        },
        error: (error) => {
          console.error('Error loading operators:', error);
          this.notificationService.showError('Failed to load operators');
        }
      });
  }

  private setupFormListeners() {
    // Listen to country changes
    this.airtimeForm.get('countryIso')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(countryIso => {
        if (countryIso) {
          this.loadOperators(countryIso);
        }
      });

    // Listen to phone number changes for auto-detection
    this.airtimeForm.get('recipientNumber')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(phoneNumber => {
        if (phoneNumber && this.airtimeForm.get('autoDetect')?.value) {
          this.autoDetectOperator(phoneNumber);
        }
      });
  }

  private autoDetectOperator(phoneNumber: string) {
    if (!phoneNumber || !this.selectedCountry) return;

    this.isDetectingOperator = true;
    this.enhancedAirtimeService.autoDetectOperator(phoneNumber, this.selectedCountry.isoName)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (operator) => {
          this.detectedOperator = operator;
          this.airtimeForm.patchValue({ network: operator.id });
          this.selectedOperator = operator;
        },
        error: (error) => {
          console.error('Auto-detection failed:', error);
        },
        complete: () => {
          this.isDetectingOperator = false;
        }
      });
  }

  async getUserProfile() {
    try {
      const response = await firstValueFrom(this.accountService.getProfile());
      if (response) {
        this.userProfile = response;
      }
    } catch (error) {
      console.error('Profile error:', error);
      this.notificationService.showError(
        'Failed to load user profile. Please try again.'
      );
      throw error;
    }
  }

  async topupFormSubmit(form: any) {
    console.log('Form submitted:', form);
    if (this.airtimeForm.valid) {
      const waitingModal = await this.presentWaitingModal();

      try {
        if (!this.userProfile?._id) {
          await this.getUserProfile();
        }
        // Format phone number for Ghana (remove +233 prefix if present)
        let formattedPhoneNumber = form.recipientNumber;
        const cleanNumber = formattedPhoneNumber.replace(/\D/g, '');
        
        // Convert Ghanaian phone numbers to local format (0240000000)
        if (cleanNumber.length === 12 && cleanNumber.startsWith('233')) {
          // Convert 233244000000 -> 0244000000
          formattedPhoneNumber = '0' + cleanNumber.slice(3);
        } else if (cleanNumber.length === 13 && cleanNumber.startsWith('233')) {
          // Convert +233244000000 -> 0244000000
          formattedPhoneNumber = '0' + cleanNumber.slice(3);
        } else if (cleanNumber.length === 10 && cleanNumber.startsWith('0')) {
          // Keep as is: 0240000000
          formattedPhoneNumber = cleanNumber;
        }

        // Airtime Topup Parameters to Prymo
        this.topupParams.recipientNumber = formattedPhoneNumber;
        const timestamp = new Date().toLocaleString();
        this.topupParams.description = `Airtime recharge for ${form.network}: ${formattedPhoneNumber} - GH₵${form.amount} (${timestamp})`;
        this.topupParams.amount = this.formatAmount(form.amount);
        this.topupParams.network = form.network;
        this.topupParams.payTransRef =
          await this.utilService.generateReference();
        // Express Pay Parameters to Checkout URL
        const expressPayParams = {
          userId: this.userProfile._id,
          firstName: this.userProfile.firstName || '',
          lastName: this.userProfile.lastName || '',
          email: this.userProfile.email || '',
          phoneNumber: formattedPhoneNumber,
          username: this.userProfile?.username || '',
          amount: Number(form.amount),
          orderDesc: this.topupParams.description,
          orderImgUrl: 'https://gravatar.com/dinosaursuperb49b1159b93',
        };
        console.log('[Express Pay] => Payment params:', expressPayParams);
        console.log('[Airtime Topup] => Airtime params:', this.topupParams);

        if (
          !expressPayParams.firstName ||
          !expressPayParams.lastName ||
          !expressPayParams.email
        ) {
          throw new Error(
            'Missing required user profile information. Please update your profile.'
          );
        }

        await this.storage.setStorage(
          'pendingTransaction',
          JSON.stringify({
            ...this.topupParams,
            ...expressPayParams,
            timestamp: new Date().toISOString(),
          })
        );

        const response = await firstValueFrom(
          this.advansisPayService.expressPayOnline(expressPayParams)
        );

        console.log('[Payment response]=>', JSON.stringify(response, null, 2));

        // Enhanced response validation for Postman format
        if (!response) {
          console.error('No response received from payment service');
          throw new Error('No response received from payment service');
        }

        // Log the full response for debugging
        console.log('Full payment response:', JSON.stringify(response, null, 2));

        // Check if we have a checkout URL
        if (!response.data?.checkoutUrl) {
          console.error('Missing checkout URL in response');
          throw new Error('Payment service did not return a checkout URL');
        }
        // Validate required fields in data object
        if (!response.data.checkoutUrl) {
          throw new Error('Invalid payment response: Missing checkout URL');
        }
        if (!response.data.token) {
          throw new Error('Invalid payment response: Missing token');
        }
        if (!response.data['order-id']) {
          throw new Error('Invalid payment response: Missing order-id');
        }

        // Log important details for debugging
        console.log('[Payment Details] Token:', response.data.token);
        console.log('[Payment Details] Order ID:', response.data['order-id']);

        // Store transaction details
        await this.storage.setStorage('pendingTransaction', JSON.stringify({
          ...this.topupParams,
          ...expressPayParams,
          timestamp: new Date().toISOString(),
          transactionToken: response.data.token,
          orderId: response.data['order-id']
        }));

        // Validate and open checkout URL
        const url = response.data.checkoutUrl;
        
        // Detailed URL validation
        try {
          const parsedUrl = new URL(url);
          
          // Log detailed URL information
          console.log('[URL Validation] Full URL:', url);
          console.log('[URL Validation] Protocol:', parsedUrl.protocol);
          console.log('[URL Validation] Host:', parsedUrl.host);
          console.log('[URL Validation] Path:', parsedUrl.pathname);
          
          // Validate URL scheme
          if (!parsedUrl.protocol.startsWith('http')) {
            throw new Error('Invalid URL scheme. Must be HTTP or HTTPS');
          }
          
          // Validate host
          if (!parsedUrl.host.includes('expresspaygh.com')) {
            throw new Error('Invalid host. URL must be from expresspaygh.com');
          }
          
          // Validate URL structure
          if (!parsedUrl.pathname.startsWith('/api/checkout.php')) {
            throw new Error('Invalid checkout URL path');
          }
          
          // Validate token parameter
          const token = parsedUrl.searchParams.get('token');
          if (!token) {
            throw new Error('Missing token parameter in checkout URL');
          }
          
          // Log final validation result
          console.log('[URL Validation] ✅ Valid checkout URL:', url);
          
          // Open URL in new window
          window.open(url, '_system');
          
        } catch (error: unknown) {
          
          console.error('[URL Error]', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          throw new Error(`Invalid checkout URL: ${url}. Error: ${errorMessage}`);
        }
      } catch (error: any) {
        console.error('Payment iniltiation error:', error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Payment service unavailable';
        this.notificationService.showError(errorMessage);
      } finally {
        waitingModal.dismiss();
      }
    } else {
      this.notificationService.showWarn('Please fill all required fields');
    }
  }

  async presentWaitingModal() {
    const modal = await this.modalController.create({
      component: WaitingModalComponent,
      cssClass: 'my-custom-class',
      backdropDismiss: false,
      keyboardClose: false,
    });
    await modal.present();
    return modal; // Return the modal instance
  }

  formatAmount(amount: number): string {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  selectAmount(amount: number) {
    this.airtimeForm.patchValue({ amount });
  }

  async loadUserProfile() {
    try {
      const response = await firstValueFrom(this.accountService.getProfile());
      if (response) {
        this.userProfile = response;
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }

  compareWith(o1: any, o2: any) {
    return o1 === o2;
  }

  // Enhanced helper methods
  selectCountry(country: Country) {
    this.selectedCountry = country;
    this.airtimeForm.patchValue({ countryIso: country.isoName });
    this.loadOperators(country.isoName);
  }

  selectOperator(operator: Operator) {
    this.selectedOperator = operator;
    this.airtimeForm.patchValue({ network: operator.id });
  }

  onPhoneNumberInput(event: any) {
    const phoneNumber = event.target.value;
    if (this.selectedCountry) {
      const formatted = this.enhancedAirtimeService.formatPhoneNumber(phoneNumber, this.selectedCountry.isoName);
      this.airtimeForm.patchValue({ recipientNumber: formatted });
    }
  }

  validatePhoneNumber(): boolean {
    const phoneNumber = this.airtimeForm.get('recipientNumber')?.value;
    const countryIso = this.airtimeForm.get('countryIso')?.value;
    
    if (!phoneNumber || !countryIso) return false;
    
    return this.enhancedAirtimeService.validatePhoneNumber(phoneNumber, countryIso);
  }

}
