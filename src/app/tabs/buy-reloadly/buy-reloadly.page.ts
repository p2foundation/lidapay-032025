import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { CountrySearchModalComponent } from './country-search-modal/country-search-modal.component';
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
  IonInput,
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
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { Profile } from 'src/app/interfaces';
import { AccountService } from 'src/app/services/auth/account.service';
import { NotificationService } from 'src/app/services/notification.service';
import { AdvansisPayService } from 'src/app/services/payments/advansis-pay.service';
import { ReloadlyService } from 'src/app/services/reloadly.service';
import { StorageService } from 'src/app/services/storage.service';
import { UtilsService } from 'src/app/services/utils.service';
import { ModalService } from 'src/app/services/modal.service';
import { WaitingModalComponent } from 'src/app/components/waiting-modal/waiting-modal.component';
import { addIcons } from 'ionicons';
import {
  globeOutline,
  sendOutline,
  flashOutline,
  shieldCheckmarkOutline,
  closeOutline,
  closeCircleOutline,
  chevronDownOutline,
} from 'ionicons/icons';
@Component({
  selector: 'app-buy-reloadly',
  templateUrl: './buy-reloadly.page.html',
  styleUrls: ['./buy-reloadly.page.scss'],
  standalone: true,
  providers: [ModalController],
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonInput,
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
export class BuyReloadlyPage implements OnInit {
  globalAirForm!: FormGroup;
  countries: any[] = [];
  filteredCountries: any[] = [];
  searchTerm: string = '';
  selectedCountry: any = null;
  userProfile: Profile = {} as Profile;
  isProcessing = false;
  isLoading: boolean = true;
  // Update the topupParams interface at the class level
  topupParams: any = {
    operatorId: 0,
    amount: 0,
    recipientEmail: '',
    recipientNumber: '',
    recipientCountryCode: '',
    senderNumber: '',
    senderCountryCode: 'GH', // Default sender country code for Ghana
    description: '',
    transType: 'GLOBALAIRTOPUP',
    payTransRef: '',
  };
  constructor(
    private formBuilder: FormBuilder,
    private reloadlyService: ReloadlyService,
    private accountService: AccountService,
    private storage: StorageService,
    private notificationService: NotificationService,
    private utilService: UtilsService,
    private advansisPayService: AdvansisPayService,
    private modalService: ModalService,
    private translate: TranslateService,
    private modalCtrl: ModalController
  ) {
    addIcons({
      globeOutline,
      chevronDownOutline,
      sendOutline,
      flashOutline,
      shieldCheckmarkOutline,
      closeOutline,
      closeCircleOutline,
    });
    this.translate.setDefaultLang('en');
    this.translate.use('en');
  }
  async ngOnInit() {
    this.isLoading = true; // Start with loading state

    // Initialize form with more reasonable validation
    this.globalAirForm = this.formBuilder.group({
      recipientCountryCode: ['', Validators.required],
      recipientNumber: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(15),
        ],
      ],
      amount: ['', [Validators.required, Validators.min(1)]],
    });

    try {
      // Load initial data in parallel
      await Promise.all([this.getUserProfile(), this.loadCountries()]);

      // Add small delay for smooth animation
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Log form state for debugging
      console.log('Form state after initialization:', {
        valid: this.globalAirForm.valid,
        touched: this.globalAirForm.touched,
        dirty: this.globalAirForm.dirty,
        errors: this.globalAirForm.errors,
        controls: Object.keys(this.globalAirForm.controls).map((key) => ({
          name: key,
          valid: this.globalAirForm.get(key)?.valid,
          errors: this.globalAirForm.get(key)?.errors,
        })),
      });
    } catch (error) {
      console.error('Failed to load initial data:', error);
      this.notificationService.showError('Failed to load page data');
    } finally {
      this.isLoading = false; // End loading state
    }
  }
  // Modified to return a promise and handle errors better
  async getUserProfile() {
    try {
      const response = await firstValueFrom(this.accountService.getProfile());
      if (response) {
        this.userProfile = response;
        console.debug('User profile loaded:', this.userProfile);
      } else {
        throw new Error('Failed to load user profile');
      }
    } catch (error) {
      console.error('Profile error:', error);
      this.notificationService.showError(
        'Failed to load user profile. Please try again.'
      );
      throw error;
    }
  }
  // load countries
  async loadCountries() {
    try {
      const response = await firstValueFrom(
        this.reloadlyService.getReloadlyCountries()
      );
      if (response) {
        this.countries = response;
        this.filteredCountries = [...this.countries];

        // If there's a country code in the form, set the selectedCountry
        const countryCode = this.globalAirForm.get(
          'recipientCountryCode'
        )?.value;
        if (countryCode) {
          this.selectedCountry = this.countries.find(
            (c) => c.isoName === countryCode
          );
        }
      }
    } catch (error) {
      console.error('Error loading countries:', error);
      this.notificationService.showError(
        'Failed to load countries. Please try again later.'
      );
      throw error;
    }
  }
  // Submit global airtime form
  private async presentWaitingModal() {
    const modal = await this.modalCtrl.create({
      component: WaitingModalComponent,
      cssClass: 'waiting-modal',
      backdropDismiss: false,
      componentProps: {
        title: 'Processing Payment',
        message: 'Please wait while we prepare your transaction...',
        statusMessage: 'Connecting to payment gateway...',
      },
    });

    // Present the modal and wait for it to be dismissed
    await modal.present();

    // Method to update status message
    const updateStatus = (message: string) => {
      if (modal) {
        modal.componentProps = {
          ...modal.componentProps,
          statusMessage: message,
        };
      }
    };

    return { modal, updateStatus };
  }
  // Global airtime form submit
  async topupFormSubmit(form: any) {
    if (!this.globalAirForm.valid) {
      this.notificationService.showWarn('Please fill all required fields');
      return;
    }
    console.log('[Global airtime form submitted]:', form);

    const { modal, updateStatus } = await this.presentWaitingModal();

    try {
      // Check profile
      updateStatus('Verifying user profile...');
      if (!this.userProfile?._id) {
        await this.getUserProfile();
      }
      // Detect operator
      updateStatus('Detecting network operator...');
      const operatorResult = await this.detectOperator({
        phone: form.recipientNumber,
        countryIsoCode: form.recipientCountryCode.isoName,
      });
      // Prepare the topup parameters
      this.topupParams.operatorId = operatorResult.operatorId;
      this.topupParams.amount = Number(form.amount);
      this.topupParams.description = `International airtime recharge for ${form.recipientNumber}`;
      this.topupParams.recipientEmail = this.userProfile.email || '';
      this.topupParams.recipientNumber = form.recipientNumber;
      this.topupParams.recipientCountryCode = form.recipientCountryCode.isoName;
      this.topupParams.senderNumber = this.userProfile.phoneNumber || '';
      this.topupParams.payTransRef = await this.utilService.generateReference();
      // Prepare payment
      updateStatus('Preparing payment...');
      const expressPayParams = {
        userId: this.userProfile._id,
        firstName: this.userProfile.firstName || '',
        lastName: this.userProfile.lastName || '',
        email: this.userProfile.email || '',
        phoneNumber: form.recipientNumber,
        username: this.userProfile.username || '',
        amount: Number(form.amount),
        orderDesc: `International airtime recharge for ${form.recipientNumber}`,
        orderImgUrl: 'https://gravatar.com/dinosaursuperb49b1159b93',
      };
      // Store transaction
      updateStatus('Saving transaction details...');
      console.log('[topupFormSubmit] => topupParams', this.topupParams);
      console.log('[topupFormSubmit] => expressPayParams', expressPayParams);
      await this.storage.setStorage(
        'pendingTransaction',
        JSON.stringify({
          ...this.topupParams,
          ...expressPayParams,
          timestamp: new Date().toISOString(),
        })
      );
      // Initiate payment
      updateStatus('Initiating payment...');
      const response = await firstValueFrom(
        this.advansisPayService.expressPayOnline(expressPayParams)
      );
      console.log('[topupFormSubmit] => response', response);
      if (response && response.status === 201 && response.data?.checkoutUrl) {
        updateStatus('Redirecting to payment gateway...');
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Brief pause
        await modal.dismiss();
        window.open(response.data.checkoutUrl, '_system');
      } else {
        throw new Error('Failed to initiate payment');
      }
    } catch (error: any) {
      console.error('Payment initiation error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Payment service unavailable';
      this.notificationService.showError(errorMessage);
    } finally {
      if (modal) {
        await modal.dismiss();
      }
    }
  }
  // Detect operator
  private async detectOperator(params: {
    phone: string;
    countryIsoCode?: string;
  }) {
    console.log('Detecting Operator with params:', params);
    try {
      // Ensure we have a country code
      const countryCode =
        params.countryIsoCode || this.selectedCountry?.isoName;
      if (!countryCode) {
        throw new Error('Country code is required for operator detection');
      }

      console.log('Calling autoDetectOperator with:', {
        phone: params.phone,
        countryIsoCode: countryCode,
      });

      const response = await firstValueFrom(
        this.reloadlyService.autoDetectOperator({
          phone: params.phone,
          countryIsoCode: params.countryIsoCode,
        })
      );

      console.log('[autoDetectOperator] => response:', response);

      if (!response || !response.operatorId) {
        console.error('Invalid operator detection response:', response);
        throw new Error('Could not detect network operator');
      }

      return response;
    } catch (error: any) {
      console.error('Operator detection error:', error);
      if (error?.status === 404) {
        throw new Error('Network operator not supported for this number');
      }
      throw new Error(
        error.message ||
          'Could not detect network operator for the provided number.'
      );
    }
  }
  // Format amount
  private formatAmount(amount: number): string {
    return amount.toFixed(2);
  }
  // Reloadly airtime form submit
  async reloadlyAirFormSubmit(form: any) {
    console.log('1. Reloadly airtime form submitted:', form);
    // Validate form
    if (!this.globalAirForm.valid) {
      console.log('2. Form validation failed');
      this.notificationService.showWarn('Please fill all required fields');
      return;
    }

    console.log('3. Form is valid, setting isProcessing to true');
    this.isProcessing = true;

    console.log('4. Showing waiting modal...');
    const { modal, updateStatus } = await this.presentWaitingModal();
    console.log('5. Waiting modal shown');

    try {
      updateStatus('Checking user profile...');
      console.log('6. Checking user profile...');

      // Check if we have user profile data
      if (!this.userProfile?._id) {
        console.log('7. No user profile found, fetching...');
        await this.getUserProfile();
        console.log('8. User profile fetched:', !!this.userProfile?._id);
      } else {
        console.log('7. Using existing user profile');
      }

      // Try to auto-detect operator
      console.log('9. Preparing to detect operator...');
      const autoDetectParams = {
        phone: form.recipientNumber,
        countryIsoCode: form.recipientCountryCode,
      };
      console.log('10. Auto detect params:', autoDetectParams);

      updateStatus('Detecting network operator...');
      console.log('11. Calling detectOperator...');
      const operatorResult = await this.detectOperator(autoDetectParams);
      console.log('12. Operator detection result:', operatorResult);

      // Prepare the topup parameters
      console.log('13. Preparing topup parameters...');
      this.topupParams.recipientNumber = form.recipientNumber;
      this.topupParams.description = `International airtime recharge for ${form.recipientNumber}`;
      this.topupParams.amount = Number(form.amount);
      this.topupParams.operatorId = operatorResult.operatorId;
      this.topupParams.recipientCountryCode = form.recipientCountryCode;
      this.topupParams.payTransRef = await this.utilService.generateReference();
      console.log('14. Topup parameters prepared:', this.topupParams);

      // Prepare payment parameters
      console.log('15. Preparing expressPay parameters...');
      const expressPayParams = {
        userId: this.userProfile._id,
        firstName: this.userProfile.firstName || '',
        lastName: this.userProfile.lastName || '',
        email: this.userProfile.email || '',
        phoneNumber: form.recipientNumber,
        username: String(this.userProfile?.username || ''),
        amount: Number(form.amount),
        orderDesc: this.topupParams.description,
        orderImgUrl:
          'https://advansistechnologies.com/assets/img/home-six/featured/icon1.png',
      };
      console.log('16. ExpressPay parameters prepared:', expressPayParams);

      // Validate required fields
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
      console.log('Pending transaction stored:');
      await this.storage.setStorage(
        'pendingTransaction',
        JSON.stringify({
          ...this.topupParams,
          ...expressPayParams,
          timestamp: new Date().toISOString(),
        })
      );

      // Initiate payment
      console.log('ExpressPay parameters:', expressPayParams);
      const response = await firstValueFrom(
        this.advansisPayService.expressPayOnline(expressPayParams)
      );
      console.log('[Payment response]:', response);

      if (response && response.status === 201 && response.data) {
        window.open(response.data.checkoutUrl, '_system');
      } else {
        throw new Error('Failed to initiate payment');
      }
    } catch (error: any) {
      console.error('Payment initiation error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Payment service unavailable';
      this.notificationService.showError(errorMessage);
    } finally {
      this.isProcessing = false;
      if (modal) {
        await modal
          .dismiss()
          .catch((e: Error) => console.log('Error dismissing modal:', e));
      }
    }
  }

  async loadUserProfile() {
    try {
      const response = await firstValueFrom(this.accountService.getProfile());
      if (response) {
        this.userProfile = response;
        console.debug('User profile loaded:', this.userProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }
  // Open country selection modal
  async openCountrySearch() {
    const modal = await this.modalCtrl.create({
      component: CountrySearchModalComponent,
      componentProps: {
        countries: this.countries,
      },
      cssClass: 'country-search-modal',
      breakpoints: [0, 0.8, 1],
      initialBreakpoint: 0.8,
      handle: true,
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'select' && data) {
      // Update the form with the selected country's ISO code
      this.globalAirForm.patchValue({
        recipientCountryCode: data.isoName,
      });
      console.log('[selectedCountry]:', data);
      // Store the selected country for display
      this.selectedCountry = data;

      // Mark the field as touched to show validation if needed
      this.globalAirForm.get('recipientCountryCode')?.markAsTouched();
    }
  }

  onPhoneNumberChange(event: any) {
    console.log('Phone number changed:', event.detail.value);
    this.globalAirForm.get('recipientNumber')?.markAsTouched();
  }

  onAmountChange(event: any) {
    console.log('Amount changed:', event.detail.value);
    this.globalAirForm.get('amount')?.markAsTouched();
  }
  // Filter countries based on search term
  filterCountries(event: any) {
    const searchTerm = event.target.value.toLowerCase();
    if (!searchTerm) {
      this.filteredCountries = [...this.countries];
      return;
    }
    this.filteredCountries = this.countries.filter(
      (country) =>
        country.name.toLowerCase().includes(searchTerm) ||
        (country.isoName && country.isoName.toLowerCase().includes(searchTerm))
    );
  }
}
