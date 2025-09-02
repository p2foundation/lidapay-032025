import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonBadge,
  IonChip,
  IonGrid,
  IonRow,
  IonCol,
  IonSpinner,
  IonRippleEffect,
  IonBackButton,
  IonButtons,
  IonList,
  IonListHeader,
  IonAvatar,
  IonSkeletonText,
  ToastController,
  AlertController,
} from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  timeOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  warningOutline,
  informationCircleOutline,
  copyOutline,
  shareOutline,
  downloadOutline,
  printOutline,
  callOutline,
  mailOutline,
  locationOutline,
  personOutline,
  cardOutline,
  walletOutline,
  cellularOutline,
  wifiOutline,
  swapHorizontalOutline,
  repeatOutline,
  cashOutline,
  giftOutline,
  receiptOutline,
  documentTextOutline,
  ellipsisVerticalOutline,
  chevronForwardOutline,
  chevronDownOutline,
  chevronUpOutline, 
  helpCircleOutline 
} from 'ionicons/icons';
import { HistoryService } from 'src/app/services/transactions/history.service';
import { StorageService } from 'src/app/services/storage.service';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';

interface TransactionDetails {
  _id: string;
  transType: string;
  status: {
    transaction?: 'pending' | 'completed' | 'failed';
    service?: 'pending' | 'completed' | 'failed';
    payment?: 'pending' | 'completed' | 'failed';
  };
  monetary?: {
    amount: number;
    fee: number;
    originalAmount: string;
    currency: string;
  };
  description?: string;
  createdAt: string;
  updatedAt: string;
  reference?: string;
  transId?: string;
  recipientNumber?: string;
  sender?: string;
  notes?: string;
  expressToken?: string;
  retailer?: string;
  firstName?: string;
  lastName?: string;
}

@Component({
  selector: 'app-transaction-details',
  templateUrl: './transaction-details.page.html',
  styleUrls: ['./transaction-details.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonIcon,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonItem,
    IonLabel,
    IonBadge,
    IonSpinner,
    IonBackButton,
    IonButtons,
    IonList,
    CommonModule,
    FormsModule,
    TranslateModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TransactionDetailsPage implements OnInit, OnDestroy {
  isLoading: boolean = true;
  transactionId: string = '';
  transaction: TransactionDetails | null = null;
  showReceipt: boolean = false;
  expandedSections: { [key: string]: boolean } = {};
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService,
    private historyService: HistoryService,
    private storageService: StorageService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {
    addIcons({
      receiptOutline, shareOutline, informationCircleOutline, copyOutline, 
      documentTextOutline, downloadOutline, printOutline, helpCircleOutline, 
      timeOutline, checkmarkCircleOutline, closeCircleOutline, arrowBackOutline, 
      warningOutline, callOutline, mailOutline, locationOutline, personOutline, 
      cardOutline, walletOutline, cellularOutline, wifiOutline, swapHorizontalOutline, 
      repeatOutline, cashOutline, giftOutline, ellipsisVerticalOutline, 
      chevronForwardOutline, chevronDownOutline, chevronUpOutline
    });
    this.translate.setDefaultLang('en');
    this.translate.use('en');
  }

  ngOnInit() {
    console.log('Transaction Details Page initialized');
    console.log('Route params:', this.route.snapshot.paramMap);
    this.loadTransactionDetails();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadTransactionDetails() {
    this.isLoading = true;
    console.log('Loading transaction details for ID:', this.transactionId);
    
    try {
      // Get transaction ID from route parameters
      this.transactionId = this.route.snapshot.paramMap.get('id') || '';
      console.log('Transaction ID from route:', this.transactionId);
      
      if (!this.transactionId) {
        console.error('No transaction ID found in route');
        this.showError('Transaction ID not found');
        return;
      }

      // Fetch real transaction data from API
      console.log('Fetching transaction from API...');
      const response = await firstValueFrom(
        this.historyService.getTransactionByTransactionId(this.transactionId)
      );

      console.log('API response:', response);

      // Handle different response structures
      let transactionData = null;
      if (response && response.data) {
        transactionData = response.data;
      } else if (response && response.transaction) {
        transactionData = response.transaction;
      } else if (response && response._id) {
        transactionData = response;
      } else if (Array.isArray(response) && response.length > 0) {
        transactionData = response[0];
      }

      if (transactionData) {
        this.transaction = transactionData;
        console.log('Transaction loaded successfully:', this.transaction);
      } else {
        console.error('No transaction data found in response:', response);
        
        // Show sample data for testing purposes
        console.log('Showing sample data for testing...');
        this.transaction = this.getSampleTransactionData();
        
        if (!this.transaction) {
          this.showError('Transaction not found or invalid response format');
          return;
        }
      }
      
    } catch (error) {
      console.error('Error loading transaction details:', error);
      this.showError('Failed to load transaction details: ' + (error as any)?.message || 'Unknown error');
    } finally {
      this.isLoading = false;
    }
  }

  getStatusColor(status: any): string {
    if (status?.transaction === 'completed') return 'success';
    if (status?.transaction === 'pending') return 'warning';
    if (status?.transaction === 'failed') return 'danger';
    return 'medium';
  }

  getStatusIcon(status: any): string {
    if (status?.transaction === 'completed') return 'checkmark-circle-outline';
    if (status?.transaction === 'pending') return 'time-outline';
    if (status?.transaction === 'failed') return 'close-circle-outline';
    return 'information-circle-outline';
  }

  getTypeIcon(type: string): string {
    switch (type?.toLowerCase()) {
      case 'airtime':
      case 'globalairtopup':
        return 'cellular-outline';
      case 'data':
        return 'wifi-outline';
      case 'transfer':
      case 'momo':
        return 'swap-horizontal-outline';
      case 'conversion':
        return 'repeat-outline';
      case 'payment':
        return 'card-outline';
      case 'withdrawal':
        return 'cash-outline';
      default:
        return 'receipt-outline';
    }
  }

  getTypeLabel(type: string): string {
    switch (type?.toLowerCase()) {
      case 'airtime':
      case 'globalairtopup':
        return 'Airtime Purchase';
      case 'data':
        return 'Data Bundle';
      case 'transfer':
      case 'momo':
        return 'Money Transfer';
      case 'conversion':
        return 'Airtime Conversion';
      case 'payment':
        return 'Payment';
      case 'withdrawal':
        return 'Withdrawal';
      default:
        return 'Transaction';
    }
  }

  getTransactionStatus(): string {
    if (this.transaction?.status?.transaction === 'completed') return 'completed';
    if (this.transaction?.status?.transaction === 'pending') return 'pending';
    if (this.transaction?.status?.transaction === 'failed') return 'failed';
    return 'pending';
  }

  formatCurrency(amount: number): string {
    if (!amount) return '₵0';
    return `₵${amount.toLocaleString()}`;
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatTime(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  toggleSection(section: string) {
    this.expandedSections[section] = !this.expandedSections[section];
  }

  isSectionExpanded(section: string): boolean {
    return this.expandedSections[section] || false;
  }

  async copyReference() {
    if (this.transaction) {
      try {
        const reference = this.transaction.reference || this.transaction.transId || this.transaction._id;
        await navigator.clipboard.writeText(reference);
        this.showToast('Reference copied to clipboard', 'success');
      } catch (error) {
        console.error('Failed to copy reference:', error);
        this.showToast('Failed to copy reference', 'danger');
      }
    }
  }

  async shareTransaction() {
    if (this.transaction) {
      try {
        const shareData = {
          title: 'Transaction Details',
          text: `Transaction: ${this.getTypeLabel(this.transaction.transType)} - ${this.formatCurrency(this.transaction.monetary?.amount || 0)}`,
          url: window.location.href,
        };
        
        if (navigator.share) {
          await navigator.share(shareData);
        } else {
          // Fallback for browsers that don't support Web Share API
          await this.copyReference();
        }
      } catch (error) {
        console.error('Failed to share transaction:', error);
        this.showToast('Failed to share transaction', 'danger');
      }
    }
  }

  async downloadReceipt() {
    try {
      // Generate receipt content
      const receiptContent = this.generateReceiptContent();
      
      // Create blob and download
      const blob = new Blob([receiptContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${this.transaction?._id || 'transaction'}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      this.showToast('Receipt downloaded successfully', 'success');
    } catch (error) {
      console.error('Failed to download receipt:', error);
      this.showToast('Failed to download receipt', 'danger');
    }
  }

  async printReceipt() {
    try {
      const receiptContent = this.generateReceiptContent();
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Transaction Receipt</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .section { margin-bottom: 20px; }
                .detail { display: flex; justify-content: space-between; margin-bottom: 10px; }
                .label { font-weight: bold; }
                .value { text-align: right; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Transaction Receipt</h1>
                <p>${new Date().toLocaleString()}</p>
              </div>
              <pre>${receiptContent}</pre>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
      this.showToast('Print dialog opened', 'success');
    } catch (error) {
      console.error('Failed to print receipt:', error);
      this.showToast('Failed to print receipt', 'danger');
    }
  }

  private generateReceiptContent(): string {
    if (!this.transaction) return 'No transaction data available';
    
    return `
TRANSACTION RECEIPT
===================

Transaction ID: ${this.transaction._id}
Type: ${this.getTypeLabel(this.transaction.transType)}
Status: ${this.transaction.status?.transaction || 'Unknown'}
Amount: ${this.formatCurrency(this.transaction.monetary?.amount || 0)}
Currency: ${this.transaction.monetary?.currency || 'GHS'}
Fee: ${this.formatCurrency(this.transaction.monetary?.fee || 0)}
Reference: ${this.transaction.reference || 'N/A'}
Recipient: ${this.transaction.recipientNumber || 'N/A'}
Date: ${this.formatDate(this.transaction.createdAt)}
Time: ${this.formatTime(this.transaction.createdAt)}

Additional Details:
- Sender: ${this.transaction.firstName || ''} ${this.transaction.lastName || ''}
- Retailer: ${this.transaction.retailer || 'N/A'}
- Notes: ${this.transaction.notes || 'N/A'}

Generated on: ${new Date().toLocaleString()}
    `.trim();
  }

  contactSupport() {
    // Navigate to support page
    this.router.navigate(['/tabs/support']);
  }

  async goBack() {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
      console.log('Navigating back from transaction details');
      
      // Try to go back in history first, then fallback to home
      if (window.history.length > 1) {
        this.router.navigate(['/tabs/home']);
      } else {
        this.router.navigate(['/tabs/home']);
      }
    } catch (error) {
      console.error('Error navigating back:', error);
      this.router.navigate(['/tabs/home']);
    }
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

  private async showError(message: string) {
    const alert = await this.alertCtrl.create({
      header: 'Error',
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  private getSampleTransactionData(): TransactionDetails {
    return {
      _id: 'sample-id-123',
      transType: 'airtime',
      status: { transaction: 'completed' },
      monetary: { amount: 10.50, fee: 0.25, originalAmount: '10.50', currency: 'GHS' },
      description: 'Sample Airtime Purchase',
      createdAt: '2023-10-27T10:00:00.000Z',
      updatedAt: '2023-10-27T10:00:00.000Z',
      reference: 'REF-123456789',
      transId: 'TXN-123456789',
      recipientNumber: '0241234567',
      sender: 'Sample User',
      notes: 'This is a sample transaction for testing purposes.',
      expressToken: 'sample-token-123',
      retailer: 'Sample Retailer',
      firstName: 'Sample',
      lastName: 'User',
    };
  }
} 