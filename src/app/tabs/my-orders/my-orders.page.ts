import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  PopoverController,
  ModalController,
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { NotificationService } from 'src/app/services/notification.service';
import { StateService } from 'src/app/services/state.service';
import { HistoryService } from 'src/app/services/transactions/history.service';
import { FilterModalComponent } from './filter-modal/filter-modal.component';
import { SortPopoverComponent } from './sort-popover/sort-popover.component';
import { TranslateModule } from '@ngx-translate/core';

interface Transaction {
  _id: string;
  userId: string;
  firstName: string;
  lastName: string;
  transType: string;
  recipientNumber: string;
  retailer: string;
  monetary: {
    amount: number;
    fee: number;
    originalAmount: string;
    currency: string;
  };
  status: {
    transaction: string;
    service: string;
    payment: string;
  };
  payment: {
    type: string;
    currency: string;
    commentary: string;
    serviceCode: string;
    transactionId: string;
  };
  transId: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}
@Component({
  selector: 'app-my-orders',
  templateUrl: './my-orders.page.html',
  styleUrls: ['./my-orders.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    CommonModule,
    FormsModule,
    TranslateModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MyOrdersPage implements OnInit {
  isLoading: boolean = true;
  transactions: Transaction[] = [];
  currentPage: number = 1;
  totalPages: number = 0;
  selectedFilter: string = 'all';
  filteredTransactions: Transaction[] = [];
  sortOption: string = 'newest';

  constructor(
    private router: Router,
    private notificationService: NotificationService,
    private historyService: HistoryService,
    private stateService: StateService,
    private popoverController: PopoverController,
    private modalController: ModalController
  ) {}

  ngOnInit() {
    this.loadTransactions(this.currentPage);
  }

  private async loadTransactions(page: number = 1, limit: number = 10) {
    this.isLoading = true;
    try {
      const userId = this.stateService.getUserId();
      console.log('[My Orders] => userId', userId);
      if (!userId) {
        throw new Error('User ID not found');
      }
      const response = await firstValueFrom(
        this.historyService.getTransactionByUserId(userId, page, limit)
      );
      console.log('[My Orders] => user transactions', response);
      this.transactions = response.transactions || [];
      this.totalPages = response.totalPages; // Set total pages from response
      this.applyFilters(); // Apply filters after loading
    } catch (error) {
      console.error('Failed to load transactions:', error);
      this.notificationService.showError(
        'Failed to load transactions. Please try again.'
      );
    } finally {
      this.isLoading = false;
    }
  }

  filterTransactions(type: string) {
    this.selectedFilter = type;
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.transactions];

    // Apply type filter
    if (this.selectedFilter !== 'all') {
      filtered = filtered.filter(
        (t) => t.transType.toLowerCase() === this.selectedFilter
      );
    }
    // Apply sort
    filtered.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return this.sortOption === 'newest' ? dateB - dateA : dateA - dateB;
    });

    this.filteredTransactions = filtered;
  }
  async openSortOptions(ev: any) {
    const popover = await this.popoverController.create({
      component: SortPopoverComponent,
      event: ev,
      translucent: true,
      componentProps: {
        currentSort: this.sortOption,
      },
    });

    await popover.present();

    const { data } = await popover.onDidDismiss();
    if (data) {
      this.sortOption = data.sort;
      this.applyFilters();
    }
  }
  async openFilterModal() {
    const modal = await this.modalController.create({
      component: FilterModalComponent,
      componentProps: {
        transactions: this.transactions,
      },
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data) {
      // Apply additional filters (date range, amount range, etc.)
      this.applyAdvancedFilters(data.filters);
    }
  }

  getEmptyStateMessage(): string {
    if (this.selectedFilter === 'all') {
      return "You haven't made any transactions yet";
    }
    return `No ${this.selectedFilter} transactions found`;
  }

  viewTransaction(transaction: Transaction) {
    this.router.navigate(['/tabs/transaction-details', transaction._id]);
  }
  deleteTransaction(transaction: Transaction) {
    // Implement delete logic here
    console.log('Delete transaction:', transaction);
  }
  changePage(page: number) {
    if (page > 0 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadTransactions(this.currentPage);
    }
  }
  getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
      case 'ERROR':
        return 'danger';
      default:
        return 'medium'; // Default color for unknown statuses
    }
  }
  getTransactionIcon(transType: string): string {
    switch (transType.toLowerCase()) {
      case 'airtimetopup':
        return 'phone-portrait-outline';
      case 'globalairtopup':
        return 'globe-outline';
      case 'databundle':
        return 'wifi-outline';
      case 'momo':
        return 'cash-outline';
      default:
        return 'card-outline';
    }
  }
  getTransactionTitle(transaction: Transaction): string {
    switch (transaction.transType.toLowerCase()) {
      case 'airtimetopup':
        return `Airtime Topup - ${transaction.retailer}`;
      case 'globalairtopup':
        return `International Topup - ${transaction.retailer}`;
      case 'databundle':
        return `Data Bundle - ${transaction.retailer}`;
      case 'momo':
        return `Money Transfer - ${transaction.retailer}`;
      default:
        return transaction.transType;
    }
  }
  // Add this method to handle advanced filters
  applyAdvancedFilters(filters: any) {
    let filtered = [...this.transactions];
    // Apply date range filter
    if (filters.dateFrom || filters.dateTo) {
      filtered = filtered.filter((transaction) => {
        const transDate = new Date(transaction.timestamp);
        const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
        const toDate = filters.dateTo ? new Date(filters.dateTo) : null;

        if (fromDate && toDate) {
          return transDate >= fromDate && transDate <= toDate;
        } else if (fromDate) {
          return transDate >= fromDate;
        } else if (toDate) {
          return transDate <= toDate;
        }
        return true;
      });
    }
    // Apply amount range filter
    if (filters.minAmount || filters.maxAmount) {
      filtered = filtered.filter((transaction) => {
        const amount = transaction.monetary.amount;
        if (filters.minAmount && filters.maxAmount) {
          return amount >= filters.minAmount && amount <= filters.maxAmount;
        } else if (filters.minAmount) {
          return amount >= filters.minAmount;
        } else if (filters.maxAmount) {
          return amount <= filters.maxAmount;
        }
        return true;
      });
    }
    // Apply status filter
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter((transaction) =>
        filters.status.includes(transaction.status.transaction.toLowerCase())
      );
    }
    // Apply existing type filter
    if (this.selectedFilter !== 'all') {
      filtered = filtered.filter(
        (t) => t.transType.toLowerCase() === this.selectedFilter
      );
    }
    // Apply sort
    filtered.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return this.sortOption === 'newest' ? dateB - dateA : dateA - dateB;
    });

    this.filteredTransactions = filtered;
  }
}
