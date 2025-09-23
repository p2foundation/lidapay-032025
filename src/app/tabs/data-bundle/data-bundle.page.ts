import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserService } from '../../services/browser.service';
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
  IonButton,
  IonButtons,
  IonBackButton,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonCardSubtitle,
  IonNote,
  IonGrid,
  IonRow,
  IonCol,
  IonSkeletonText,
  IonText,
  LoadingController,
  ModalController,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StorageService } from 'src/app/services/storage.service';
import { InternetDataService } from 'src/app/services/one4all/internet.data.service';
import { NotificationService } from 'src/app/services/notification.service';
import { AdvansisPayService } from 'src/app/services/payments/advansis-pay.service';
import { UtilsService } from 'src/app/services/utils.service';
import { AccountService } from 'src/app/services/auth/account.service';
import { firstValueFrom } from 'rxjs';
import { PhoneNumberModalComponent } from 'src/app/components/phone-number-modal/phone-number-modal.component';
import { WaitingModalComponent } from 'src/app/components/waiting-modal/waiting-modal.component';
import { addIcons } from 'ionicons';
import { wifiOutline, callOutline, warningOutline, arrowBack, checkmarkCircle, card } from 'ionicons/icons';

export interface DataBundle {
  id?: string;
  code: string;
  plan_id?: string;
  network: string;
  volume: string;
  validity: string | number;
  price: number | string;
  amount?: number | string;
  bundleVolume?: string;
  bundleValidity?: string | number;
  plan_name?: string;
  description?: string;
  isPopular?: boolean;
  [key: string]: any;
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
    IonButton,
    IonButtons,
    IonBackButton,

    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonCardSubtitle,
    IonNote,

    IonText,
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
  dataBundleForm: FormGroup;
  userProfile: any = {};

  buyDataParams = {
    recipientNumber: '',
    dataCode: '',
    network: '',
    amount: '',
    description: '',
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
    private accountService: AccountService,
    private browserService: BrowserService
  ) {
    addIcons({warningOutline,arrowBack,checkmarkCircle,card,wifi:wifiOutline,call:callOutline});
    this.dataBundleForm = this.formBuilder.group({
      dataCode: ['', Validators.required],
      recipientNumber: ['', [Validators.required, Validators.minLength(10)]],
    });

    this.route.queryParams.subscribe(params => {
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
    console.debug(`[SELECTED BUNDLE]==>${bundle}`)
    this.selectedBundle = bundle;
    this.dataBundleForm.patchValue({ dataCode: bundle });
    
    const modal = await this.modalController.create({
      component: PhoneNumberModalComponent,
      componentProps: {
        bundle: bundle,
        dataBundleForm: this.dataBundleForm
      },
      cssClass: 'phone-number-modal',
      breakpoints: [0, 0.5, 0.8],
      initialBreakpoint: 0.5
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

  // Get Network Icon (for template)
  getNetworkIcon(network: string): string {
    if (!network) return 'wifi';
    const networkStr = String(network).toLowerCase();
    if (networkStr.includes('mtn')) return 'call';
    if (networkStr.includes('vodafone')) return 'call';
    if (networkStr.includes('airteltigo')) return 'call';
    if (networkStr.includes('glo')) return 'call';
    return 'wifi';
  }

  // Helper to get network name from string or object
  getNetworkName(network: any): string {
    if (typeof network === 'object' && network !== null && 'name' in network) {
      return network.name;
    }
    return network || '';
  }

  // Format Amount (for template)
  formatAmount(amount: number | string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2
    }).format(Number(amount));
  }

  // Waiting Modal
  async presentWaitingModal() {
    const modal = await this.modalController.create({
      component: WaitingModalComponent,
      cssClass: 'waiting-modal',
      backdropDismiss: false
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

        // Prepare data bundle parameters
        this.buyDataParams.recipientNumber = formattedPhoneNumber;
        this.buyDataParams.dataCode = form.dataCode.code;
        this.buyDataParams.network = form.dataCode.network;
        this.buyDataParams.amount = form.dataCode.price;
        this.buyDataParams.description = `Internet Bundle Purchase: ${form.dataCode.volume} - ${form.dataCode.validity} days`;
        this.buyDataParams.payTransRef = await this.utilService.generateReference();
        // Prepare ExpressPay parameters
        const expressPayParams = {
          userId: this.userProfile._id,
          firstName: this.userProfile.firstName || '',
          lastName: this.userProfile.lastName || '',
          email: this.userProfile.email || '',
          phoneNumber: formattedPhoneNumber,
          username: this.userProfile.username || '',
          amount: Number(form.dataCode.price),
          orderDesc: this.buyDataParams.description,
          orderImgUrl: 'https://gravatar.com/dinosaursuperb49b1159b93',
        };
        console.log('[Express Pay] => Payment params:', expressPayParams);
        if (!expressPayParams.firstName || !expressPayParams.lastName || !expressPayParams.email) {
          throw new Error('Missing required user profile information. Please update your profile.');
        }
        // Store transaction parameters
        await this.storage.setStorage('pendingTransaction', JSON.stringify({
          ...this.buyDataParams,
          ...expressPayParams,
          bundleName: form.dataCode.volume,
          validity: form.dataCode.validity,
          timestamp: new Date().toISOString()
        }));
        // Initiate payment
        const response = await firstValueFrom(
          this.advansisPayService.expressPayOnline(expressPayParams)
        );

        if (response && response.status === 201 && response.data) {
          await this.browserService.openInAppBrowser(response.data.checkoutUrl);
        } else {
          throw new Error('Failed to initiate payment');
        }
      } catch (error: any) {
        console.error('Payment initiation error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Payment service unavailable';
        this.notification.showError(errorMessage);
      } finally {
        waitingModal.dismiss();
      }
    } else {
      this.notification.showWarn('Please fill all required fields');
    }
  }
}

