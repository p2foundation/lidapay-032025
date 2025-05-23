import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
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
} from 'ionicons/icons';
@Component({
  selector: 'app-buy-reloadly',
  templateUrl: './buy-reloadly.page.html',
  styleUrls: ['./buy-reloadly.page.scss'],
  standalone: true,
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
export class BuyReloadlyPage implements OnInit {
  globalAirForm!: FormGroup;
  countries: any[] = [];
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
    private translate: TranslateService
  ) {
    addIcons({
      globeOutline,
      sendOutline,
      flashOutline,
      shieldCheckmarkOutline,
    });
    this.translate.setDefaultLang('en');
    this.translate.use('en');
  }
  async ngOnInit() {
    this.isLoading = true; // Start with loading state
    
    // Initialize form with more reasonable validation
    this.globalAirForm = this.formBuilder.group({
      recipientCountryCode: ['', Validators.required],
      recipientNumber: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(15)]],
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
        controls: Object.keys(this.globalAirForm.controls).map(key => ({
          name: key,
          valid: this.globalAirForm.get(key)?.valid,
          errors: this.globalAirForm.get(key)?.errors
        }))
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
        console.debug('Countries loaded:', this.countries.length);
      } else {
        throw new Error('Failed to load countries');
      }
    } catch (error) {
      console.error('Countries error:', error);
      this.notificationService.showError(
        'Failed to load countries. Please try again.'
      );
      throw error;
    }
  }
  // Submit global airtime form
  private async presentWaitingModal() {
    const modal = await this.modalService.createModal({
      component: WaitingModalComponent,
      cssClass: 'waiting-modal',
      backdropDismiss: false,
      componentProps: {
        title: 'Processing Payment',
        message: 'Please wait while we prepare your transaction...',
        statusMessage: 'Connecting to payment gateway...',
      },
    });

    // Method to update status message
    const updateStatus = (message: string) => {
      modal.componentProps = {
        ...modal.componentProps,
        statusMessage: message,
      };
    };

    return { modal, updateStatus };
  }
  // Global airtime form submit
  async topupFormSubmit(form: any) {
    if (!this.globalAirForm.valid) {
      this.notificationService.showWarn('Please fill all required fields');
      return;
    }

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
      this.topupParams.recipientNumber = form.recipientNumber;
      this.topupParams.description = `International airtime recharge for ${form.recipientNumber}`;
      this.topupParams.amount = Number(form.amount);
      this.topupParams.operatorId = operatorResult.operatorId;
      this.topupParams.recipientEmail = this.userProfile.email || '';
      this.topupParams.senderNumber = this.userProfile.phoneNumber || '';
      this.topupParams.recipientCountryCode = form.recipientCountryCode.isoName;
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
  private async detectOperator(params: any) {
    console.log('Detecting operator with params:', params);
    try {
      // Keep the parameters as they are
      const detectParams = {
        phone: params.phone,
        countryIsoCode: params.countryIsoCode,
      };

      const result = await firstValueFrom(
        this.reloadlyService.autoDetectOperator(detectParams)
      );

      if (!result || !result.operatorId) {
        console.error('Invalid operator detection response:', result);
        throw new Error('Could not detect network operator');
      }

      console.log('Operator detected:', result);
      return result;
    } catch (error: unknown) {
      console.error('Operator detection error:', error);
      if (
        error &&
        typeof error === 'object' &&
        'status' in error &&
        error.status === 404
      ) {
        throw new Error('Network operator not supported for this number');
      }
      throw new Error(
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
    console.log('Reloadly airtime form submitted:', form);
    // Validate form
    if (!this.globalAirForm.valid) {
      this.notificationService.showWarn('Please fill all required fields');
      return;
    }

    this.isProcessing = true;
    const waitingModal = await this.presentWaitingModal();

    try {
      // Check if we have user profile data
      if (!this.userProfile?._id) {
        await this.getUserProfile();
      }

      // Try to auto-detect operator
      const autoDetectParams = {
        phone: form.recipientNumber,
        countryIsoCode: form.recipientCountryCode.isoName,
      };

      const operatorResult = await this.detectOperator(autoDetectParams);

      // Prepare the topup parameters
      this.topupParams.recipientNumber = form.recipientNumber;
      this.topupParams.description = `International airtime recharge for ${form.recipientNumber}`;
      this.topupParams.amount = Number(form.amount);
      this.topupParams.operatorId = operatorResult.operatorId;
      this.topupParams.recipientCountryCode = form.recipientCountryCode.isoName;
      this.topupParams.payTransRef = await this.utilService.generateReference();

      // Prepare payment parameters
      const expressPayParams = {
        userId: this.userProfile._id,
        firstName: this.userProfile.firstName || '',
        lastName: this.userProfile.lastName || '',
        email: this.userProfile.email || '',
        phoneNumber: form.recipientNumber,
        username: this.userProfile.username || '',
        amount: Number(form.amount),
        orderDesc: this.topupParams.description,
        transType: 'GLOBALAIRTOPUP',
        redirectUrl: 'lidapay://redirect-url',
        payTransRef: this.topupParams.payTransRef,
      };

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
      await this.storage.setStorage(
        'pendingTransaction',
        JSON.stringify({
          ...this.topupParams,
          ...expressPayParams,
          timestamp: new Date().toISOString(),
        })
      );

      // Initiate payment
      const response = await firstValueFrom(
        this.advansisPayService.expressPayOnline(expressPayParams)
      );

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
      waitingModal.modal.dismiss();
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

  // Event handlers for form field changes
  onCountryChange(event: any) {
    console.log('Country changed:', event.detail.value);
    this.globalAirForm.get('recipientCountryCode')?.markAsTouched();
  }

  onPhoneNumberChange(event: any) {
    console.log('Phone number changed:', event.detail.value);
    this.globalAirForm.get('recipientNumber')?.markAsTouched();
  }

  onAmountChange(event: any) {
    console.log('Amount changed:', event.detail.value);
    this.globalAirForm.get('amount')?.markAsTouched();
  }
}
