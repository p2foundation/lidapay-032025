import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil, firstValueFrom } from 'rxjs';
import { addIcons } from 'ionicons';
import { 
  refreshOutline, 
  checkmarkCircleOutline, 
  trashOutline,
  eyeOutline,
  timeOutline,
  arrowDownOutline,
  closeCircleOutline,
  helpCircleOutline
} from 'ionicons/icons';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonCard,
  IonCardContent,
  IonButtons,
  IonBackButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonChip,
  IonSpinner,
  IonList,
  IonBadge,
  IonSelect,
  IonSelectOption,
  IonFab,
  IonFabButton,
  ModalController,
  LoadingController,
  ToastController,
  AlertController,
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';

import { NotificationService } from '../../services/notification.service';
import { HistoryService } from '../../services/transactions/history.service';
import { StateService } from '../../services/state.service';
import { StorageService } from '../../services/storage.service';

interface Transaction {
  _id: string;
  userId: string;
  firstName: string;
  lastName: string;
  transType: string;
  transId: string;
  recipientNumber: string;
  retailer: string;
  expressToken: string;
  monetary: {
    amount: number;
    fee: number;
    originalAmount: string;
    currency: string;
    _id: string;
  };
  status: {
    transaction: 'pending' | 'completed' | 'failed';
    service: 'pending' | 'completed' | 'failed';
    payment: 'pending' | 'completed' | 'failed';
  };
  createdAt?: string;
  updatedAt?: string;
}

@Component({
  selector: 'app-pending-transactions',
  templateUrl: './pending-transactions.page.html',
  styleUrls: ['./pending-transactions.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    TranslateModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonItem,
    IonLabel,
    IonInput,
    IonCard,
    IonCardContent,
    IonButtons,
    IonBackButton,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonChip,
    IonSpinner,
    IonList,
    IonBadge,
    IonSelect,
    IonSelectOption,
    IonFab,
    IonFabButton,
  ],
})
export class PendingTransactionsPage implements OnInit, OnDestroy {
  pendingTransactions: Transaction[] = [];
  isLoading = false;
  isCheckingStatus = false;
  checkingTransactionId: string | null = null;
  
  // Filter options
  filterStatus: 'ALL' | 'PENDING' | 'COMPLETED' | 'FAILED' = 'ALL';
  searchTerm = '';
  
  // Pagination
  currentPage = 1;
  limit = 20;
  totalPages = 1;
  hasMoreData = true;

  private destroy$ = new Subject<void>();

  constructor(
    private historyService: HistoryService,
    private stateService: StateService,
    private storage: StorageService,
    private notificationService: NotificationService,
    private router: Router,
    private modalController: ModalController,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController
  ) {
    addIcons({
      refreshOutline,
      checkmarkCircleOutline,
      timeOutline,
      eyeOutline,
      arrowDownOutline,
      trashOutline,
      closeCircleOutline,
      helpCircleOutline
    });
  }

  ngOnInit() {
    this.loadPendingTransactions();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadPendingTransactions(page: number = 1, append: boolean = false) {
    if (page === 1) {
      this.isLoading = true;
    }

    try {
      const userId = this.stateService.getUserId();
      if (!userId) {
        throw new Error('User ID not found. Please login again.');
      }

      console.log('Loading transactions for user:', userId, 'Page:', page, 'Limit:', this.limit);
      
      const response = await firstValueFrom(
        this.historyService.getTransactionByUserId(userId, page, this.limit)
      );

      console.log('API Response:', response);

      if (response && response.transactions) {
        // Filter for pending transactions based on status.transaction
        const pendingTransactions = response.transactions.filter((tx: Transaction) => 
          tx.status?.transaction === 'pending'
        );

        if (append) {
          this.pendingTransactions = [...this.pendingTransactions, ...pendingTransactions];
        } else {
          this.pendingTransactions = pendingTransactions;
        }

        // Update pagination info
        this.currentPage = page;
        this.totalPages = response.totalPages || 1;
        this.hasMoreData = page < this.totalPages;

        console.log('Filtered pending transactions:', this.pendingTransactions);
        console.log('Total pages:', this.totalPages, 'Current page:', this.currentPage);
      } else {
        this.pendingTransactions = [];
        this.hasMoreData = false;
      }
    } catch (error: any) {
      console.error('Error loading pending transactions:', error);
      this.notificationService.showError(
        error.message || 'Failed to load pending transactions'
      );
    } finally {
      this.isLoading = false;
    }
  }

  async checkTransactionStatus(transaction: Transaction) {
    this.isCheckingStatus = true;
    this.checkingTransactionId = transaction._id;

    const loading = await this.loadingController.create({
      message: 'Checking transaction status...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      console.log('Checking status for transaction:', transaction._id);
      
      // Query the transaction status using the transaction ID
      const response = await firstValueFrom(
        this.historyService.getTransactionByTransactionId(transaction._id)
      );

      console.log('Status check response:', response);

      if (response) {
        const updatedTransaction = response;
        const transactionStatus = updatedTransaction.status?.transaction;

        if (transactionStatus === 'completed') {
          // Transaction is complete, forward to checkout for crediting
          await this.forwardToCheckout(updatedTransaction);
        } else if (transactionStatus === 'failed') {
          // Transaction failed
          await this.showTransactionFailedAlert(updatedTransaction);
        } else if (transactionStatus === 'pending') {
          // Still pending, show current status
          await this.showCurrentStatus(updatedTransaction);
        }
      } else {
        throw new Error('Unable to retrieve transaction status');
      }
    } catch (error: any) {
      console.error('Error checking transaction status:', error);
      this.notificationService.showError(
        error.message || 'Failed to check transaction status'
      );
    } finally {
      this.isCheckingStatus = false;
      this.checkingTransactionId = null;
      await loading.dismiss();
    }
  }

  private async forwardToCheckout(transaction: Transaction) {
    try {
      // Prepare airtimeTopup params for checkout
      const airtimeTopupParams = {
        transType: transaction.transType,
        amount: transaction.monetary.amount,
        currency: transaction.monetary.currency,
        recipientNumber: transaction.recipientNumber,
        transId: transaction.transId,
        expressToken: transaction.expressToken,
        retailer: transaction.retailer,
        status: 'COMPLETED',
        result: 'Transaction completed successfully',
        orderId: transaction.transId,
        transactionId: transaction._id,
        // Add any other required fields for checkout
      };

      console.log('Forwarding to checkout with params:', airtimeTopupParams);

      // Navigate to checkout with the transaction data
      const navigationExtras = {
        queryParams: {
          special: JSON.stringify(airtimeTopupParams)
        }
      };

      await this.router.navigate(['/tabs/checkout'], navigationExtras);
      
      // Show success message
      this.notificationService.showSuccess('Transaction completed! Redirecting to checkout for crediting.');
      
    } catch (error) {
      console.error('Error forwarding to checkout:', error);
      this.notificationService.showError('Failed to forward to checkout');
    }
  }

  private async showTransactionFailedAlert(transaction: Transaction) {
    const alert = await this.alertController.create({
      header: 'Transaction Failed',
      message: `The transaction has failed and cannot be processed.\n\nTransaction ID: ${transaction.transId}\nAmount: ${transaction.monetary.currency} ${transaction.monetary.amount}\nRecipient: ${transaction.recipientNumber}`,
      buttons: [
        {
          text: 'OK',
          handler: () => {
            // Refresh the list to show updated status
            this.loadPendingTransactions();
          }
        }
      ]
    });

    await alert.present();
  }

  private async showCurrentStatus(transaction: Transaction) {
    const alert = await this.alertController.create({
      header: 'Transaction Status',
      message: `Transaction is still being processed.\n\nStatus: ${transaction.status?.transaction}\nService: ${transaction.status?.service}\nPayment: ${transaction.status?.payment}\n\nPlease check back later.`,
      buttons: ['OK']
    });

    await alert.present();
  }

  async viewTransactionDetails(transaction: Transaction) {
    const alert = await this.alertController.create({
      header: 'Transaction Details',
      message: `
        <div style="text-align: left;">
          <p><strong>Transaction ID:</strong> ${transaction.transId}</p>
          <p><strong>Type:</strong> ${transaction.transType}</p>
          <p><strong>Amount:</strong> ${transaction.monetary.currency} ${transaction.monetary.amount}</p>
          <p><strong>Recipient:</strong> ${transaction.recipientNumber}</p>
          <p><strong>Retailer:</strong> ${transaction.retailer}</p>
          <p><strong>Status:</strong></p>
          <ul>
            <li>Transaction: ${transaction.status?.transaction}</li>
            <li>Service: ${transaction.status?.service}</li>
            <li>Payment: ${transaction.status?.payment}</li>
          </ul>
          <p><strong>Created:</strong> ${this.formatDate(transaction.createdAt)}</p>
          <p><strong>Updated:</strong> ${this.formatDate(transaction.updatedAt)}</p>
        </div>
      `,
      buttons: ['Close']
    });

    await alert.present();
  }

  get filteredTransactions(): Transaction[] {
    let filtered = this.pendingTransactions;

    // Filter by status
    if (this.filterStatus !== 'ALL') {
      filtered = filtered.filter(t => t.status?.transaction === this.filterStatus.toLowerCase());
    }

    // Filter by search term
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.recipientNumber.toLowerCase().includes(search) ||
        t.transType.toLowerCase().includes(search) ||
        t.transId.toLowerCase().includes(search) ||
        t.retailer.toLowerCase().includes(search)
      );
    }

    return filtered;
  }

  async refreshTransactions() {
    await this.loadPendingTransactions(1, false);
    this.notificationService.showSuccess('Transactions refreshed');
  }

  async loadMoreTransactions() {
    if (this.hasMoreData && !this.isLoading) {
      await this.loadPendingTransactions(this.currentPage + 1, true);
    }
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  }

  formatAmount(amount: number): string {
    return amount.toFixed(2);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'warning';
      case 'completed': return 'success';
      case 'failed': return 'danger';
      default: return 'medium';
    }
  }

  getTransactionTypeLabel(transType: string): string {
    const labels: { [key: string]: string } = {
      'MOMO': 'Mobile Money',
      'AIRTIMETOPUP': 'Airtime Top-up',
      'DATABUNDLELIST': 'Data Bundle',
      'GLOBALAIRTOPUP': 'Global Airtime'
    };
    return labels[transType] || transType;
  }

  formatPhoneNumber(phoneNumber: string): string {
    if (!phoneNumber) return '';
    
    // Remove all non-digit characters
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // For Ghanaian numbers (233 prefix), convert to local format
    if (cleanNumber.length === 12 && cleanNumber.startsWith('233')) {
      return cleanNumber.slice(3);
    } else if (cleanNumber.length === 13 && cleanNumber.startsWith('233')) {
      return cleanNumber.slice(3);
    } else if (cleanNumber.length === 10 && cleanNumber.startsWith('0')) {
      return cleanNumber;
    }
    
    return phoneNumber;
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'pending': return 'timeOutline';
      case 'completed': return 'checkmarkCircleOutline';
      case 'failed': return 'closeCircleOutline';
      default: return 'helpCircleOutline';
    }
  }
}
