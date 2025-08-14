import { Component, OnDestroy, OnInit } from '@angular/core';
import { of, throwError } from 'rxjs';
import {
  IonApp,
  IonRouterOutlet,
  Platform,
  NavController,
} from '@ionic/angular/standalone';
import { environment } from '../environments/environment';
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';
import { App } from '@capacitor/app';
import { GlobalService } from './services/global.service';
import { ThemeService } from './services/theme.service';
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
import { LoadingController, LoadingOptions } from '@ionic/angular';
import { catchError, firstValueFrom } from 'rxjs';

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
    private storage: StorageService,
    private loadingController: LoadingController,
    private themeService: ThemeService
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
        // Process pending transactions when app resumes
        this.processPendingTransaction();
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

      // Add test function to global scope for manual testing
      (window as any).testDeepLink = (url: string) => {
        console.log('[DEV] Testing deep link with URL:', url);
        this.handleDeepLink(url);
      };
    }

    App.addListener('appUrlOpen', (data: { url: string }) => {
      console.log('[Deep link received] URL:', data.url);
      console.log('[Deep link received] URL length:', data.url.length);
      console.log(
        '[Deep link received] URL contains newlines:',
        data.url.includes('%0A')
      );
      console.log(
        '[Deep link received] URL contains spaces:',
        data.url.includes(' ')
      );
      this.handleDeepLink(data.url);
    });
  }

  /**
   * Process a payment using the provided token and order ID
   * @param token Payment token received from the payment gateway
   * @param orderId Order ID associated with the payment
   */
  private async processPaymentWithToken(token: string, orderId: string) {
    let loading: HTMLIonLoadingElement | undefined;
    let retryCount = 0;
    const MAX_RETRIES = 20; // Increased from 15 to 20 (60 seconds total with 3s intervals)
    const RETRY_DELAY = 3000; // 3 seconds
    const INITIAL_DELAY = 10000; // Increased to 10 seconds initial delay
    let lastError: any = null;

    try {
      // Log full token in development and masked in production
      const isDev = !environment.production;
      const tokenLog = isDev
        ? token
        : `${token.substring(0, 5)}...${token.substring(token.length - 3)}`;

      console.log('[Payment Flow] Processing payment with token:', {
        token: tokenLog,
        orderId,
      });

      // Show loading indicator
      loading = await this.loadingController.create({
        message: 'Processing payment. Please wait...',
        spinner: 'circles',
        backdropDismiss: false,
      });
      await loading.present();

      // Initial delay to give time for payment processing
      console.log(
        `[Payment Flow] Waiting ${
          INITIAL_DELAY / 1000
        } seconds before first status check...`
      );
      await new Promise((resolve) => setTimeout(resolve, INITIAL_DELAY));

      // Start polling
      while (retryCount < MAX_RETRIES) {
        retryCount++;
        const attemptMessage = `[Payment Flow] Polling attempt ${retryCount}/${MAX_RETRIES} for order ${orderId}`;
        console.log(attemptMessage);

        try {
          const response = await firstValueFrom(
            this.advansisPayService.queryStatus(token).pipe(
              catchError((error) => {
                // Log the error but don't fail immediately
                console.log('[Payment Flow] Query failed, will retry...', {
                  status: error?.status,
                  message: error?.message,
                  error: error?.error,
                });

                // Store the last error for better error reporting
                lastError = error;

                // Return a pending status to continue retrying
                return of({
                  status: 200,
                  data: {
                    status: 'PENDING',
                    _isError: true,
                    error: error?.error || error?.message || 'Unknown error',
                  },
                });
              })
            )
          );

          console.log('[Payment Flow] Payment status response:', {
            status: response?.status,
            dataStatus: response?.data?.status,
            resultText: response?.data?.resultText,
            isError: response?.data?._isError,
          });
          // Handle QUERY_FAILED specifically
          if (
            response?.data?.resultText?.includes('QUERY_FAILED') ||
            response?.data?.error?.includes('QUERY_FAILED')
          ) {
            console.log('[Payment Flow] Received QUERY_FAILED, will retry...');
            // Don't throw, just continue to the next iteration
          }
          // Handle successful completion
          else if (response?.data?.status === 'COMPLETED') {
            console.log('[Payment Flow] Payment completed successfully');
            await loading.dismiss();
            try {
              await this.router.navigate(['/tabs/checkout'], {
                queryParams: {
                  status: 'success',
                  orderId,
                  token: tokenLog,
                },
              });
            } catch (navError) {
              console.error('Navigation error:', navError);
              // Fallback to home if checkout navigation fails
              this.router.navigate(['/tabs/home']);
            }
            return;
          }
          // Handle explicit failure
          else if (
            response?.data?.status === 'FAILED' ||
            response?.status >= 400
          ) {
            throw new Error(response?.data?.resultText || 'Payment failed');
          }
        } catch (error: any) {
          console.error(
            `[Payment Flow] Error in polling attempt ${retryCount}:`,
            error.message || error
          );
          lastError = error;

          // If we have a specific error message and it's not a retryable error, throw it
          if (
            error.message &&
            !error.message.includes('QUERY_FAILED') &&
            !error.message.includes('Payment failed')
          ) {
            throw error;
          }

          // If this is the last attempt, provide a more detailed error message
          if (retryCount >= MAX_RETRIES) {
            let errorMessage =
              'Payment processing timed out. Please check your transaction status.';
            if (lastError?.message) {
              errorMessage += ` (${lastError.message})`;
            } else if (lastError?.error) {
              errorMessage += ` (${JSON.stringify(lastError.error)})`;
            }
            throw new Error(errorMessage);
          }
        }

        // Wait before next attempt
        if (retryCount < MAX_RETRIES) {
          console.log(
            `[Payment Flow] Waiting ${
              RETRY_DELAY / 1000
            } seconds before next attempt...`
          );
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        }
      }

      // If we've exhausted all retries
      throw new Error(
        'Payment processing timed out. Please check your transaction status.'
      );
    } catch (error: any) {
      console.error('[Payment Flow] Payment processing error:', error);
      await loading?.dismiss();

      // Show appropriate error message
      const errorMessage =
        error?.message ||
        'An error occurred while processing your payment. Please try again.';
      this.global.showToast(errorMessage, 'danger', 'bottom', 5000);

      // Navigate to home or appropriate error page
      this.router.navigate(['/tabs/home']);
    } finally {
      // Ensure loading is always dismissed
      if (loading) {
        await loading
          .dismiss()
          .catch((err) => console.error('Error dismissing loading:', err));
      }
    }
  }

  private async handleDeepLink(url: string) {
    console.log('[Payment Flow] Handling deep link:', url);
    let loading: HTMLIonLoadingElement | undefined;

    try {
      // First, decode the URL to handle encoded characters
      let decodedUrl: string;
      try {
        decodedUrl = decodeURIComponent(url);
      } catch (e) {
        console.warn('Failed to decode URL, using original:', e);
        decodedUrl = url;
      }

      // Clean up the URL by removing newlines and extra spaces
      const cleanedUrl = decodedUrl
        .replace(/[\r\n\t]+/g, '') // Remove all newlines and tabs
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/\s*([?&=])\s*/g, '$1') // Remove spaces around URL separators
        .trim();

      console.log('[Payment Flow] Cleaned URL:', cleanedUrl);

      // Extract parameters using a more robust method
      const getParam = (name: string, url: string): string | null => {
        let regex: RegExp;
        let match: RegExpMatchArray | null;

        try {
          // Try with the exact name first
          regex = new RegExp(`[?&]${name}=([^&]*)`, 'i');
          match = url.match(regex);

          // If not found, try with URL-encoded version
          if (!match?.[1]) {
            const encodedName = encodeURIComponent(name);
            const encodedRegex = new RegExp(`[?&]${encodedName}=([^&]*)`, 'i');
            match = url.match(encodedRegex) || match;
          }

          if (match?.[1]) {
            // Decode the value and clean it up
            const value = decodeURIComponent(
              match[1].replace(/\+/g, ' ')
            ).trim();
            console.log(`[Payment Flow] Found parameter '${name}':`, value);
            return value;
          }
          return null;
        } catch (e) {
          console.error(
            `[Payment Flow] Error extracting parameter '${name}':`,
            e
          );
          return null;
        }
      };

      // Try different parameter name variations
      const token =
        getParam('token', cleanedUrl) ||
        getParam('tok', cleanedUrl) ||
        getParam('paymentToken', cleanedUrl);

      const orderId =
        getParam('orderId', cleanedUrl) ||
        getParam('order-id', cleanedUrl) ||
        getParam('order_id', cleanedUrl) ||
        getParam('orderid', cleanedUrl);

      console.log('[Payment Flow] Parameter extraction results:', {
        url,
        cleanedUrl,
        tokenFound: !!token,
        orderIdFound: !!orderId,
        tokenLength: token?.length,
        orderIdLength: orderId?.length,
      });

      if (!token || !orderId) {
        console.error('[Payment Flow] Missing required parameters in URL');
        console.error('Token found:', !!token, 'Order ID found:', !!orderId);
        console.error('Raw URL:', url);
        console.error('Cleaned URL:', cleanedUrl);

        // Try a more aggressive extraction as a last resort
        const lastResortToken = (url.match(
          /[?&](?:token|tok|paymentToken)=([^&\s]+)/i
        ) || [])[1];
        const lastResortOrderId = (url.match(
          /[?&](?:order[_-]?id|orderId)=([^&\s]+)/i
        ) || [])[1];

        if (lastResortToken && lastResortOrderId) {
          console.warn('[Payment Flow] Using last resort parameter extraction');
          return this.processPaymentWithToken(
            lastResortToken,
            lastResortOrderId
          );
        }

        this.global.showToast(
          'Invalid payment response - missing required parameters',
          'danger',
          'bottom',
          3000
        );
        this.router.navigate(['/tabs/home']);
        return;
      }

      // If we have both token and orderId, process the payment
      return this.processPaymentWithToken(token, orderId);
    } catch (error) {
      console.error('[Payment Flow] Error handling deep link:', error);
      if (loading) {
        await loading.dismiss();
      }
      this.global.showToast(
        'Error processing payment. Please try again.',
        'danger',
        'bottom',
        3000
      );
      this.router.navigate(['/tabs/home']);
    }
  }

  private async checkPaymentStatus(orderId: string, token: string) {
    try {
      // Show loading indicator
      this.global.showLoader('Verifying payment status...');

      // Check payment status
      const result = await this.simulatePaymentCheck(orderId, token);

      // Dismiss loading
      this.global.hideLoader();

      if (result.success && result.data) {
        const paymentData = result.data;

        // Get the pending transaction
        const pendingTx = await this.storage.getStorage('pendingTransaction');
        let txDetails: any = null;
        try {
          txDetails =
            pendingTx && typeof pendingTx === 'string'
              ? JSON.parse(pendingTx)
              : pendingTx;
        } catch (e) {
          console.error(
            '[Payment Flow] Invalid pendingTransaction JSON:',
            pendingTx,
            e
          );
          this.global.showToast(
            'Corrupted transaction data. Please try again.',
            'danger',
            'bottom',
            3000
          );
          this.router.navigate(['/tabs/home']);
          return;
        }

        // Navigate to checkout page with transaction details and payment data
        this.router.navigate(['/tabs/checkout'], {
          queryParams: {
            token: token,
            orderId: orderId,
            status: paymentData.status?.toLowerCase() || 'pending',
          },
          state: {
            transactionDetails: {
              ...txDetails,
              paymentData: paymentData,
            },
          },
        });
      } else {
        // Show error message
        this.global.showToast(
          result.error ||
            'Payment verification failed. Please check your payment and try again.',
          'danger',
          'bottom',
          3000
        );
        this.router.navigate(['/tabs/home']);
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      this.global.hideLoader();
      this.global.showToast(
        'Error verifying payment. Please check your internet connection and try again.',
        'danger',
        'bottom',
        3000
      );
      this.router.navigate(['/tabs/home']);
    }
  }

  private async simulatePaymentCheck(
    orderId: string,
    token: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    return new Promise((resolve) => {
      // Simulate API call delay
      setTimeout(() => {
        // For demo purposes, we'll check if this is the failed order
        if (orderId === 'ADV-MD6DGJJD-249B22FF') {
          resolve({
            success: false,
            error: 'QUERY_FAILED',
            data: {
              status: 'FAILED',
              message: 'Payment query failed',
              orderId: orderId,
              token: token,
            },
          });
        } else {
          // Normal success case
          resolve({
            success: true,
            data: {
              status: 'COMPLETED',
              orderId: orderId,
              token: token,
              amount: 1.0,
              currency: 'GHS',
              transactionId: 'TXN' + Date.now(),
            },
          });
        }
      }, 2000); // 2 second delay to simulate network
    });
  }

  private async processPendingTransaction() {
    try {
      // Retrieve the pending transaction data from storage
      const pendingTransaction = await this.storage.getStorage(
        'pendingTransaction'
      );
      if (!pendingTransaction) {
        console.warn('No pending transaction found');
        return;
      }

      let topupParams: any = null;
      try {
        // Check if it's already an object or needs parsing
        if (typeof pendingTransaction === 'string') {
          topupParams = JSON.parse(pendingTransaction);
        } else {
          topupParams = pendingTransaction;
        }
      } catch (e) {
        console.error(
          '[Payment Flow] Invalid pendingTransaction JSON:',
          pendingTransaction,
          e
        );
        this.global.showToast(
          'Corrupted transaction data. Please try again.',
          'danger',
          'bottom',
          3000
        );
        this.router.navigate(['/tabs/home']);
        return;
      }

      // Check if transaction is too old (older than 24 hours)
      const transactionTime = new Date(topupParams.timestamp || 0);
      const now = new Date();
      const hoursDiff =
        (now.getTime() - transactionTime.getTime()) / (1000 * 60 * 60);

      if (hoursDiff > 24) {
        console.warn(
          'Pending transaction is too old, clearing:',
          hoursDiff,
          'hours old'
        );
        await this.storage.removeStorage('pendingTransaction');
        this.global.showToast(
          'Transaction expired. Please try again.',
          'warning',
          'bottom',
          3000
        );
        this.router.navigate(['/tabs/home']);
        return;
      }

      const navigationExtras = {
        queryParams: {
          orderId: topupParams.orderId,
          token: topupParams.token,
          amount: topupParams.amount,
          recipientNumber: topupParams.recipientNumber,
          network: topupParams.network,
          transType: topupParams.transType,
        },
      };

      // Navigate to the appropriate page based on transaction type
      if (
        topupParams.transType === 'AIRTIMETOPUP' ||
        topupParams.transType === 'DATABUNDLE' ||
        topupParams.transType === 'DATABUNDLELIST' ||
        topupParams.transType === 'GLOBALAIRTOPUP'
      ) {
        this.router.navigate(
          ['/tabs/checkout/waiting-payment'],
          navigationExtras
        );
      } else {
        console.warn('Unknown transaction type:', topupParams.transType);
        this.router.navigate(['/tabs/home']);
      }
    } catch (error) {
      console.error('Error processing pending transaction:', error);
      this.global.showToast(
        'Error processing transaction',
        'danger',
        'bottom',
        3000
      );
      this.router.navigate(['/tabs/home']);
    }
  }

  ngOnInit() {
    // Initialization logic if needed
    console.log('App initialized');

    // Process any pending transactions when app starts
    this.processPendingTransaction();
  }

  ngOnDestroy() {
    // Cleanup listeners
    if (Capacitor.isNativePlatform()) {
      Keyboard.removeAllListeners();
      App.removeAllListeners();
    }
  }
}
