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
  helpCircleOutline,
  phonePortraitOutline,
  cellularOutline,
  swapHorizontalOutline,
  walletOutline,
  informationCircleOutline,
  calendarOutline,
  personOutline,
  businessOutline,
  searchOutline,
  filterOutline,
  analyticsOutline,
  cashOutline,
  arrowBackOutline, 
  constructOutline, 
  cardOutline, 
  chevronUpOutline, 
  chevronDownOutline,
  documentOutline,
  closeOutline,
  chatbubbleOutline,
  linkOutline
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
import { TransactionStatusService } from '../../services/transactions/transaction-status.service';
import { PhoneValidationService } from '../../services/utils/phone-validation.service';
import { StateService } from '../../services/state.service';
import { StorageService } from '../../services/storage.service';
import { TransactionDetailsModalComponent } from './transaction-details-modal.component';

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
    IonBadge,
    IonSelect,
    IonSelectOption,
    IonFab,
    IonFabButton
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

  // Safe setter for filter status
  setFilterStatus(status: 'ALL' | 'PENDING' | 'COMPLETED' | 'FAILED'): void {
    this.filterStatus = status || 'ALL';
  }
  
  // Pagination
  currentPage = 1;
  limit = 20;
  totalPages = 1;
  hasMoreData = true;

  // Status breakdown state
  isStatusBreakdownOpen: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private historyService: HistoryService,
    private transactionStatusService: TransactionStatusService,
    private phoneValidationService: PhoneValidationService,
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
      timeOutline,
      refreshOutline,
      checkmarkCircleOutline,
      searchOutline,
      filterOutline,
      informationCircleOutline,
      cashOutline,
      phonePortraitOutline,
      businessOutline,
      personOutline,
      calendarOutline,
      analyticsOutline,
      swapHorizontalOutline,
      constructOutline,
      cardOutline,
      eyeOutline,
      arrowDownOutline,
      trashOutline,
      closeCircleOutline,
      helpCircleOutline,
      cellularOutline,
      walletOutline,
      arrowBackOutline,
      chevronUpOutline,
      chevronDownOutline,
      documentOutline,
      closeOutline,
      chatbubbleOutline,
      linkOutline
    });
  }

  ngOnInit() {
    // Ensure filter status is properly initialized
    if (!this.filterStatus) {
      this.filterStatus = 'ALL';
    }
    
    // Disable verbose phone validation logging to reduce console clutter
    this.phoneValidationService.setVerboseLogging(false);
    
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
        // Filter for pending or failed transactions based on status.transaction
        const pendingOrFailedTransactions = response.transactions.filter((tx: Transaction) => 
          tx.status?.transaction === 'pending' || tx.status?.transaction === 'failed'
        );

        if (append) {
          this.pendingTransactions = [...this.pendingTransactions, ...pendingOrFailedTransactions];
        } else {
          this.pendingTransactions = pendingOrFailedTransactions;
        }

        // Update pagination info
        this.currentPage = page;
        this.totalPages = response.totalPages || 1;
        this.hasMoreData = page < this.totalPages;

        console.log('Filtered pending/failed transactions:', this.pendingTransactions);
        console.log('Total pages:', this.totalPages, 'Current page:', this.currentPage);
        
        // Update the count in storage for home page
        await this.updatePendingTransactionsCount();
      } else {
        this.pendingTransactions = [];
        this.hasMoreData = false;
        
        // Update the count in storage for home page
        await this.updatePendingTransactionsCount();
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
    if (!this.transactionStatusService.isEligibleForStatusQuery(transaction)) {
      this.notificationService.showError('Transaction is not eligible for status query');
      return;
    }

    this.isCheckingStatus = true;
    this.checkingTransactionId = transaction._id;

    const loading = await this.loadingController.create({
      message: 'Checking transaction status...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      console.log('Checking status for transaction:', transaction._id);
      console.log('Using expressToken:', transaction.expressToken);
      
      // Query the transaction status using the expressToken
      const statusResponse = await firstValueFrom(
        this.transactionStatusService.queryTransactionStatus({
          expressToken: transaction.expressToken,
          transactionId: transaction.transId,
          transType: transaction.transType
        })
      );

      console.log('Status check response:', statusResponse);

      if (statusResponse.success) {
        const transactionStatus = statusResponse.status;
        
        // Check if transaction is completed
        if (transactionStatus === 'completed' || statusResponse.data?.status === 'COMPLETED') {
          console.log('Transaction completed, processing airtime crediting...');
          
          // Process the completed transaction for airtime crediting
          await this.processCompletedTransaction(transaction, statusResponse.data);
        } else {
          // Update transaction status in local storage/state
          await this.updateTransactionStatus(transaction._id, transactionStatus);
          this.notificationService.showSuccess(`Transaction status: ${transactionStatus}`);
        }
      } else {
        this.notificationService.showError('Failed to check transaction status');
      }
    } catch (error: any) {
      console.error('Error checking transaction status:', error);
      this.notificationService.showError(
        error.error?.message || error.message || 'Failed to check transaction status'
      );
    } finally {
      await loading.dismiss();
      this.isCheckingStatus = false;
      this.checkingTransactionId = null;
      
      // Refresh the transactions list
      await this.loadPendingTransactions();
    }
  }

  /**
   * Process completed transaction for airtime crediting
   */
  private async processCompletedTransaction(transaction: Transaction, statusData: any) {
    try {
      console.log('Processing completed transaction for airtime crediting:', statusData);
      
      // Extract airtime parameters based on transaction type
      const airtimeParams = this.extractAirtimeParams(transaction, statusData);
      
      if (airtimeParams) {
        // Navigate to checkout page for airtime crediting
        await this.navigateToCheckout(airtimeParams);
      } else {
        this.notificationService.showError('Unable to extract airtime parameters');
      }
    } catch (error: any) {
      console.error('Error processing completed transaction:', error);
      this.notificationService.showError('Failed to process completed transaction');
    }
  }

  /**
   * Extract airtime parameters from completed transaction
   */
  private extractAirtimeParams(transaction: Transaction, statusData: any): any {
    try {
      const transType = transaction.transType?.toUpperCase();
      
      // Check if this is an airtime transaction
      if (transType === 'GLOBALAIRTIMETOPUP' || transType === 'AIRTIMETOPUP' || transType === 'DATABUNDLELIST') {
        return {
          orderId: statusData.orderId || transaction.transId,
          token: statusData.token || transaction.expressToken,
          amount: statusData.amount || transaction.monetary.amount,
          recipientNumber: transaction.recipientNumber,
          network: statusData.network || 'auto-detect',
          transType: transType,
          transactionId: statusData.transactionId || transaction.transId,
          currency: statusData.currency || transaction.monetary.currency,
          description: `Airtime recharge for ${transaction.recipientNumber}`,
          timestamp: new Date().toISOString()
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting airtime parameters:', error);
      return null;
    }
  }

  /**
   * Navigate to checkout page for airtime crediting
   */
  private async navigateToCheckout(airtimeParams: any) {
    try {
      // Store the airtime parameters for checkout
      await this.storage.setStorage('pendingAirtimeCrediting', JSON.stringify(airtimeParams));
      
      // Navigate to checkout page
      this.router.navigate(['/tabs/checkout'], {
        queryParams: airtimeParams
      });
      
      this.notificationService.showSuccess('Redirecting to checkout for airtime crediting...');
    } catch (error: any) {
      console.error('Error navigating to checkout:', error);
      this.notificationService.showError('Failed to navigate to checkout');
    }
  }

  /**
   * Update transaction status in local storage/state
   */
  private async updateTransactionStatus(transactionId: string, status: string) {
    try {
      // Update the transaction in the local array
      const transactionIndex = this.pendingTransactions.findIndex(t => t._id === transactionId);
      if (transactionIndex !== -1) {
        // Initialize status object if it doesn't exist
        if (!this.pendingTransactions[transactionIndex].status) {
          this.pendingTransactions[transactionIndex].status = {
            transaction: 'pending',
            service: 'pending',
            payment: 'pending'
          };
        }
        
        // Convert status to lowercase and map to valid status values
        const normalizedStatus = status.toLowerCase() as 'pending' | 'completed' | 'failed';
        this.pendingTransactions[transactionIndex].status.transaction = normalizedStatus;
        
        // If completed, remove from pending list
        if (status === 'COMPLETED') {
          this.pendingTransactions.splice(transactionIndex, 1);
        }
        
        // Update the count in storage for home page
        await this.updatePendingTransactionsCount();
      }
    } catch (error) {
      console.error('Error updating transaction status:', error);
    }
  }

  /**
   * Update pending transactions count in storage
   */
  private async updatePendingTransactionsCount() {
    try {
      const count = this.getPendingTransactionsCount();
      await this.storage.setStorage('pendingTransactionsCount', count.toString());
      console.log('Updated pending transactions count in storage:', count);
    } catch (error) {
      console.error('Error updating pending transactions count:', error);
    }
  }



  private async storeCompletedTransactionForCrediting(transaction: Transaction, statusResponse: any) {
    try {
      // Prepare transaction details for crediting
      const creditingData = {
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
        statusResponse: statusResponse,
        timestamp: new Date().toISOString(),
        // Add any other required fields for crediting
      };

      // Store in local storage with a unique key
      const storageKey = `completedTransaction_${transaction._id}`;
      await this.storage.setStorage(storageKey, creditingData);

      console.log('Stored completed transaction for crediting:', storageKey, creditingData);
      
      // Show success message
      this.notificationService.showSuccess('Transaction completed! Storing details for crediting.');
      
    } catch (error) {
      console.error('Error storing completed transaction for crediting:', error);
      this.notificationService.showError('Failed to store transaction details for crediting');
    }
  }

  private async clearCompletedTransactionStorage(transaction: Transaction) {
    try {
      const storageKey = `completedTransaction_${transaction._id}`;
      await this.storage.removeStorage(storageKey);
      console.log('Cleared completed transaction storage:', storageKey);
    } catch (error) {
      console.error('Error clearing completed transaction storage:', error);
    }
  }

  private async forwardToCheckout(transaction: Transaction) {
    try {
      // Retrieve the stored crediting data
      const storageKey = `completedTransaction_${transaction._id}`;
      const creditingData = await this.storage.getStorage(storageKey);
      
      if (!creditingData) {
        throw new Error('Crediting data not found. Please check transaction status again.');
      }

      console.log('Forwarding to checkout with crediting data:', creditingData);

      // Navigate to checkout with the transaction data
      const navigationExtras = {
        queryParams: {
          special: JSON.stringify(creditingData)
        }
      };

      await this.router.navigate(['/tabs/checkout'], navigationExtras);
      
      // Clear the storage after successful navigation
      await this.clearCompletedTransactionStorage(transaction);
      
      // Show success message
      this.notificationService.showSuccess('Transaction completed! Redirecting to checkout for crediting.');
      
    } catch (error: any) {
      console.error('Error forwarding to checkout:', error);
      this.notificationService.showError('Failed to forward to checkout: ' + (error?.message || 'Unknown error'));
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

  private async showCurrentStatus(transaction: Transaction, statusResponse: any) {
    const alert = await this.alertController.create({
      header: 'Transaction Status',
      message: `Transaction is still being processed.\n\nStatus: ${statusResponse.status}\nMessage: ${statusResponse.message}\n\nPlease check back later.`,
      buttons: ['OK']
    });

    await alert.present();
  }

  /**
   * Test method to check if modal component can be created
   */
  async testModalCreation(): Promise<void> {
    console.log('Testing modal creation...');
    
    try {
      // Test with a simple modal first
      const testModal = await this.modalController.create({
        component: 'ion-alert',
        componentProps: {
          header: 'Test Modal',
          message: 'This is a test modal to check if modal creation works.',
          buttons: ['OK']
        }
      });
      
      console.log('Test modal created successfully');
      await testModal.present();
      console.log('Test modal presented successfully');
      
      // Dismiss after 2 seconds
      setTimeout(() => {
        testModal.dismiss();
      }, 2000);
      
    } catch (error) {
      console.error('Error creating test modal:', error);
    }
  }

  /**
   * View transaction details in a modal
   */
  async viewTransactionDetails(transaction: Transaction): Promise<void> {
    console.log('Opening transaction details modal for:', transaction);
    
    if (!transaction) {
      console.error('No transaction provided to viewTransactionDetails');
      this.notificationService.showError('No transaction details available');
      return;
    }
    
    try {
      console.log('Creating modal with component:', TransactionDetailsModalComponent);
      console.log('Modal component type:', typeof TransactionDetailsModalComponent);
      
      const modal = await this.modalController.create({
        component: TransactionDetailsModalComponent,
        componentProps: {
          transaction: transaction
        },
        cssClass: 'transaction-details-modal',
        breakpoints: [0, 1],
        initialBreakpoint: 1,
        backdropDismiss: true,
        showBackdrop: true
      });

      console.log('Modal created successfully');
      
      // Add error handling for modal presentation
      modal.onDidDismiss().then((result) => {
        console.log('Modal dismissed with result:', result);
      }).catch((error) => {
        console.error('Error in modal dismiss handler:', error);
      });

      await modal.present();
      console.log('Modal presented successfully');
    } catch (error) {
      console.error('Error opening transaction details modal:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        this.notificationService.showError(`Failed to open transaction details: ${error.message}`);
      } else {
        this.notificationService.showError('Failed to open transaction details. Please try again.');
      }
      
      // Try to create a simple alert instead as fallback
      try {
        const alert = await this.alertController.create({
          header: 'Transaction Details',
          message: `Transaction ID: ${transaction.transId}\nAmount: ${transaction.monetary?.currency} ${transaction.monetary?.amount}\nRecipient: ${transaction.recipientNumber}\nStatus: ${transaction.status?.transaction || 'pending'}`,
          buttons: ['Close']
        });
        await alert.present();
      } catch (alertError) {
        console.error('Error creating fallback alert:', alertError);
      }
    }
  }

  get filteredTransactions(): Transaction[] {
    let filtered = this.pendingTransactions;

    // Filter by status - add safety check
    if (this.filterStatus && this.filterStatus !== 'ALL') {
      filtered = filtered.filter(t => t.status?.transaction === this.filterStatus?.toLowerCase());
    }

    // Filter by search term - add safety checks
    if (this.searchTerm && this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        (t.recipientNumber && t.recipientNumber.toLowerCase().includes(search)) ||
        (t.transType && t.transType.toLowerCase().includes(search)) ||
        (t.transId && t.transId.toLowerCase().includes(search)) ||
        (t.retailer && t.retailer.toLowerCase().includes(search))
      );
    }

    return filtered;
  }

  async refreshTransactions() {
    await this.loadPendingTransactions(1, false);
    this.notificationService.showSuccess('Transactions refreshed');
  }

  async refreshTransactionsAfterStatusChange() {
    console.log('Refreshing transactions after status change...');
    await this.loadPendingTransactions(1, false);
    
    // Show success message
    this.notificationService.showSuccess('Transaction list updated');
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

  getTransactionTypeIcon(transType: string): string {
    const icons: { [key: string]: string } = {
      'MOMO': 'swap-horizontal-outline',
      'AIRTIMETOPUP': 'phone-portrait-outline',
      'DATABUNDLELIST': 'cellular-outline',
      'GLOBALAIRTOPUP': 'phone-portrait-outline'
    };
    return icons[transType] || 'help-circle-outline';
  }

  formatPhoneNumber(phoneNumber: string): string {
    if (!phoneNumber) return '';
    
    // Use the phone validation service
    const validation = this.phoneValidationService.validateAndFormatGhanaPhoneNumber(phoneNumber);
    
    if (validation.isValid) {
      return validation.local; // Return local format (0XXXXXXXXX)
    }
    
    // If invalid, return original with warning
    return phoneNumber;
  }

  getPhoneNumberValidation(phoneNumber: string): {
    isValid: boolean;
    network: string;
    formatted: string;
    error?: string;
  } {
    if (!phoneNumber) {
      return {
        isValid: false,
        network: 'Unknown',
        formatted: '',
        error: 'Phone number is required'
      };
    }

    return this.phoneValidationService.validateAndFormatGhanaPhoneNumber(phoneNumber);
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'pending': return 'timeOutline';
      case 'completed': return 'checkmarkCircleOutline';
      case 'failed': return 'closeCircleOutline';
      default: return 'helpCircleOutline';
    }
  }

  getTransactionPriority(transaction: Transaction): number {
    // Higher priority for failed transactions, then pending
    if (transaction.status?.transaction === 'failed') return 3;
    if (transaction.status?.transaction === 'pending') return 2;
    return 1;
  }

  sortTransactionsByPriority(transactions: Transaction[]): Transaction[] {
    return transactions.sort((a, b) => {
      const priorityA = this.getTransactionPriority(a);
      const priorityB = this.getTransactionPriority(b);
      
      if (priorityA !== priorityB) {
        return priorityB - priorityA; // Higher priority first
      }
      
      // If same priority, sort by creation date (newest first)
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }

  /**
   * Toggle the status breakdown section open/closed
   */
  toggleStatusBreakdown(): void {
    this.isStatusBreakdownOpen = !this.isStatusBreakdownOpen;
  }

  /**
   * Get current transaction counts for home page
   */
  getCurrentTransactionCounts(): { pending: number; completed: number } {
    const pendingCount = this.pendingTransactions.length;
    // This would need to be implemented based on your requirements
    // For now, returning the current pending count
    return {
      pending: pendingCount,
      completed: 0 // This would need to be calculated from the API
    };
  }

  /**
   * Get pending transactions count for home page display
   */
  getPendingTransactionsCount(): number {
    return this.pendingTransactions.length;
  }

  /**
   * Refresh pending transactions count and notify home page
   */
  async refreshPendingTransactionsCount(): Promise<number> {
    try {
      await this.loadPendingTransactions();
      const count = this.getPendingTransactionsCount();
      
      // Store the count for home page access
      await this.storage.setStorage('pendingTransactionsCount', count.toString());
      
      return count;
    } catch (error) {
      console.error('Error refreshing pending transactions count:', error);
      return 0;
    }
  }
}
