import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonSpinner,
  IonFooter
} from '@ionic/angular/standalone';

// Define the Transaction interface locally since the model file doesn't exist
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
  monetary?: {
    amount: number;
    fee: number;
    originalAmount: string;
    currency: string;
    _id: string;
  };
  status?: {
    transaction?: 'pending' | 'completed' | 'failed';
    service?: 'pending' | 'completed' | 'failed';
    payment?: 'pending' | 'completed' | 'failed';
  };
  createdAt?: string;
  updatedAt?: string;
  notes?: string;
  reference?: string;
}

@Component({
  selector: 'app-transaction-details-modal',
  templateUrl: './transaction-details-modal.component.html',
  styleUrls: ['./transaction-details-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonSpinner,
    IonFooter
  ]
})
export class TransactionDetailsModalComponent implements OnChanges {
  @Input() transaction!: Transaction;

  constructor(private modalController: ModalController) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['transaction'] && changes['transaction'].currentValue) {
      console.log('TransactionDetailsModalComponent ngOnChanges - transaction:', this.transaction);
    }
  }

  ngOnInit() {
    console.log('TransactionDetailsModalComponent ngOnInit - transaction:', this.transaction);
  }

  /**
   * Close the modal
   */
  closeModal(): void {
    this.modalController.dismiss();
  }

  /**
   * Get transaction type icon
   */
  getTransactionTypeIcon(): string {
    switch (this.transaction.transType) {
      case 'AIRTIMETOPUP':
        return 'phone-portrait-outline';
      case 'MOMO':
        return 'swap-horizontal-outline';
      case 'DATABUNDLELIST':
        return 'cellular-outline';
      default:
        return 'document-outline';
    }
  }

  /**
   * Get transaction type display name
   */
  getTransactionTypeDisplay(transType: string): string {
    switch (transType) {
      case 'AIRTIMETOPUP':
        return 'Airtime Top-up';
      case 'MOMO':
        return 'Mobile Money Transfer';
      case 'DATABUNDLELIST':
        return 'Data Bundle';
      default:
        return transType;
    }
  }

  /**
   * Get status color for status indicators
   */
  getStatusColor(status: string | undefined): string {
    if (!status) return 'medium';
    
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'success';
      case 'failed':
      case 'error':
        return 'danger';
      case 'pending':
        return 'warning';
      default:
        return 'medium';
    }
  }

  /**
   * Get status icon for status indicators
   */
  getStatusIcon(status: string | undefined): string {
    if (!status) return 'help-circle-outline';
    
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'checkmark-circle-outline';
      case 'failed':
      case 'error':
        return 'close-circle-outline';
      case 'pending':
        return 'time-outline';
      default:
        return 'help-circle-outline';
    }
  }

  /**
   * Format amount with currency
   */
  formatAmount(amount: number | undefined): string {
    if (amount === undefined || amount === null) return 'GHS 0.00';
    return `GHS ${amount.toFixed(2)}`;
  }

  /**
   * Format date
   */
  formatDate(date: string | Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-GH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
