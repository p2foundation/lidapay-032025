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
  LoadingController,
  ModalController,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { WaitingModalComponent } from 'src/app/components/waiting-modal/waiting-modal.component';
import { firstValueFrom } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountService } from 'src/app/services/auth/account.service';
import { NotificationService } from 'src/app/services/notification.service';
import { InternetDataService } from 'src/app/services/one4all/internet.data.service';
import { AdvansisPayService } from 'src/app/services/payments/advansis-pay.service';
import { StorageService } from 'src/app/services/storage.service';
import { UtilsService } from 'src/app/services/utils.service';
import { PhoneNumberModalComponent } from 'src/app/components/phone-number-modal/phone-number-modal.component';

interface DataBundle {
  code: string;
  network: string;
  volume: string;
  validity: string;
  price: number;
  isPopular?: boolean;
  amount: number;
}
@Component({
  selector: 'app-data-bundle',
  templateUrl: './data-bundle.page.html',
  styleUrls: ['./data-bundle.page.scss'],
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
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DataBundlePage implements OnInit {
  isLoading: boolean = true;
  dataBundle: DataBundle[] = [];
  selectedBundle: DataBundle | null = null;
  dataBundleForm!: FormGroup;
  userProfile: any = {};

  buyDataParams = {
    recipientNumber: '',
    dataCode: '',
    network: '',
    amount: '',
    description: '',
    customerEmail: 'info@advansistechnologies.com',
    transType: 'DATABUNDLELIST',
    payTransRef: '',
  };
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private storage: StorageService,
    private internetService: InternetDataService,
    private notification: NotificationService,
    private loadingController: LoadingController,
    private modalController: ModalController,
    private advansisPayService: AdvansisPayService,
    private utilService: UtilsService,
    private accountService: AccountService
  ) {
    this.dataBundleForm = this.formBuilder.group({
      dataCode: ['', Validators.required],
      recipientNumber: ['', [Validators.required, Validators.minLength(10)]],
    });

    this.route.queryParams.subscribe((params) => {
      if (params && params['special']) {
        this.dataBundle = JSON.parse(params['special']);
        console.debug('[BUNDLE LIST] ==>', this.dataBundle);
      }
    });
  }

  ngOnInit() {
    this.loadUserProfile();
    // Simulate loading completion
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }
  // Load User Profile
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
  // Select Bundle
  async selectBundle(bundle: DataBundle) {
    console.debug(`[SELECTED BUNDLE]==>${bundle}`);
    this.selectedBundle = bundle;
    this.dataBundleForm.patchValue({ dataCode: bundle });

    const modal = await this.modalController.create({
      component: PhoneNumberModalComponent,
      componentProps: {
        bundle: bundle,
        dataBundleForm: this.dataBundleForm,
      },
      cssClass: 'phone-number-modal',
      breakpoints: [0, 0.5, 0.8],
      initialBreakpoint: 0.5,
    });

    modal.onDidDismiss().then((result) => {
      if (result.data) {
        this.onSubmit(result.data);
      }
    });

    await modal.present();
  }
  // Get Bundle Icon
  getBundleIcon(volume: string): string {
    const dataSize = parseInt(volume);
    if (dataSize >= 5) return 'cellular';
    if (dataSize >= 2) return 'cellular-outline';
    return 'cellular-outline';
  }
  // Waiting Modal
  async presentWaitingModal() {
    const modal = await this.modalController.create({
      component: WaitingModalComponent,
      cssClass: 'waiting-modal',
      backdropDismiss: false,
    });
    await modal.present();
    return modal;
  }
  // Submit Data Bundle Form
  async onSubmit(form: any) {
    if (this.dataBundleForm.valid) {
      const waitingModal = await this.presentWaitingModal();

      try {
        if (!this.userProfile?._id) {
          await this.loadUserProfile();
        }
        // Prepare data bundle parameters
        this.buyDataParams.recipientNumber = form.recipientNumber;
        this.buyDataParams.dataCode = form.dataCode.code;
        this.buyDataParams.network = form.dataCode.network;
        this.buyDataParams.amount = form.dataCode.price;
        this.buyDataParams.description = `Internet Bundle Purchase: ${form.dataCode.volume} - ${form.dataCode.validity} days`;
        this.buyDataParams.payTransRef =
          await this.utilService.generateReference();
        // Prepare ExpressPay parameters
        const expressPayParams = {
          userId: this.userProfile._id,
          firstName: this.userProfile.firstName || '',
          lastName: this.userProfile.lastName || '',
          email: this.userProfile.email || '',
          phoneNumber: form.recipientNumber,
          username: this.userProfile.username || '',
          amount: Number(form.dataCode.price),
          orderDesc: this.buyDataParams.description,
          transType: 'DATABUNDLE',
          redirectUrl: 'lidapay://redirect-url',
          payTransRef: await this.utilService.generateReference(),
        };

        if (
          !expressPayParams.firstName ||
          !expressPayParams.lastName ||
          !expressPayParams.email
        ) {
          throw new Error(
            'Missing required user profile information. Please update your profile.'
          );
        }
        // Store transaction parameters
        await this.storage.setStorage(
          'pendingTransaction',
          JSON.stringify({
            ...this.buyDataParams,
            ...expressPayParams,
            bundleName: form.dataCode.volume,
            validity: form.dataCode.validity,
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
          error instanceof Error
            ? error.message
            : 'Payment service unavailable';
        this.notification.showError(errorMessage);
      } finally {
        waitingModal.dismiss();
      }
    } else {
      this.notification.showWarn('Please fill all required fields');
    }
  }
}
