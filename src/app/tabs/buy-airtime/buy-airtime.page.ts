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
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { WaitingModalComponent } from 'src/app/components/waiting-modal/waiting-modal.component';
import { Profile } from 'src/app/interfaces';
import { AccountService } from 'src/app/services/auth/account.service';
import { NotificationService } from 'src/app/services/notification.service';
import { OperatorService } from 'src/app/services/operator.service';
import { AdvansisPayService } from 'src/app/services/payments/advansis-pay.service';
import { StorageService } from 'src/app/services/storage.service';
import { UtilsService } from 'src/app/services/utils.service';

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
export class BuyAirtimePage implements OnInit {
  airtimeForm!: FormGroup;

  retailer = '233241603241';
  recipientNumber = 0;
  amount = '';
  network = 0;
  description = '';
  email = '';
  isLoading: boolean = true;

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

  constructor(
    private route: Router,
    private formBuilder: FormBuilder,
    private storage: StorageService,
    private notificationService: NotificationService,
    private utilService: UtilsService,
    private accountService: AccountService,
    private modalController: ModalController,
    private advansisPayService: AdvansisPayService,
    private operatorService: OperatorService
  ) {}

  async ngOnInit() {
    this.isLoading = true; // Explicitly set loading state
    try {
      this.initializeForm();
      await this.getUserProfile();
    } catch (error) {
      console.error('Initialization error:', error);
      this.notificationService.showError('Failed to initialize page');
    } finally {
      this.isLoading = false; // Make sure to set loading to false when done
    }
  }

  private initializeForm() {
    this.airtimeForm = this.formBuilder.group({
      network: ['', Validators.required],
      recipientNumber: ['', [Validators.required, Validators.minLength(10)]],
      amount: ['', [Validators.required, Validators.min(1)]],
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
        // Airtime Topup Parameters to Prymo
        this.topupParams.recipientNumber = form.recipientNumber;
        this.topupParams.description = `Airtime recharge for ${form.recipientNumber}`;
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
          phoneNumber: form.recipientNumber,
          username: this.userProfile?.username || '',
          amount: Number(form.amount),
          orderDesc: this.topupParams.description,
          network: form.network,
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

        console.log('Payment response:', response);

        if (response && response.status === 201 && response.data) {
          window.open(response.data.checkoutUrl, '_system');
        } else {
          throw new Error('Failed to initiate payment');
        }
      } catch (error: any) {
        console.error('Payment initiation error:', error);
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
}
