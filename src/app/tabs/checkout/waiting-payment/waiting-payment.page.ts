import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  IonButton,
  LoadingController,
  ToastController,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdvansisPayService } from 'src/app/services/payments/advansis-pay.service';
import { GlobalService } from 'src/app/services/global.service';
import { App } from '@capacitor/app';

@Component({
  selector: 'app-waiting-payment',
  templateUrl: './waiting-payment.page.html',
  styleUrls: ['./waiting-payment.page.scss'],
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
    IonButton,
  ],
})
export class WaitingPaymentPage implements OnInit, OnDestroy {
  orderId: string | null = null;
  token: string | null = null;
  loading = true;
  error: string | null = null;
  private deepLinkSubscription: any;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private advansPayService: AdvansisPayService,
    private global: GlobalService,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.setupDeepLinkListener();
    this.route.queryParams.subscribe(params => {
      this.orderId = params['order-id'];
      this.token = params['token'];

      if (this.orderId && this.token) {
        this.startPaymentStatusCheck();
      } else {
        this.error = 'Missing payment information';
        this.loading = false;
      }
    });
  }

  private setupDeepLinkListener() {
    this.deepLinkSubscription = App.addListener('appUrlOpen', (data: { url: string }) => {
      console.log('Deep link received in waiting page:', data);
      const url = new URL(data.url);
      const path = url.pathname;

      if (path === '/redirect-url') {
        // Clean up the parameters by removing whitespace and newlines
        const orderId = url.searchParams.get('orderId')?.trim();
        const token = url.searchParams.get('token')?.trim();
        const status = url.searchParams.get('status')?.trim();
        const errorMessage = url.searchParams.get('errorMessage')?.trim();

        if (status === 'error' && errorMessage) {
          this.error = errorMessage;
          this.loading = false;
          this.global.showToast(errorMessage, 'danger', 'bottom', 3000);
          return;
        }

        if (orderId && token) {
          this.orderId = orderId;
          this.token = token;
          this.startPaymentStatusCheck();
        } else {
          this.error = 'Invalid payment response';
          this.loading = false;
        }
      }
    });
  }

  private async startPaymentStatusCheck() {
    const loading = await this.loadingController.create({
      message: 'Processing payment...',
      spinner: 'circles'
    });
    await loading.present();

    try {
      this.advansPayService.queryStatus(this.token!).subscribe({
        next: (transactionDetails) => {
          console.log('Transaction Details:', transactionDetails);
          
          const navigationExtras = {
            queryParams: {
              orderId: this.orderId,
              token: this.token,
              special: JSON.stringify(transactionDetails),
            },
          };

          switch (transactionDetails.status) {
            case 'COMPLETED':
              this.router.navigate(['/tabs/checkout'], navigationExtras);
              break;
            case 'PENDING':
              // Keep checking status
              setTimeout(() => this.startPaymentStatusCheck(), 5000);
              break;
            case 'FAILED':
              this.error = transactionDetails.resultText || 'Transaction failed';
              this.loading = false;
              this.global.showToast(this.error, 'danger', 'bottom', 3000);
              this.router.navigate(['/tabs/home']);
              break;
            default:
              this.error = 'Unknown transaction status';
              this.loading = false;
              this.global.showToast(this.error, 'warning', 'bottom', 3000);
              this.router.navigate(['/tabs/home']);
          }
        },
        error: (error) => {
          console.error('Error checking payment status:', error);
          this.error = 'Error checking payment status';
          this.loading = false;
          this.global.showToast(this.error, 'danger', 'bottom', 3000);
          this.router.navigate(['/tabs/home']);
        }
      });
    } catch (error) {
      console.error('Error in payment status check:', error);
      this.error = 'Error processing payment';
      this.loading = false;
      this.global.showToast(this.error, 'danger', 'bottom', 3000);
      this.router.navigate(['/tabs/home']);
    } finally {
      await loading.dismiss();
    }
  }

  ngOnDestroy() {
    if (this.deepLinkSubscription) {
      this.deepLinkSubscription.remove();
    }
  }
} 