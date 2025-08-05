import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
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
  chevronUpOutline, helpCircleOutline } from 'ionicons/icons';

interface TransactionDetails {
  id: string;
  type: 'airtime' | 'data' | 'transfer' | 'conversion' | 'payment' | 'withdrawal';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  description: string;
  timestamp: Date;
  reference: string;
  provider?: string;
  recipient?: string;
  sender?: string;
  fees?: number;
  totalAmount?: number;
  processingTime?: string;
  notes?: string;
  metadata?: {
    phoneNumber?: string;
    networkProvider?: string;
    dataBundle?: string;
    bankName?: string;
    accountNumber?: string;
    conversionRate?: number;
    originalAmount?: number;
  };
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
    CommonModule,
    FormsModule,
    TranslateModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TransactionDetailsPage implements OnInit {
  isLoading: boolean = true;
  transactionId: string = '';
  transaction: TransactionDetails | null = null;
  showReceipt: boolean = false;
  expandedSections: { [key: string]: boolean } = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService
  ) {
    addIcons({receiptOutline,shareOutline,informationCircleOutline,copyOutline,documentTextOutline,downloadOutline,printOutline,helpCircleOutline,timeOutline,checkmarkCircleOutline,closeCircleOutline,arrowBackOutline,warningOutline,callOutline,mailOutline,locationOutline,personOutline,cardOutline,walletOutline,cellularOutline,wifiOutline,swapHorizontalOutline,repeatOutline,cashOutline,giftOutline,ellipsisVerticalOutline,chevronForwardOutline,chevronDownOutline,chevronUpOutline,});
    this.translate.setDefaultLang('en');
    this.translate.use('en');
  }

  ngOnInit() {
    this.loadTransactionDetails();
  }

  async loadTransactionDetails() {
    this.isLoading = true;
    
    try {
      // Get transaction ID from route parameters
      this.transactionId = this.route.snapshot.paramMap.get('id') || '';
      
      if (!this.transactionId) {
        this.showError('Transaction ID not found');
        return;
      }

      // Simulate API call to fetch transaction details
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock transaction data - replace with actual API call
      this.transaction = this.getMockTransactionDetails(this.transactionId);
      
      if (!this.transaction) {
        this.showError('Transaction not found');
        return;
      }
      
    } catch (error) {
      console.error('Error loading transaction details:', error);
      this.showError('Failed to load transaction details');
    } finally {
      this.isLoading = false;
    }
  }

  getMockTransactionDetails(id: string): TransactionDetails | null {
    // Mock data - replace with actual API call
    const mockTransactions: { [key: string]: TransactionDetails } = {
      '6890d799d5f9157b61494182': {
        id: '6890d799d5f9157b61494182',
        type: 'airtime',
        status: 'completed',
        amount: 1000,
        currency: 'NGN',
        description: 'Airtime Purchase - MTN',
        timestamp: new Date('2024-03-25T10:30:00Z'),
        reference: 'REF-2024-03-25-001',
        provider: 'MTN',
        recipient: '+2348012345678',
        fees: 0,
        totalAmount: 1000,
        processingTime: 'Instant',
        notes: 'Airtime purchase successful',
        metadata: {
          phoneNumber: '+2348012345678',
          networkProvider: 'MTN',
        }
      },
      'default': {
        id: id,
        type: 'conversion',
        status: 'pending',
        amount: 500,
        currency: 'NGN',
        description: 'Airtime to Cash Conversion',
        timestamp: new Date('2024-03-25T09:15:00Z'),
        reference: 'REF-2024-03-25-002',
        fees: 25,
        totalAmount: 475,
        processingTime: '5-10 minutes',
        notes: 'Converting airtime to wallet credit',
        metadata: {
          phoneNumber: '+2348098765432',
          networkProvider: 'Airtel',
          conversionRate: 0.85,
          originalAmount: 500,
        }
      }
    };

    return mockTransactions[id] || mockTransactions['default'];
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'danger';
      case 'cancelled': return 'medium';
      default: return 'medium';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'completed': return 'checkmark-circle-outline';
      case 'pending': return 'time-outline';
      case 'failed': return 'close-circle-outline';
      case 'cancelled': return 'warning-outline';
      default: return 'information-circle-outline';
    }
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'airtime': return 'cellular-outline';
      case 'data': return 'wifi-outline';
      case 'transfer': return 'swap-horizontal-outline';
      case 'conversion': return 'repeat-outline';
      case 'payment': return 'card-outline';
      case 'withdrawal': return 'cash-outline';
      default: return 'receipt-outline';
    }
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'airtime': return 'Airtime Purchase';
      case 'data': return 'Data Bundle';
      case 'transfer': return 'Money Transfer';
      case 'conversion': return 'Airtime Conversion';
      case 'payment': return 'Payment';
      case 'withdrawal': return 'Withdrawal';
      default: return 'Transaction';
    }
  }

  formatCurrency(amount: number): string {
    return `₦${amount.toLocaleString()}`;
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatTime(date: Date): string {
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
        await navigator.clipboard.writeText(this.transaction.reference);
        // Show success toast or alert
        console.log('Reference copied to clipboard');
      } catch (error) {
        console.error('Failed to copy reference:', error);
      }
    }
  }

  async shareTransaction() {
    if (this.transaction) {
      try {
        const shareData = {
          title: 'Transaction Details',
          text: `Transaction: ${this.transaction.description} - ${this.formatCurrency(this.transaction.amount)}`,
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
      }
    }
  }

  downloadReceipt() {
    // Implement receipt download functionality
    console.log('Downloading receipt...');
  }

  printReceipt() {
    // Implement receipt printing functionality
    console.log('Printing receipt...');
  }

  contactSupport() {
    // Navigate to support page
    this.router.navigate(['/tabs/support']);
  }

  async goBack() {
    await Haptics.impact({ style: ImpactStyle.Light });
    this.router.navigate(['/tabs/home']);
  }

  private showError(message: string) {
    console.error(message);
    // You can implement a toast or alert here
  }
} 