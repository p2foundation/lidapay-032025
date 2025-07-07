import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSpinner,
  LoadingController,
  ToastController,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute, Router, NavigationExtras } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { NotificationService } from 'src/app/services/notification.service';
import { AirtimeService } from 'src/app/services/one4all/airtime.service';
import { InternetDataService } from 'src/app/services/one4all/internet.data.service';
import { AdvansisPayService } from 'src/app/services/payments/advansis-pay.service';
import { MobileMoneyService } from 'src/app/services/payments/mobile.money.service';
import { ReloadlyAirtimeService } from 'src/app/services/reloadly/reloadly-airtime.service';
import { StorageService } from 'src/app/services/storage.service';

interface TransactionData {
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  transType: 'AIRTIMETOPUP' | 'DATABUNDLELIST' | 'GLOBALAIRTOPUP';
  result: any;
  resultText: string;
  orderId: string;
  amount: number;
  currency: string;
  transactionId: string;
  recipientNumber?: string;
  network?: string;
}

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.page.html',
  styleUrls: ['./checkout.page.scss'],
  standalone: true,
  imports: [
    IonBackButton,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    TranslateModule,
    IonButtons,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonSpinner,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CheckoutPage implements OnInit {
  data: TransactionData | null = null;
  processingMessage = 'Processing transaction...';
  checkoutForm!: FormGroup;
  token: string | null = null; // To hold the token from query params

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private storage: StorageService,
    private paymentServices: MobileMoneyService,
    private airtimeServices: AirtimeService,
    private internetService: InternetDataService,
    public loadingController: LoadingController,
    private notification: NotificationService,
    private advansPayService: AdvansisPayService,
    private reloadlyAirtimeService: ReloadlyAirtimeService,
    private toastCtrl: ToastController
  ) {
    this.route.queryParams.subscribe((params) => {
      if (params && params['special']) {
        this.data = JSON.parse(params['special']);
        console.log(`Transaction Details <==> ${JSON.stringify(this.data)}`);
        this.processTransaction();
      }
      // Get the token from query params
      this.token = params['token'] || null;
    });
  }

  ngOnInit() {
    this.checkoutForm = this.formBuilder.group({
      recipientNumber: ['', [Validators.required, Validators.minLength(10)]],
      walletAccount: ['', [Validators.required, Validators.minLength(10)]],
      amount: ['', Validators.required],
      channel: ['', Validators.required],
      description: [null],
    });
    // Handle redirect from payment
    this.route.queryParams.subscribe(async (params) => {
      if (params['token']) {
        const token = params['token'];
        const status = params['status'];

        try {
          // Show loading
          const loading = await this.loadingController.create({
            message: 'Processing payment...'
          });
          await loading.present();
   
          // Get pending transaction details
          const pendingTx = await this.storage.getStorage('pendingTransaction');
          const txDetails = JSON.parse(pendingTx || '{}');

          if (status === 'success') {
            // Process the transaction based on type
            switch (txDetails.transType) {
              case 'GLOBALAIRTOPUP':
                await this.makeReloadlyAirtimeTopup(txDetails);
                break;
              case 'AIRTIMETOPUP':
                await this.creditCustomerAirtime(txDetails);
                break;
              // Add other cases
              case 'DATABUNDLELIST':
                await this.buyInternetData(txDetails);
                break;
                
            }

            // Navigate to receipt
            await this.navigateToReceipt(txDetails);
          } else {
            // Handle failed payment
            await this.navigateToError({
              message: 'Payment failed',
              details: status
            });
          }

          await loading.dismiss();
        } catch (error) {
          console.error('Checkout error:', error);
          await this.navigateToError(error);
        }
      }
    });
    
  }

  async processTransaction() {
    if (!this.data) {
      console.error('No transaction data available');
      return;
    }

    try {
      switch (this.data.transType) {
        case 'AIRTIMETOPUP':
          await this.creditCustomerAirtime({
            amount: this.data.amount,
            recipientNumber: this.data.recipientNumber,
            network: this.data.network
          });
          break;
        case 'DATABUNDLELIST':
          await this.buyInternetData({
            amount: this.data.amount,
            recipientNumber: this.data.recipientNumber,
            network: this.data.network
          });
          break;
        case 'GLOBALAIRTOPUP':
          await this.buyGlobalAirtime({
            amount: this.data.amount,
            recipientNumber: this.data.recipientNumber,
            network: this.data.network
          });
          break;
        default:
          console.error('Unknown transaction type:', this.data.transType);
          this.processingMessage = 'Unknown transaction type';
          break;
      }
    } catch (error) {
      console.error('Transaction processing error:', error);
      this.processingMessage = 'Failed to process transaction';
      await this.navigateToError(error);
    }
  }

  goToHome() {
    this.router.navigate(['/tabs/home']);
  }

  private async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  // Method to query transaction status (if needed in other contexts)
  queryTransactionStatus(token: string) {
    this.showLoader();
    this.advansPayService.queryStatus(token).subscribe({
      next: (transactionDetails) => {
        console.log('Transaction Details:', transactionDetails);
        if (transactionDetails.status === 'COMPLETED') {
          this.handlePaymentResponse(this.data);
        } else {
          this.notification.showError(
            'Transaction not completed: ' + transactionDetails.resultText
          );
        }
      },
      error: (err) => {
        this.hideLoader();
        console.error('Error fetching transaction status:', err);
        this.notification.showError('Failed to fetch transaction status.');
      },
      complete: () => {
        this.hideLoader();
      },
    });
  }

  handlePaymentResponse(payRes: any) {
    this.hideLoader();
    if (!this.data) {
      this.notification.showError('No transaction data available');
      return;
    }

    if (payRes.code === '000' && payRes.status === 'COMPLETED') {
      console.log(`successful momo debit ==> ${payRes.status}`);
      if (this.data.transType === 'AIRTIMETOPUP') {
        this.creditCustomerAirtime(this.data);
      } else if (this.data.transType === 'DATABUNDLELIST') {
        this.buyInternetData(this.data);
      } else {
        this.makeReloadlyAirtimeTopup(this.data);
      }
    } else {
      // Redirect to waiting page with payment details
      const navigationExtras = {
        queryParams: {
          'order-id': payRes.orderId,
          token: payRes.token
        }
      };
      this.router.navigate(['/tabs/checkout/waiting-payment'], navigationExtras);
    }
  }

  // Modified Reloadly topup method
  async makeReloadlyAirtimeTopup(matData: any) {
    try {
      this.processingMessage = 'Processing global airtime topup...';
      const matRes = await firstValueFrom(this.reloadlyAirtimeService.makeAirtimeTopup(matData));

      const receiptData = {
        ...matRes,
        ...matData,
        transactionDate: new Date().toISOString()
      };

      if (matRes.status === 'SUCCESSFUL') {
        this.processingMessage = 'Global airtime topup successful!';
        await this.navigateToReceipt(receiptData);
      } else {
        this.processingMessage = 'Transaction completed but topup pending';
        await this.navigateToReceipt(receiptData);
      }
    } catch (error) {
      console.error('Reloadly topup error:', error);
      this.processingMessage = 'Failed to process global airtime topup';
      await this.navigateToError(error);
    }
  }

  // Modified Airtime credit method
  async creditCustomerAirtime(formData: any) {
    try {
      this.processingMessage = 'Crediting airtime...';
      const airRes = await firstValueFrom(this.airtimeServices.buyAirtimeTopup(formData));
      
      const receiptData = {
        ...airRes,
        ...formData,
        transactionDate: new Date().toISOString(),
        transactionType: 'Airtime Purchase'
      };

      if (airRes?.status === 'OK') {
        this.processingMessage = 'Airtime credited successfully!';
        await this.navigateToReceipt(receiptData);
      } else {
        this.processingMessage = 'Transaction completed with status: ' + (airRes?.status || 'UNKNOWN');
        await this.navigateToReceipt(receiptData);
      }
    } catch (error) {
      console.error('Airtime Error:', error);
      this.processingMessage = 'Failed to process airtime purchase';
      await this.navigateToError(error);
    }
  }

  // Modified Internet data purchase method
  async buyInternetData(bidData: any) {
    try {
      this.processingMessage = 'Processing internet bundle...';
      const bidRes = await firstValueFrom(this.internetService.buyInternetData(bidData));
      
      const receiptData = {
        ...bidRes,
        ...bidData,
        transactionDate: new Date().toISOString(),
        transactionType: 'Internet Bundle Purchase'
      };

      if (bidRes.status === 'OK') {
        this.processingMessage = 'Internet bundle purchased successfully!';
        await this.navigateToReceipt(receiptData);
      } else {
        this.processingMessage = 'Transaction completed with status: ' + bidRes.status;
        await this.navigateToReceipt(receiptData);
      }
    } catch (error) {
      console.error('Buy Internet Data Error:', error);
      this.processingMessage = 'Failed to process internet bundle purchase';
      await this.navigateToError(error);
    }
  }

  // Helper methods for navigation
  private async navigateToReceipt(data: any) {
    const navigationExtras: NavigationExtras = {
      queryParams: {
        special: JSON.stringify(data)
      }
    };
    await this.router.navigate(['./tabs/receipt'], navigationExtras);
  }

  private async navigateToError(error: any) {
    await this.router.navigate(['./paymenterror'], {
      queryParams: { special: JSON.stringify(error) }
    });
  }

  // Query Params
  openDetailsWithQueryParams(paydata: any) {
    const navigationExtras: NavigationExtras = {
      queryParams: {
        special: JSON.stringify(paydata),
      },
    };
    this.router.navigate(['./paymenterror'], navigationExtras);
  }

  async showLoader() {
    const loader = await this.loadingController.create({
      message: 'Processing Request',
    });
    await loader.present();
    loader.onDidDismiss().then(() => {
      console.log('Loading dismissed!');
    });
  }

  hideLoader() {
    this.loadingController.dismiss();
  }

  async buyGlobalAirtime(formData: any) {
    try {
      this.processingMessage = 'Processing global airtime topup...';
      const airRes = await firstValueFrom(this.reloadlyAirtimeService.makeAirtimeTopup(formData));
      
      const receiptData = {
        ...formData,
        transactionDate: new Date().toISOString(),
        transactionType: 'Global Airtime Topup',
        status: airRes?.status || 'UNKNOWN',
        resultText: airRes?.message || 'Transaction completed'
      };

      if (airRes?.status === 'OK') {
        this.processingMessage = 'Global airtime credited successfully!';
        await this.navigateToReceipt(receiptData);
      } else {
        this.processingMessage = 'Transaction completed with status: ' + (airRes?.status || 'UNKNOWN');
        await this.navigateToReceipt(receiptData);
      }
    } catch (error) {
      console.error('Global Airtime Error:', error);
      this.processingMessage = 'Failed to process global airtime purchase';
      await this.navigateToError(error);
    }
  }

  async ionViewWillEnter() {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      const state = navigation.extras.state as TransactionData;
      if (state) {
        this.data = state;
        this.processingMessage = 'Starting transaction...';
        await this.processTransaction();
      }
    }
  }
}
