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
  IonRefresher,
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
  isRefreshing: boolean = false;
  lastRefreshTime: Date | null = null;
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
      
      // Set initial refresh time
      if (!this.lastRefreshTime) {
        this.lastRefreshTime = new Date();
      }
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

  /**
   * Handle pull-to-refresh to reload transactions
   * This is useful when transactions take longer to appear
   */
  async handleRefresh(event: any) {
    try {
      console.log('[My Orders] => Refreshing transactions...');
      
      // Reset to first page when refreshing
      this.currentPage = 1;
      
      // Reload transactions
      await this.loadTransactions(this.currentPage);
      
      // Update refresh timestamp
      this.lastRefreshTime = new Date();
      
      // Show success message
      this.notificationService.showSuccess('Transactions refreshed successfully');
      
      console.log('[My Orders] => Refresh completed');
    } catch (error) {
      console.error('[My Orders] => Refresh failed:', error);
      this.notificationService.showError('Failed to refresh transactions. Please try again.');
    } finally {
      // Complete the refresh animation
      event.target.complete();
    }
  }

  /**
   * Handle manual refresh button click
   * This provides an alternative way to refresh transactions
   */
  async handleManualRefresh() {
    try {
      console.log('[My Orders] => Manual refresh triggered...');
      
      // Show refreshing state
      this.isRefreshing = true;
      
      // Reset to first page when refreshing
      this.currentPage = 1;
      
      // Reload transactions
      await this.loadTransactions(this.currentPage);
      
      // Update refresh timestamp
      this.lastRefreshTime = new Date();
      
      // Show success message
      this.notificationService.showSuccess('Transactions refreshed successfully');
      
      console.log('[My Orders] => Manual refresh completed');
    } catch (error) {
      console.error('[My Orders] => Manual refresh failed:', error);
      this.notificationService.showError('Failed to refresh transactions. Please try again.');
    } finally {
      // Hide refreshing state
      this.isRefreshing = false;
    }
  }
  /**
   * Get a user-friendly string showing how long ago the last refresh happened
   */
  getLastRefreshText(): string {
    if (!this.lastRefreshTime) {
      return 'Never refreshed';
    }

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - this.lastRefreshTime.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
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
