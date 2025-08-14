import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
  IonSpinner
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router, NavigationExtras } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { AirtimeService } from '../../services/one4all/airtime.service';
import { InternetDataService } from '../../services/one4all/internet.data.service';
import { AdvansisPayService } from '../../services/payments/advansis-pay.service';
import { MobileMoneyService } from '../../services/payments/mobile.money.service';
import { ReloadlyAirtimeService } from '../../services/reloadly/reloadly-airtime.service';
import { StorageService } from '../../services/storage.service';
import { GlobalService } from '../../services/global.service';
import { PhoneValidationService } from '../../services/utils/phone-validation.service';

interface ApiResponse {
  status: string;
  message?: string;
  [key: string]: any;
}

interface AirtimeTopupResponse {
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  message?: string;
  transactionId?: string;
  amount?: number;
  currency?: string;
  recipientNumber?: string;
  network?: string;
  timestamp?: string;
}

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
  retryCount?: number;
  [key: string]: any; // For any additional properties
}

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.page.html',
  styleUrls: ['./checkout.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
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
    IonSpinner
  ]
})
export class CheckoutPage implements OnInit {
  // Class properties
  data: TransactionData | null = null;
  processingMessage = 'Processing transaction...';
  checkoutForm!: FormGroup;
  token: string | null = null;
  private loading: HTMLIonLoadingElement | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private storage: StorageService,
    private paymentServices: MobileMoneyService,
    private airtimeServices: AirtimeService,
    private internetService: InternetDataService,
    private reloadlyAirtimeService: ReloadlyAirtimeService,
    private loadingController: LoadingController,
    private notification: NotificationService,
    private advansPayService: AdvansisPayService,
    private globalService: GlobalService,
    private translate: TranslateService,
    private toastCtrl: ToastController,
    private phoneValidationService: PhoneValidationService
  ) {

    this.route.queryParams.subscribe((params) => {
      if (params && params['special']) {
        this.data = JSON.parse(params['special']);
        console.log('Transaction Details:', this.data);
        try { console.log('Transaction Details (JSON):', JSON.stringify(this.data, null, 2)); } catch (e) {}
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
    
    // Handle successful payment redirect
    this.route.queryParams.subscribe(async (params) => {
      if (params['status'] === 'success' && params['token'] && params['orderId']) {
        try {
          // Show loading indicator
          await this.showLoader('Processing your transaction...');
          
          // Get the transaction data from storage
          const pendingTx = await this.storage.getStorage('pendingTransaction');
          const txDetails = pendingTx && typeof pendingTx === 'string' 
            ? JSON.parse(pendingTx) 
            : pendingTx;
          if (!txDetails) {
            console.error('No transaction data found:', txDetails);
            throw new Error('No transaction data found');
          }
          // Set the transaction data and process it
          this.data = txDetails;
          console.log('Loaded transaction data:', txDetails);
          try { console.log('Loaded transaction data (JSON):', JSON.stringify(txDetails, null, 2)); } catch (e) {}
          await this.processTransaction();
          
        } catch (error) {
          console.error('Error processing transaction:', error);
          await this.navigateToError({
            message: 'Transaction processing failed',
            details: error instanceof Error ? error.message : 'Unknown error'
          });
        } finally {
          await this.hideLoader();
        }
      } else if (params['token']) {
        // Handle legacy flow if needed
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
          let txDetails: any = null;
          try {
            txDetails = pendingTx && typeof pendingTx === 'string' ? JSON.parse(pendingTx) : pendingTx;
          } catch (e) {
            console.error('[Checkout] Invalid pendingTransaction JSON:', pendingTx, e);
            try { console.error('PendingTx (JSON):', JSON.stringify(pendingTx, null, 2)); } catch (err) {}
            await this.showToast('Corrupted transaction data. Please try again.', 'danger');
            this.router.navigate(['/tabs/home']);
            return;
          }

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
    const loading = await this.showLoader('Processing transaction...');
    
    try {
      if (!this.data) {
        throw new Error('No transaction data available');
      }

      console.log(`Processing transaction of type: ${this.data.transType}`);
      try { console.log('Transaction data (JSON):', JSON.stringify(this.data, null, 2)); } catch (e) {}
      
      let result;
      switch (this.data.transType) {
        case 'AIRTIMETOPUP':
          result = await this.creditCustomerAirtime({
            amount: this.data.amount,
            recipientNumber: this.data.recipientNumber,
            network: this.data.network
          });
          break;
          
        case 'DATABUNDLELIST':
          result = await this.buyInternetData({
            amount: this.data.amount,
            recipientNumber: this.data.recipientNumber,
            network: this.data.network
          });
          break;
          
        case 'GLOBALAIRTOPUP':
          result = await this.buyGlobalAirtime({
            amount: this.data.amount,
            recipientNumber: this.data.recipientNumber,
            network: this.data.network
          });
          break;
          
        default:
          throw new Error(`Unknown transaction type: ${this.data.transType}`);
      }

      console.log('Transaction processed successfully:', result);
      try { console.log('Transaction processed successfully (JSON):', JSON.stringify(result, null, 2)); } catch (e) {}
      
      // If we have a result, navigate to receipt
      if (result) {
        const success = await this.navigateToReceipt({
          ...result,
          status: 'COMPLETED',
          timestamp: new Date().toISOString()
        });
        
        if (!success) {
          throw new Error('Failed to navigate to receipt page');
        }
      } else {
        throw new Error('No result from transaction processing');
      }
      
    } catch (error) {
      console.error('Transaction processing error:', error);
      try { console.error('Transaction processing error (JSON):', JSON.stringify(error, Object.getOwnPropertyNames(error))); } catch (e) {}
      this.processingMessage = 'Failed to process transaction';
      
      // Try to navigate to error page
      const errorNavSuccess = await this.navigateToError({
        message: 'Transaction processing failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        originalError: error
      });
      
      // If error navigation failed, show error in console
      if (!errorNavSuccess) {
        console.error('Failed to navigate to error page');
      }
    } finally {
      // Always make sure to hide the loader
      await this.hideLoader();
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
  async queryTransactionStatus(token: string) {
    try {
      await this.showLoader();
      const transactionDetails = await firstValueFrom(this.advansPayService.queryStatus(token));
        console.log('Transaction Details:', transactionDetails);
      
      if (transactionDetails && transactionDetails.status === 'COMPLETED') {
        await this.handlePaymentResponse(transactionDetails);
      } else {
        const errorMessage = transactionDetails?.resultText || 'Transaction not completed';
        this.notification.showError(errorMessage);
      }
    } catch (err: any) {
      console.error('Error fetching transaction status:', err);
      const errorMessage = err?.error?.message || 'Failed to fetch transaction status';
      this.notification.showError(errorMessage);
    } finally {
      await this.hideLoader();
    }
  }

  private async handlePaymentResponse(payRes: any, loading?: HTMLIonLoadingElement) {
    try {
      if (!this.data) {
        throw new Error('No transaction data available');
      }

      if (payRes.code === '000' && payRes.status === 'COMPLETED') {
        console.log(`Successful payment processing: ${payRes.status}`);
        
        // Process the transaction based on type
        switch (this.data.transType) {
          case 'AIRTIMETOPUP':
            await this.creditCustomerAirtime(this.data);
            break;
          case 'DATABUNDLELIST':
            await this.buyInternetData(this.data);
            break;
          case 'GLOBALAIRTOPUP':
            await this.buyGlobalAirtime(this.data);
            break;
        }
        
        // Clear pending transaction after successful processing
        await this.storage.removeStorage('pendingTransaction');
        
        // Navigate to receipt with transaction details
        await this.navigateToReceipt({
          ...payRes,
          status: 'COMPLETED',
          timestamp: new Date().toISOString()
        });
      } else {
        throw new Error(payRes.resultText || 'Payment processing failed');
      }
    } catch (error) {
      console.error('Error handling payment response:', error);
      await this.navigateToError({
        message: 'Error processing payment',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      if (loading) {
        await loading.dismiss();
      }
    }
  }

  // Network mapping for validation
  private readonly NETWORK_MAPPING: {[key: string]: number} = {
    'UNKNOWN': 0,
    'AIRTELTIGO': 1,
    'EXPRESSO': 2,
    'GLO': 3,
    'MTN': 4,
    'TiGO': 5,
    'TELECEL': 6,
    'BUSY': 8,
    'SURFLINE': 9
  }

  private readonly REVERSE_NETWORK_MAPPING: {[key: number]: string} = {
    0: 'UNKNOWN',
    1: 'AIRTELTIGO',
    2: 'EXPRESSO',
    3: 'GLO',
    4: 'MTN',
    5: 'TiGO',
    6: 'TELECEL',
    8: 'BUSY',
    9: 'SURFLINE'
  };

  // Process airtime topup with enhanced validation and error handling
  private async creditCustomerAirtime(data: any, retryCount: number = 0): Promise<AirtimeTopupResponse> {
    const MAX_RETRIES = 2;
    const RETRY_DELAY = 2000; // 2 seconds
    
    // Helper function to create error response
    const createErrorResponse = (message: string, errorData: any = {}) => {
      console.error('Airtime topup error:', message, errorData);
      this.notification.showError(message);
      
      return {
        status: 'FAILED' as const,
        message: message,
        amount: data.amount,
        currency: data.currency,
        recipientNumber: data.recipientNumber,
        network: data.network,
        timestamp: new Date().toISOString()
      };
    };
    
    try {
      // Validate required fields
      let recipientNumber = data.recipientNumber;
      
      // Handle phone number validation for Ghanaian numbers using the enhanced validation service
      if (!recipientNumber || typeof recipientNumber !== 'string') {
        return createErrorResponse('Please provide a valid phone number');
      }
      
      // Use the enhanced phone validation service for pre-payment validation
      const phoneValidation = this.phoneValidationService.validateGhanaPhoneNumberForPayment(recipientNumber);
      
      if (!phoneValidation.isValid) {
        // Show warning if sanitization was needed
        if (phoneValidation.warning) {
          console.log(phoneValidation.warning);
          // You can optionally show this warning to the user
        }
        
        return createErrorResponse(phoneValidation.error || 'Invalid phone number format');
      }
      
      // Use the sanitized and validated phone number
      recipientNumber = phoneValidation.sanitized;
      
      // Convert to standard format for API (233 format)
      if (recipientNumber.length === 10 && recipientNumber.startsWith('0')) {
        // Convert 0244588584 -> 233244588584
        recipientNumber = '233' + recipientNumber.slice(1);
      } else if (recipientNumber.length === 9) {
        // Convert 244588584 -> 233244588584
        recipientNumber = '233' + recipientNumber;
      } else if (recipientNumber.length === 13 && recipientNumber.startsWith('233')) {
        // Remove + from +233244588584 -> 233244588584
        recipientNumber = recipientNumber.slice(1);
      }
      
      // Update the data with the formatted phone number
      data.recipientNumber = recipientNumber;
      
      const amount = Number(data.amount);
      if (isNaN(amount) || amount <= 0) {
        return createErrorResponse('Please enter a valid amount greater than 0');
      }
      
      // Convert network to number if it's a string
      let networkId: number;
      if (typeof data.network === 'string') {
        // Accept both network name and numeric string
        if (!isNaN(Number(data.network))) {
          networkId = Number(data.network);
        } else {
          networkId = this.NETWORK_MAPPING[data.network.toUpperCase()];
        }
        if (networkId === undefined) {
          return createErrorResponse('Invalid network selected. Please choose a valid network.');
        }
      } else if (typeof data.network === 'number') {
        networkId = data.network;
        // Validate if network ID is valid
        if (!Object.values(this.NETWORK_MAPPING).includes(networkId)) {
          return createErrorResponse('Invalid network ID. Please try again or contact support.');
        }
      } else {
        return createErrorResponse('Network information is missing. Please select a network and try again.');
      }
      
      this.processingMessage = 'Processing airtime topup...';
      
      // Prepare the request payload
      const requestPayload = {
        recipientNumber: data.recipientNumber,
        amount: amount.toString(),
        network: networkId // Always a number
      };
      
      console.log('Initiating airtime topup with data:', JSON.stringify(requestPayload, null, 2));
      
      const result = await firstValueFrom(this.airtimeServices.buyAirtimeTopup(requestPayload));
      
      if (!result) {
        return createErrorResponse('No response received from the airtime service');
      }
      
      console.log('Airtime topup response:', JSON.stringify(result, null, 2));
      
      // Validate response structure
      if (typeof result !== 'object') {
        return createErrorResponse('Invalid response format from airtime service', { response: result });
      }
      
      const response: any = result;
      
      if (response.status === 'OK' || response.status === 'SUCCESS') {
        // Format the success message to exclude balance information
        let successMessage = response.message || 'Airtime topup successful!';
        // Remove the balance information from the message if it exists
        successMessage = successMessage.replace(/,?\s*and your current balance is.*$/, '');
        this.processingMessage = successMessage;
        const receiptData = {
          status: 'COMPLETED',
          message: successMessage,
          transactionId: response.transactionId || response.trxn || data.transactionId,
          orderId: data.orderId,
          amount: amount,
          currency: data.currency || 'GHS',
          recipientNumber: data.recipientNumber,
          network: this.REVERSE_NETWORK_MAPPING[networkId] || 'UNKNOWN',
          timestamp: new Date().toISOString(),
          ...(response.localTrxnCode && { localTrxnCode: response.localTrxnCode }),
          ...(response.balance_after && { balanceAfter: response.balance_after })
        };
        console.log('Calling navigateToReceipt with:', receiptData); // ADD LOG

        // Navigate to receipt with the transaction data
        await this.navigateToReceipt(receiptData);

        return {
          status: 'SUCCESS',
          ...receiptData
        };
      } 
      
      // Handle pending status with retry
      if (response.status === 'PENDING' && retryCount < MAX_RETRIES) {
        console.log(`Transaction pending, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
        this.processingMessage = `Processing (${retryCount + 1}/${MAX_RETRIES})...`;
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return this.creditCustomerAirtime(data, retryCount + 1);
      }
      
      // Handle failed status or max retries
      const errorMessage = response.message || 'Failed to process airtime topup. Please try again.';
      return createErrorResponse(errorMessage, { response });
      
    } catch (err) {
      const error = err as Error & { code?: string; status?: number; message?: string; error?: any };
      
      // Handle network errors with retry
      if ((error.code === 'NETWORK_ERROR' || error.status === 0) && retryCount < MAX_RETRIES) {
        console.log(`Network error, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
        this.processingMessage = `Network issue, retrying (${retryCount + 1}/${MAX_RETRIES})...`;
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return this.creditCustomerAirtime(data, retryCount + 1);
      }
      
      // Handle specific backend errors
      if (error.error?.message?.includes('Network not found')) {
        return createErrorResponse('The selected network is not available. Please try again or contact support.');
      }
      
      // Handle other errors
      const errorMessage = error.message || 'An unexpected error occurred. Please try again.';
      return createErrorResponse(errorMessage, { error });
    }
    // Final fallback return to satisfy linter (should not be reached)
    return createErrorResponse('Unknown error occurred in creditCustomerAirtime');
  }

  // Process internet data purchase
  private async buyInternetData(data: any): Promise<any> {
    try {
      this.processingMessage = 'Processing internet data purchase...';
      return await firstValueFrom(this.internetService.buyInternetData(data));
    } catch (error) {
      console.error('Internet data purchase error:', error);
      try { console.error('Internet data purchase error (JSON):', JSON.stringify(error, Object.getOwnPropertyNames(error))); } catch (e) {}
      throw error;
    }
  }

  // Process global airtime topup
  private async makeReloadlyAirtimeTopup(data: any): Promise<any> {
    try {
      this.processingMessage = 'Processing global airtime topup...';
      return await firstValueFrom(this.reloadlyAirtimeService.makeAirtimeTopup(data));
    } catch (error) {
      console.error('Global airtime topup error:', error);
      try { console.error('Global airtime topup error (JSON):', JSON.stringify(error, Object.getOwnPropertyNames(error))); } catch (e) {}
      throw error;
    }
  }

  // Process global airtime purchase
  private async buyGlobalAirtime(data: any): Promise<any> {
    try {
      this.processingMessage = 'Processing global airtime purchase...';
      return await firstValueFrom(this.reloadlyAirtimeService.makeAirtimeTopup(data));
    } catch (error) {
      console.error('Global airtime purchase error:', error);
      try { console.error('Global airtime purchase error (JSON):', JSON.stringify(error, Object.getOwnPropertyNames(error))); } catch (e) {}
      throw error;
    }
  }

  // Show loader
  private async showLoader(message: string = 'Processing...'): Promise<void> {
    try {
      if (this.loading) {
        await this.loading.dismiss();
      }
      this.loading = await this.loadingController.create({ message });
      await this.loading.present();
    } catch (error) {
      console.error('Error showing loader:', error);
      try { console.error('Error showing loader (JSON):', JSON.stringify(error, Object.getOwnPropertyNames(error))); } catch (e) {}
    }
  }

  // Hide loader
  private async hideLoader(): Promise<void> {
    try {
      if (this.loading) {
        await this.loading.dismiss();
        this.loading = null;
      }
    } catch (error) {
      console.error('Error hiding loader:', error);
      try { console.error('Error hiding loader (JSON):', JSON.stringify(error, Object.getOwnPropertyNames(error))); } catch (e) {}
    }
  }

  // Navigate to receipt page with transaction data
// In checkout.page.ts, update the navigateToReceipt method:
private async navigateToReceipt(transactionData: any): Promise<boolean> {
  try {
    if (!this.router) {
      console.error('Router is not initialized');
      console.log('navigateToReceipt: returning false (router not initialized)');
      return false;
    }

    // Ensure we have the latest data
    if (this.data) {
      transactionData = { ...this.data, ...transactionData };
    }

    // Ensure we have required data
    if (!transactionData) {
      console.error('No transaction data provided for receipt');
      console.log('navigateToReceipt: returning false (no transaction data)');
      return false;
    }

    // Clear pending transaction after successful processing
    await this.storage.removeStorage('pendingTransaction');

    // Prepare the navigation state
    const navigationExtras = {
      state: { 
        transaction: {
          ...transactionData,
          status: transactionData.status || 'COMPLETED',
          timestamp: new Date().toISOString()
        } 
      },
      replaceUrl: true
    };

    console.log('Attempting to navigate to receipt with data:', navigationExtras.state);

    // First try: Direct navigation with state
    try {
      console.log('Attempt 1: Direct navigation to /tabs/receipt with state');
      const result = await this.router.navigate(['/tabs/receipt'], navigationExtras);
      console.log('navigateToReceipt: direct navigation result:', result);
      if (result) return true;
    } catch (e) {
      console.warn('Direct navigation failed, trying fallback:', e);
      console.log('navigateToReceipt: direct navigation failed');
    }

    // Second try: Navigation with query params
    try {
      console.log('Attempt 2: Navigation with query params');
      const result = await this.router.navigate(['/tabs/receipt'], {
        queryParams: {
          orderId: transactionData.orderId || transactionData.transactionId,
          status: 'success',
          amount: transactionData.amount,
          currency: transactionData.currency || 'GHS',
          recipientNumber: transactionData.recipientNumber,
          network: transactionData.network
        }
      });
      console.log('navigateToReceipt: query params navigation result:', result);
      if (result) return true;
    } catch (e) {
      console.warn('Query params navigation failed:', e);
      console.log('navigateToReceipt: query params navigation failed');
    }

    // Third try: Navigate to home with receipt modal
    try {
      console.log('Attempt 3: Navigate to home with receipt modal');
      const result = await this.router.navigate(['/tabs/home'], {
        queryParams: { 
          showReceipt: 'true',
          orderId: transactionData.orderId || transactionData.transactionId,
          status: 'success'
        }
      });
      console.log('navigateToReceipt: home with receipt modal navigation result:', result);
      if (result) return true;
    } catch (e) {
      console.warn('Home navigation with receipt modal failed:', e);
      console.log('navigateToReceipt: home with receipt modal navigation failed');
    }

    // Final fallback: Just go to home with success message
    console.log('All navigation attempts failed, falling back to home');
    // this.notification.showSuccess('Transaction completed successfully!'); // REMOVE this line
    const result = await this.router.navigate(['/tabs/home']);
    console.log('navigateToReceipt: final fallback navigation result:', result);
    return result;

  } catch (error) {
    console.error('Error in navigateToReceipt:', error);
    // this.notification.showError('Transaction completed, but could not show receipt'); // REMOVE this line
    const result = await this.router.navigate(['/tabs/home']);
    console.log('navigateToReceipt: error fallback navigation result:', result);
    return result;
  }
}

  // Navigate to error page with error details
  private async navigateToError(error: any): Promise<boolean> {
    try {
      if (!this.router) {
        console.error('Router is not initialized');
        return false;
      }

      // Ensure error is an object with at least a message
      const errorData = typeof error === 'string' 
        ? { message: error }
        : error instanceof Error
          ? { message: error.message, stack: error.stack }
          : error || { message: 'An unknown error occurred' };

      // Try different navigation approaches
      const navigationAttempts = [
        // Try with error modal on home page
        async () => {
          try {
            return await this.router.navigate(['/tabs/home'], {
              queryParams: { 
                showError: 'true',
                error: encodeURIComponent(errorData.message),
                code: errorData.code || 'UNKNOWN_ERROR'
              },
              replaceUrl: true
            });
          } catch (e) {
            console.warn('Error modal navigation failed');
            return false;
          }
        },
        // Try with just the error message
        async () => {
          try {
            return await this.router.navigate(['/tabs/home'], {
              queryParams: { 
                error: 'payment_failed',
                message: encodeURIComponent(errorData.message)
              },
              replaceUrl: true
            });
          } catch (e) {
            console.warn('Home page with error query params navigation failed');
            return false;
          }
        },
        // Final fallback to home page
        async () => this.router.navigate(['/tabs/home'], { 
          queryParams: { status: 'error' },
          replaceUrl: true 
        })
      ];

      // Try each navigation approach until one succeeds
      for (const attempt of navigationAttempts) {
        try {
          const result = await attempt();
          if (result) return true;
        } catch (e) {
          console.warn('Navigation attempt failed:', e);
        }
      }

      return false;
      
    } catch (error) {
      console.error('Error in navigateToError:', error);
      try { 
        console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error))); 
      } catch (e) {}
      
      // Final fallback to home
      try {
        await this.router.navigate(['/tabs/home'], { 
          queryParams: { status: 'error' },
          replaceUrl: true 
        });
      } catch (e) {
        console.error('Failed to navigate to home:', e);
      }
      return false;
    }
  }
}
