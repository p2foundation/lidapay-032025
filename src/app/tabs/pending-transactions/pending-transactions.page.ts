import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil, firstValueFrom } from 'rxjs';
import { addIcons } from 'ionicons';
import { 
  refreshOutline, 
  checkmarkCircleOutline, 
  trashOutline 
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

import { NotificationService } from '../../services/notification.service';
import { AirtimeService } from '../../services/one4all/airtime.service';
import { InternetDataService } from '../../services/one4all/internet.data.service';
import { AdvansisPayService } from '../../services/payments/advansis-pay.service';
import { MobileMoneyService } from '../../services/payments/mobile.money.service';
import { ReloadlyAirtimeService } from '../../services/reloadly/reloadly-airtime.service';
import { StorageService } from '../../services/storage.service';
import { GlobalService } from '../../services/global.service';
import { UtilsService } from '../../services/utils.service';

interface PendingTransaction {
  id: string;
  transType: 'AIRTIMETOPUP' | 'DATABUNDLELIST' | 'GLOBALAIRTOPUP';
  status: 'PENDING' | 'FAILED';
  amount: number;
  currency: string;
  recipientNumber: string;
  network?: string;
  description: string;
  timestamp: string;
  orderId?: string;
  token?: string;
  retryCount?: number;
  operatorId?: string;
  recipientCountryCode?: string;
  senderNumber?: string;
  customerEmail?: string;
  payTransRef?: string;
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
  pendingTransactions: PendingTransaction[] = [];
  isLoading = false;
  isProcessing = false;
  processingTransactionId: string | null = null;
  
  // Filter options
  filterStatus: 'ALL' | 'PENDING' | 'FAILED' = 'ALL';
  searchTerm = '';

  private destroy$ = new Subject<void>();

  constructor(
    private storage: StorageService,
    private notificationService: NotificationService,
    private airtimeService: AirtimeService,
    private internetDataService: InternetDataService,
    private advansisPayService: AdvansisPayService,
    private mobileMoneyService: MobileMoneyService,
    private reloadlyService: ReloadlyAirtimeService,
    private globalService: GlobalService,
    private utilService: UtilsService,
    private modalController: ModalController,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController
  ) {
    addIcons({ refreshOutline, checkmarkCircleOutline, trashOutline });
  }

  ngOnInit() {
    this.loadPendingTransactions();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadPendingTransactions() {
    this.isLoading = true;
    try {
      // Get all stored transactions
      const allKeys = await this.storage.getAllKeys();
      const pendingKeys = allKeys.filter(key => 
        key.startsWith('pendingTransaction_') || 
        key === 'pendingTransaction'
      );

      const transactions: PendingTransaction[] = [];

      for (const key of pendingKeys) {
        try {
          const transactionData = await this.storage.getStorage(key);
          if (transactionData) {
            const transaction = typeof transactionData === 'string' 
              ? JSON.parse(transactionData) 
              : transactionData;

            // Only include failed or pending transactions
            if (transaction.status === 'FAILED' || transaction.status === 'PENDING') {
              transactions.push({
                id: key,
                transType: transaction.transType,
                status: transaction.status,
                amount: transaction.amount,
                currency: transaction.currency || 'GHS',
                recipientNumber: transaction.recipientNumber,
                network: transaction.network,
                description: transaction.description || transaction.orderDesc,
                timestamp: transaction.timestamp,
                orderId: transaction.orderId,
                token: transaction.token,
                retryCount: transaction.retryCount || 0,
                operatorId: transaction.operatorId,
                recipientCountryCode: transaction.recipientCountryCode,
                senderNumber: transaction.senderNumber,
                customerEmail: transaction.customerEmail,
                payTransRef: transaction.payTransRef,
              });
            }
          }
        } catch (error) {
          console.error(`Error parsing transaction ${key}:`, error);
        }
      }

      // Sort by timestamp (newest first)
      this.pendingTransactions = transactions.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      console.log('Loaded pending transactions:', this.pendingTransactions);
    } catch (error) {
      console.error('Error loading pending transactions:', error);
      this.notificationService.showError('Failed to load pending transactions');
    } finally {
      this.isLoading = false;
    }
  }

  get filteredTransactions(): PendingTransaction[] {
    let filtered = this.pendingTransactions;

    // Filter by status
    if (this.filterStatus !== 'ALL') {
      filtered = filtered.filter(t => t.status === this.filterStatus);
    }

    // Filter by search term
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.recipientNumber.toLowerCase().includes(search) ||
        t.description.toLowerCase().includes(search) ||
        t.network?.toLowerCase().includes(search) ||
        t.orderId?.toLowerCase().includes(search)
      );
    }

    return filtered;
  }

  async initiateCrediting(transaction: PendingTransaction) {
    const alert = await this.alertController.create({
      header: 'Confirm Crediting',
      message: `Are you sure you want to initiate crediting for this transaction?\n\nAmount: ${transaction.currency} ${transaction.amount}\nRecipient: ${transaction.recipientNumber}\nNetwork: ${transaction.network || 'N/A'}`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Proceed',
          handler: () => this.processCrediting(transaction)
        }
      ]
    });

    await alert.present();
  }

  async processCrediting(transaction: PendingTransaction) {
    this.isProcessing = true;
    this.processingTransactionId = transaction.id;

    const loading = await this.loadingController.create({
      message: 'Initiating crediting...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      console.log('Processing crediting for transaction:', transaction);

      let result: any;

      switch (transaction.transType) {
        case 'AIRTIMETOPUP':
          result = await this.processAirtimeCrediting(transaction);
          break;
        case 'DATABUNDLELIST':
          result = await this.processDataBundleCrediting(transaction);
          break;
        case 'GLOBALAIRTOPUP':
          result = await this.processGlobalAirtimeCrediting(transaction);
          break;
        default:
          throw new Error(`Unsupported transaction type: ${transaction.transType}`);
      }

      // Update transaction status
      await this.updateTransactionStatus(transaction.id, 'COMPLETED', result);

      // Show success message
      await this.showSuccessMessage(transaction, result);

      // Remove from pending list
      this.pendingTransactions = this.pendingTransactions.filter(t => t.id !== transaction.id);

    } catch (error: any) {
      console.error('Error processing crediting:', error);
      
      // Update transaction status to failed
      await this.updateTransactionStatus(transaction.id, 'FAILED', { error: error.message });
      
      this.notificationService.showError(error.message || 'Failed to process crediting');
    } finally {
      this.isProcessing = false;
      this.processingTransactionId = null;
      await loading.dismiss();
    }
  }

  private async processAirtimeCrediting(transaction: PendingTransaction): Promise<any> {
    const params = {
      recipientNumber: transaction.recipientNumber,
      amount: transaction.amount,
      network: this.getNetworkId(transaction.network || ''),
      description: transaction.description,
      payTransRef: transaction.payTransRef || await this.utilService.generateReference()
    };

    console.log('Airtime crediting params:', params);
    return await firstValueFrom(this.airtimeService.buyAirtimeTopup(params));
  }

  private async processDataBundleCrediting(transaction: PendingTransaction): Promise<any> {
    const params = {
      recipientNumber: transaction.recipientNumber,
      dataCode: transaction.operatorId || '',
      network: this.getNetworkId(transaction.network || ''),
      description: transaction.description,
      payTransRef: transaction.payTransRef || await this.utilService.generateReference()
    };

    console.log('Data bundle crediting params:', params);
    return await firstValueFrom(this.internetDataService.buyInternetData(params));
  }

  private async processGlobalAirtimeCrediting(transaction: PendingTransaction): Promise<any> {
    const params = {
      operatorId: transaction.operatorId || '',
      amount: transaction.amount,
      recipientNumber: transaction.recipientNumber,
      recipientCountryCode: transaction.recipientCountryCode || 'GH',
      description: transaction.description,
      payTransRef: transaction.payTransRef || await this.utilService.generateReference()
    };

    console.log('Global airtime crediting params:', params);
    return await firstValueFrom(this.reloadlyService.makeAirtimeTopup(params));
  }

  private getNetworkId(networkName: string): number {
    const networkMapping: { [key: string]: number } = {
      'MTN': 1,
      'TELECEL': 2,
      'AIRTELTIGO': 3,
      'GLO': 4
    };
    return networkMapping[networkName.toUpperCase()] || 1;
  }

  private async updateTransactionStatus(transactionId: string, status: string, result: any) {
    try {
      const transactionData = await this.storage.getStorage(transactionId);
      if (transactionData) {
        const transaction = typeof transactionData === 'string' 
          ? JSON.parse(transactionData) 
          : transactionData;

        transaction.status = status;
        transaction.result = result;
        transaction.updatedAt = new Date().toISOString();

        await this.storage.setStorage(transactionId, JSON.stringify(transaction));
        console.log(`Updated transaction ${transactionId} status to ${status}`);
      }
    } catch (error) {
      console.error('Error updating transaction status:', error);
    }
  }

  private async showSuccessMessage(transaction: PendingTransaction, result: any) {
    const alert = await this.alertController.create({
      header: 'Crediting Successful!',
      message: `Transaction processed successfully!\n\nAmount: ${transaction.currency} ${transaction.amount}\nRecipient: ${transaction.recipientNumber}\nTransaction ID: ${result.transactionId || 'N/A'}`,
      buttons: ['OK']
    });
    await alert.present();
  }

  async deleteTransaction(transaction: PendingTransaction) {
    const alert = await this.alertController.create({
      header: 'Delete Transaction',
      message: 'Are you sure you want to delete this pending transaction? This action cannot be undone.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            try {
              await this.storage.removeStorage(transaction.id);
              this.pendingTransactions = this.pendingTransactions.filter(t => t.id !== transaction.id);
              this.notificationService.showSuccess('Transaction deleted successfully');
            } catch (error) {
              console.error('Error deleting transaction:', error);
              this.notificationService.showError('Failed to delete transaction');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async refreshTransactions() {
    await this.loadPendingTransactions();
    this.notificationService.showSuccess('Transactions refreshed');
  }

  formatDate(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
  }

  formatAmount(amount: number): string {
    return amount.toFixed(2);
  }

  getStatusColor(status: string): string {
    return status === 'PENDING' ? 'warning' : 'danger';
  }

  getTransactionTypeLabel(transType: string): string {
    const labels: { [key: string]: string } = {
      'AIRTIMETOPUP': 'Airtime',
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
      // Convert 2330244588584 -> 0244588584
      return cleanNumber.slice(3);
    } else if (cleanNumber.length === 13 && cleanNumber.startsWith('233')) {
      // Convert +2330244588584 -> 0244588584
      return cleanNumber.slice(3);
    } else if (cleanNumber.length === 10 && cleanNumber.startsWith('0')) {
      // Keep as is: 0244588584
      return cleanNumber;
    }
    
    // For any other format, return as is
    return phoneNumber;
  }
}
