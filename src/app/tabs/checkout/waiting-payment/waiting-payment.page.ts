import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  LoadingController, 
  ToastController,
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
  IonCardSubtitle,
  IonSpinner,
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonIcon
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdvansisPayService } from '../../../services/payments/advansis-pay.service';
import { GlobalService } from '../../../services/global.service';
import { App } from '@capacitor/app';

@Component({
  selector: 'app-waiting-payment',
  templateUrl: './waiting-payment.page.html',
  styleUrls: ['./waiting-payment.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
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
    IonCardSubtitle,
    IonSpinner,
    IonButton,
    IonList,
    IonItem,
    IonLabel,
    IonIcon
  ]
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
      
      // Clean the URL by removing newlines and extra spaces
      const cleanedUrl = data.url.replace(/%0A/g, '').replace(/\s+/g, '');
      console.log('Cleaned URL in waiting page:', cleanedUrl);
      
      const url = new URL(cleanedUrl);
      const path = url.pathname;

      if (path === '/redirect-url') {
        // Try both parameter names since the URL might use either
        const orderId = url.searchParams.get('order-id') || url.searchParams.get('orderId');
        const token = url.searchParams.get('token');
        const status = url.searchParams.get('status');
        const errorMessage = url.searchParams.get('errorMessage');

        console.log('Extracted parameters in waiting page:', { orderId, token, status, errorMessage });

        if (status === 'error' && errorMessage) {
          this.error = decodeURIComponent(errorMessage);
          this.loading = false;
          this.global.showToast(this.error, 'danger', 'bottom', 3000);
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
        next: (transactionDetails: any) => {
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
        error: (error: any) => {
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