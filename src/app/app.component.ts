import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  IonApp,
  IonRouterOutlet,
  Platform,
  NavController,
} from '@ionic/angular/standalone';
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';
import { App } from '@capacitor/app';
import { GlobalService } from './services/global.service';
import { addIcons } from 'ionicons';
import {
  sendOutline,
  flashOutline,
  shieldCheckmarkOutline,
  callOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
  logoGoogle,
  logoApple,
  logoFacebook,
} from 'ionicons/icons';
import { Router } from '@angular/router';
import { AdvansisPayService } from './services/payments/advansis-pay.service';
import { StorageService } from './services/storage.service';

interface TransactionResponse {
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  result: any;
  resultText?: string;
  orderId: string;
  amount: number;
  currency: string;
  transactionId: string;
}

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit, OnDestroy {
  constructor(
    private platform: Platform,
    private navCtrl: NavController,
    private advansisPayService: AdvansisPayService,
    private router: Router,
    private global: GlobalService,
    private storage: StorageService
  ) {
    this.initializeApp();
    // Register the icons
    addIcons({
      'send-outline': sendOutline,
      'flash-outline': flashOutline,
      'shield-checkmark-outline': shieldCheckmarkOutline,
      'call-outline': callOutline,
      'lock-closed-outline': lockClosedOutline,
      'eye-outline': eyeOutline,
      'eye-off-outline': eyeOffOutline,
      'logo-google': logoGoogle,
      'logo-apple': logoApple,
      'logo-facebook': logoFacebook,
    });
  }

  async initializeApp() {
    this.platform.ready().then(async () => {
      this.global.customStatusbar();
      // SplashScreen.hide();

      // Setup keyboard listeners
      await this.setupKeyboardListeners();

      // Setup app state listeners
      await this.setupAppStateListeners();
    });

    // Setup deep linking
    this.setupDeepLinking();
    console.log('[Deep linking service initiated]');
  }

  private async setupKeyboardListeners() {
    if (Capacitor.isNativePlatform()) {
      Keyboard.addListener('keyboardWillShow', () => {
        console.log('Keyboard will show');
      });

      Keyboard.addListener('keyboardDidShow', () => {
        console.log('Keyboard did show');
      });

      Keyboard.addListener('keyboardWillHide', () => {
        console.log('Keyboard will hide');
      });

      Keyboard.addListener('keyboardDidHide', () => {
        console.log('Keyboard did hide');
      });
    }
  }

  private async setupAppStateListeners() {
    if (Capacitor.isNativePlatform()) {
      App.addListener('appStateChange', ({ isActive }) => {
        console.log('App state changed. Is active?', isActive);
      });

      App.addListener('resume', () => {
        console.log('App resumed');
      });

      App.addListener('pause', () => {
        console.log('App paused');
      });
    }
  }

  setupDeepLinking() {
    console.log('[DeepLinking call]');
    
    // Test deep link handling in development
    if (!Capacitor.isNativePlatform()) {
      console.log('[DEV] Deep linking is in test mode');
      // You can test deep links in browser by manually dispatching the event
      window.addEventListener('deepLink', (event: any) => {
        console.log('[DEV] Test deep link received:', event.detail);
        this.handleDeepLink(event.detail);
      });
    }

    App.addListener('appUrlOpen', (data: { url: string }) => {
      console.log('[Deep link received] URL:', data.url);
      this.handleDeepLink(data.url);
    });
  }

  private handleDeepLink(url: string) {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      console.log('[Payment Flow] Received payment response');
      console.log('[Payment Flow] Path:', path);
      console.log('[Payment Flow] Query params:', Object.fromEntries(urlObj.searchParams));

      if (path == '/redirect-url') {
        const orderId = urlObj.searchParams.get('order-id');
        const token = urlObj.searchParams.get('token');

        if (!orderId || !token) {
          throw new Error('Missing required payment parameters: order-id or token');
        }

        console.log('[Payment Flow] Processing payment response:', { orderId, token });
        this.processPaymentResponse(orderId, token);
      } else {
        console.warn('[Payment Flow] Invalid payment response path:', path);
        this.global.showToast('Invalid payment response', 'warning', 'bottom', 3000);
        this.navCtrl.navigateRoot(['./tabs/home']);
      }
    } catch (error) {
      console.error('[Payment Flow] Error processing payment response:', error);
      this.global.showToast(
        'Error processing payment response',
        'danger',
        'bottom',
        3000
      );
      this.navCtrl.navigateRoot(['./tabs/home']);
    }
  }

  private async processPaymentResponse(token: string, orderId?: string ) {
    console.log('[Payment Flow] Querying transaction status');
    this.advansisPayService.queryStatus(token).subscribe({
      next: async (transactionDetails: TransactionResponse) => {
        console.log('[Payment Flow] Transaction status received:', transactionDetails.status);
        console.log('[Payment Flow] Transaction details:', transactionDetails);

        // Retrieve the pending transaction data
        const pendingTransaction = await this.storage.getStorage('pendingTransaction');
        const topupParams = pendingTransaction ? JSON.parse(pendingTransaction) : {};

        const navigationExtras = {
          queryParams: {
            orderId: orderId,
            token: token,
            special: JSON.stringify({
              ...transactionDetails,
              ...topupParams, // Include all topupParams in the special object
              transType: topupParams.transType || 'AIRTIMETOPUP', // Ensure transType is set
              recipientNumber: topupParams.recipientNumber || topupParams.phoneNumber,
              network: topupParams.network
            }),
          },
        };

        switch (transactionDetails.status) {
          case 'COMPLETED':
            console.log('[Payment Flow] Payment successful, proceeding to checkout');
            this.navCtrl.navigateRoot(['./checkout'], navigationExtras);
            break;
          case 'PENDING':
            console.log('[Payment Flow] Payment still pending, navigating to waiting-payment page');
            this.navCtrl.navigateRoot(['./tabs/checkout/waiting-payment'], {
              queryParams: {
                'order-id': orderId,
                token: token
              }
            });
            break;
          case 'FAILED':
            console.log('[Payment Flow] Payment failed:', transactionDetails.resultText);
            this.global.showToast(
              `Payment failed: ${transactionDetails.resultText}`,
              'danger',
              'bottom',
              3000
            );
            this.navCtrl.navigateRoot(['./tabs/home']);
            break;
          default:
            console.warn('[Payment Flow] Unknown payment status:', transactionDetails.status);
            this.global.showToast(
              'Unknown payment status',
              'warning',
              'bottom',
              3000
            );
            this.navCtrl.navigateRoot(['./tabs/home']);
        }
      },
      error: (error: Error) => {
        console.error('[Payment Flow] Error checking payment status:', error);
        this.global.showToast(
          'Error checking payment status',
          'danger',
          'bottom',
          3000
        );
        this.navCtrl.navigateRoot(['./tabs/home']);
      },
    });
  }

  ngOnInit() {
    // Initialization logic if needed
    console.log('App initialized');
  }

  ngOnDestroy() {
    // Cleanup listeners
    if (Capacitor.isNativePlatform()) {
      Keyboard.removeAllListeners();
      App.removeAllListeners();
    }
  }
}
