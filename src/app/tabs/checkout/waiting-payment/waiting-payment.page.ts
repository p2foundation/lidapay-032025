import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
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
  IonSpinner,
  IonButton,
  IonIcon
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdvansisPayService } from '../../../services/payments/advansis-pay.service';
import { GlobalService } from '../../../services/global.service';
import { App } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { addIcons } from 'ionicons';
import { keypadOutline } from 'ionicons/icons';

addIcons({ keypadOutline });

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
    IonSpinner,
    IonButton
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class WaitingPaymentPage implements OnInit, OnDestroy {
  orderId: string | null = null;
  token: string | null = null;
  loading = true;
  error: string | null = null;
  processingMessage = 'Waiting for USSD authorization... Please check your phone for the payment prompt.';
  isFirstResponse = true;
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
        // This is expected during USSD authorization - don't show as error
        this.processingMessage = 'Waiting for payment authorization... Please complete USSD prompt on your phone.';
        this.loading = true; // Keep loading state instead of showing error
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

        // Handle first response from Express Pay
        if (this.isFirstResponse) {
          this.isFirstResponse = false;
          
          if (status === 'error' && errorMessage) {
            // First response error - show processing message instead of error
            this.processingMessage = 'USSD authorization in progress... Please complete the prompt on your phone.';
            this.global.showToast('Payment processing... Please wait.', 'info', 'bottom', 3000);
            return;
          }

          if (orderId && token) {
            this.orderId = orderId;
            this.token = token;
            this.processingMessage = 'Payment authorized! Processing transaction...';
            this.global.showToast('Payment authorized! Processing...', 'success', 'bottom', 3000);
            this.startPaymentStatusCheck();
          } else {
            // First response missing parameters - show processing message
            this.processingMessage = 'USSD response received. Waiting for authorization...';
            this.global.showToast('USSD response received. Processing...', 'info', 'bottom', 3000);
            // Don't show error yet - wait for more information
            return;
          }
        } else {
          // Subsequent responses - handle normally
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
              this.processingMessage = 'Payment completed successfully! Redirecting...';
              this.global.showToast('Payment completed!', 'success', 'bottom', 2000);
              setTimeout(() => {
                this.router.navigate(['/tabs/checkout'], navigationExtras);
              }, 2000);
              break;
            case 'PENDING':
              this.processingMessage = 'Payment is being processed. Please wait...';
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
              this.processingMessage = 'Processing transaction status...';
              // Wait a bit before checking again
              setTimeout(() => this.startPaymentStatusCheck(), 3000);
          }
        },
        error: (error: any) => {
          console.error('Error checking payment status:', error);
          
          // Don't immediately show error for first few attempts
          if (this.isFirstResponse) {
            this.processingMessage = 'USSD authorization in progress... Please complete the prompt on your phone.';
            this.global.showToast('Payment processing... Please wait.', 'info', 'bottom', 3000);
            // Retry after a delay
            setTimeout(() => this.startPaymentStatusCheck(), 5000);
          } else {
            this.error = 'Error checking payment status';
            this.loading = false;
            this.global.showToast(this.error, 'danger', 'bottom', 3000);
            this.router.navigate(['/tabs/home']);
          }
        }
      });
    } catch (error) {
      console.error('Error in payment status check:', error);
      
      if (this.isFirstResponse) {
        this.processingMessage = 'USSD authorization in progress... Please complete the prompt on your phone.';
        this.global.showToast('Payment processing... Please wait.', 'info', 'bottom', 3000);
        // Retry after a delay
        setTimeout(() => this.startPaymentStatusCheck(), 5000);
      } else {
        this.error = 'Error processing payment';
        this.loading = false;
        this.global.showToast(this.error, 'danger', 'bottom', 3000);
        this.router.navigate(['/tabs/home']);
      }
    } finally {
      await loading.dismiss();
    }
  }

  ngOnDestroy() {
    if (this.deepLinkSubscription) {
      this.deepLinkSubscription.remove();
    }
  }

  // Navigation methods
  async goBack() {
    // Add haptic feedback
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      console.log('Haptics not available');
    }
    
    // Navigate back
    this.router.navigate(['/tabs/home']);
  }

  async retryPayment() {
    // Add haptic feedback
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (error) {
      console.log('Haptics not available');
    }
    
    // Reset error state and retry
    this.error = null;
    this.loading = true;
    
    if (this.orderId && this.token) {
      this.startPaymentStatusCheck();
    } else {
      this.error = 'Missing payment information';
      this.loading = false;
    }
  }

  async goHome() {
    // Add haptic feedback
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (error) {
      console.log('Haptics not available');
    }
    
    // Navigate to home
    this.router.navigate(['/tabs/home']);
  }

  async contactSupport() {
    // Add haptic feedback
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      console.log('Haptics not available');
    }
    
    // Show support contact information
    this.global.showToast('Support: support@lidapay.com', 'info', 'bottom', 4000);
  }
} 