import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil, combineLatest, of } from 'rxjs';

import { 
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonList,
  IonListHeader,
  IonSpinner,
  IonChip,
  IonBadge,
  IonGrid,
  IonRow,
  IonCol,
  IonModal,
  IonTextarea,
  IonToggle,
  IonSegment,
  IonSegmentButton,
  IonRefresher,
  IonRefresherContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonAlert,
  IonToast,
  IonPopover,
  IonFab,
  IonFabButton,
  IonActionSheet,
  IonSearchbar
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { 
  walletOutline,
  addOutline,
  removeOutline,
  swapHorizontalOutline,
  analyticsOutline,
  settingsOutline,
  refreshOutline,
  searchOutline,
  filterOutline,
  downloadOutline,
  eyeOutline,
  eyeOffOutline,
  lockClosedOutline,
  shieldCheckmarkOutline,
  notificationsOutline,
  trendingUpOutline,
  trendingDownOutline,
  timeOutline,
  calendarOutline,
  cardOutline,
  phonePortraitOutline,
  chevronForwardOutline,
  chevronDownOutline,
  closeOutline,
  checkmarkOutline,
  alertCircleOutline,
  informationCircleOutline,
  ellipsisVerticalOutline
} from 'ionicons/icons';

import { WalletService } from '../../services/wallet.service';
import { NotificationService } from '../../services/notification.service';
import { StorageService } from '../../services/storage.service';
import { 
  Wallet, 
  WalletTransaction, 
  WalletBalance, 
  WalletStats, 
  WalletSettings,
  WalletRecharge,
  WalletWithdrawal,
  WalletTransfer
} from '../../interfaces/wallet.interface';

// Register all icons used in this component
addIcons({
  'wallet': walletOutline,
  'add': addOutline,
  'remove': removeOutline,
  'swap-horizontal': swapHorizontalOutline,
  'analytics': analyticsOutline,
  'settings': settingsOutline,
  'refresh': refreshOutline,
  'search': searchOutline,
  'filter': filterOutline,
  'download': downloadOutline,
  'eye': eyeOutline,
  'eye-off': eyeOffOutline,
  'lock-closed': lockClosedOutline,
  'shield-checkmark': shieldCheckmarkOutline,
  'notifications': notificationsOutline,
  'trending-up': trendingUpOutline,
  'trending-down': trendingDownOutline,
  'time': timeOutline,
  'calendar': calendarOutline,
  'card': cardOutline,
  'phone-portrait': phonePortraitOutline,
  'chevron-forward': chevronForwardOutline,
  'chevron-down': chevronDownOutline,
  'close': closeOutline,
  'checkmark': checkmarkOutline,
  'alert-circle': alertCircleOutline,
  'information-circle': informationCircleOutline,
  'ellipsis-vertical': ellipsisVerticalOutline
});

enum WalletTab {
  OVERVIEW = 'overview',
  TRANSACTIONS = 'transactions',
  ANALYTICS = 'analytics',
  SETTINGS = 'settings'
}

@Component({
  selector: 'app-wallet-management',
  templateUrl: './wallet-management.page.html',
  styleUrls: ['./wallet-management.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonListHeader,
    IonSpinner,
    IonChip,
    IonBadge,
    IonGrid,
    IonRow,
    IonCol,
    IonModal,
    IonTextarea,
    IonToggle,
    IonSegment,
    IonSegmentButton,
    IonRefresher,
    IonRefresherContent,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonFab,
    IonFabButton,
    IonSearchbar
  ]
})
export class WalletManagementPage implements OnInit, OnDestroy {
  // Enums
  WalletTab = WalletTab;
  
  // Current state
  currentTab: WalletTab = WalletTab.OVERVIEW;
  isLoading = false;
  isRefreshing = false;
  showBalance = true;
  
  // Data
  wallet: Wallet | null = null;
  balance: WalletBalance | null = null;
  transactions: WalletTransaction[] = [];
  stats: WalletStats | null = null;
  settings: WalletSettings | null = null;
  
  // Pagination
  currentPage = 0;
  pageSize = 20;
  hasMoreTransactions = true;
  
  // Search and filters
  searchQuery = '';
  selectedFilters = {
    type: '',
    category: '',
    status: '',
    startDate: '',
    endDate: ''
  };
  
  // Forms
  rechargeForm!: FormGroup;
  withdrawalForm!: FormGroup;
  transferForm!: FormGroup;
  settingsForm!: FormGroup;
  
  // Modals
  showRechargeModal = false;
  showWithdrawalModal = false;
  showTransferModal = false;
  showSettingsModal = false;
  
  // Quick actions
  quickAmounts = [10, 20, 50, 100, 200, 500];
  
  // Modal presenting element
  presentingElement: HTMLElement | null = null;
  
  private destroy$ = new Subject<void>();

  constructor(
    private walletService: WalletService,
    private notificationService: NotificationService,
    private storage: StorageService,
    private formBuilder: FormBuilder
  ) {
    this.initializeForms();
  }

  ngOnInit() {
    this.loadWalletData();
    this.setupSubscriptions();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize form controls
   */
  private initializeForms() {
    this.rechargeForm = this.formBuilder.group({
      amount: ['', [Validators.required, Validators.min(1)]],
      paymentMethod: ['card', Validators.required],
      description: ['Wallet recharge']
    });

    this.withdrawalForm = this.formBuilder.group({
      amount: ['', [Validators.required, Validators.min(1)]],
      destination: ['mobile_money', Validators.required],
      accountDetails: ['', Validators.required],
      description: ['Wallet withdrawal']
    });

    this.transferForm = this.formBuilder.group({
      amount: ['', [Validators.required, Validators.min(1)]],
      recipientWallet: ['', Validators.required],
      description: ['', Validators.required]
    });

    this.settingsForm = this.formBuilder.group({
      notifications: this.formBuilder.group({
        lowBalance: [true],
        largeTransactions: [true],
        failedTransactions: [true],
        successfulTransactions: [false]
      }),
      limits: this.formBuilder.group({
        dailySpending: [1000],
        monthlySpending: [10000],
        singleTransaction: [500]
      }),
      security: this.formBuilder.group({
        requirePin: [false],
        requireBiometric: [false],
        autoLock: [true],
        lockTimeout: [5]
      })
    });
  }

  /**
   * Setup subscriptions to wallet data
   */
  private setupSubscriptions() {
    // Subscribe to wallet data changes
    combineLatest([
      this.walletService.wallet$,
      this.walletService.balance$,
      this.walletService.transactions$,
      this.walletService.stats$
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(([wallet, balance, transactions, stats]) => {
      this.wallet = wallet;
      this.balance = balance;
      this.transactions = transactions;
      this.stats = stats;
      this.isLoading = false;
    });
  }

  /**
   * Load initial wallet data
   */
  private loadWalletData() {
    this.isLoading = true;
    this.walletService.refreshWalletData();
  }

  /**
   * Handle tab changes
   */
  onTabChange(event: any) {
    this.currentTab = event.detail.value;
    
    // Load specific data for each tab
    switch (this.currentTab) {
      case WalletTab.TRANSACTIONS:
        this.loadTransactions();
        break;
      case WalletTab.ANALYTICS:
        this.loadAnalytics();
        break;
      case WalletTab.SETTINGS:
        this.loadSettings();
        break;
    }
  }

  /**
   * Load transactions with pagination
   */
  loadTransactions() {
    if (this.currentPage === 0) {
      this.transactions = [];
    }
    
    this.walletService.getTransactions(this.pageSize, this.currentPage * this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (transactions) => {
          if (transactions.length < this.pageSize) {
            this.hasMoreTransactions = false;
          }
          this.currentPage++;
        },
        error: (error) => {
          console.error('Error loading transactions:', error);
          this.notificationService.showError('Failed to load transactions');
        }
      });
  }

  /**
   * Load analytics data
   */
  private loadAnalytics() {
    this.walletService.getStats('monthly')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (error) => {
          console.error('Error loading analytics:', error);
          this.notificationService.showError('Failed to load analytics');
        }
      });
  }

  /**
   * Load wallet settings
   */
  private loadSettings() {
    this.walletService.getSettings()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (settings) => {
          this.settings = settings;
          this.settingsForm.patchValue(settings);
        },
        error: (error) => {
          console.error('Error loading settings:', error);
          this.notificationService.showError('Failed to load settings');
        }
      });
  }

  /**
   * Handle pull-to-refresh
   */
  onRefresh(event: any) {
    this.isRefreshing = true;
    this.currentPage = 0;
    this.hasMoreTransactions = true;
    
    this.walletService.refreshWalletData();
    
    setTimeout(() => {
      this.isRefreshing = false;
      event.target.complete();
    }, 1000);
  }

  /**
   * Handle infinite scroll
   */
  onInfiniteScroll(event: any) {
    if (this.hasMoreTransactions) {
      this.loadTransactions();
    }
    
    setTimeout(() => {
      event.target.complete();
    }, 500);
  }

  /**
   * Toggle balance visibility
   */
  toggleBalanceVisibility() {
    this.showBalance = !this.showBalance;
  }

  /**
   * Handle quick recharge
   */
  onQuickRecharge(amount: number) {
    this.rechargeForm.patchValue({ amount });
    this.showRechargeModal = true;
  }

  /**
   * Refresh wallet data
   */
  refreshWalletData() {
    this.isLoading = true;
    this.currentPage = 0;
    this.hasMoreTransactions = true;
    this.walletService.refreshWalletData();
  }

  /**
   * Submit recharge form
   */
  async onSubmitRecharge() {
    if (this.rechargeForm.invalid) {
      this.notificationService.showError('Please fill all required fields');
      return;
    }

    const formData = this.rechargeForm.value;
    const rechargeData: Omit<WalletRecharge, '_id' | 'status' | 'createdAt' | 'updatedAt'> = {
      amount: formData.amount,
      currency: this.balance?.currency || 'GHS',
      paymentMethod: formData.paymentMethod,
      reference: `RECHARGE_${Date.now()}`,
      gateway: 'advansis_pay',
      metadata: {
        description: formData.description
      }
    };

    this.isLoading = true;
    this.walletService.rechargeWallet(rechargeData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showRechargeModal = false;
          this.rechargeForm.reset();
          this.notificationService.showSuccess('Recharge initiated successfully');
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Recharge error:', error);
        },
        complete: () => {
          this.isLoading = false;
        }
      });
  }

  /**
   * Submit withdrawal form
   */
  async onSubmitWithdrawal() {
    if (this.withdrawalForm.invalid) {
      this.notificationService.showError('Please fill all required fields');
      return;
    }

    const formData = this.withdrawalForm.value;
    const withdrawalData: Omit<WalletWithdrawal, '_id' | 'status' | 'createdAt' | 'updatedAt'> = {
      amount: formData.amount,
      currency: this.balance?.currency || 'GHS',
      destination: formData.destination,
      accountDetails: formData.accountDetails,
      reference: `WITHDRAWAL_${Date.now()}`,
      fee: 0, // Will be calculated by backend
      netAmount: formData.amount,
      metadata: {
        description: formData.description
      }
    };

    this.isLoading = true;
    this.walletService.withdrawFromWallet(withdrawalData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showWithdrawalModal = false;
          this.withdrawalForm.reset();
          this.notificationService.showSuccess('Withdrawal initiated successfully');
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Withdrawal error:', error);
        },
        complete: () => {
          this.isLoading = false;
        }
      });
  }

  /**
   * Submit transfer form
   */
  async onSubmitTransfer() {
    if (this.transferForm.invalid) {
      this.notificationService.showError('Please fill all required fields');
      return;
    }

    const formData = this.transferForm.value;
    const transferData: Omit<WalletTransfer, '_id' | 'status' | 'createdAt' | 'updatedAt'> = {
      fromWalletId: this.wallet?._id || '',
      toWalletId: formData.recipientWallet,
      amount: formData.amount,
      currency: this.balance?.currency || 'GHS',
      description: formData.description,
      reference: `TRANSFER_${Date.now()}`,
      fee: 0, // Will be calculated by backend
      metadata: {}
    };

    this.isLoading = true;
    this.walletService.transferBetweenWallets(transferData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showTransferModal = false;
          this.transferForm.reset();
          this.notificationService.showSuccess('Transfer initiated successfully');
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Transfer error:', error);
        },
        complete: () => {
          this.isLoading = false;
        }
      });
  }

  /**
   * Submit settings form
   */
  async onSubmitSettings() {
    if (this.settingsForm.invalid) {
      this.notificationService.showError('Please fill all required fields');
      return;
    }

    const formData = this.settingsForm.value;
    this.isLoading = true;
    
    this.walletService.updateSettings(formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedSettings) => {
          this.settings = updatedSettings;
          this.showSettingsModal = false;
          this.notificationService.showSuccess('Settings updated successfully');
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Settings update error:', error);
        },
        complete: () => {
          this.isLoading = false;
        }
      });
  }

  /**
   * Search transactions
   */
  onSearchTransactions() {
    if (!this.searchQuery.trim()) {
      this.loadTransactions();
      return;
    }

    this.walletService.searchTransactions(this.searchQuery, this.selectedFilters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (transactions) => {
          this.transactions = transactions;
          this.hasMoreTransactions = false; // Disable infinite scroll for search results
        },
        error: (error) => {
          console.error('Search error:', error);
          this.notificationService.showError('Search failed');
        }
      });
  }

  /**
   * Clear search and filters
   */
  clearSearchAndFilters() {
    this.searchQuery = '';
    this.selectedFilters = {
      type: '',
      category: '',
      status: '',
      startDate: '',
      endDate: ''
    };
    this.currentPage = 0;
    this.hasMoreTransactions = true;
    this.loadTransactions();
  }

  /**
   * Export transactions
   */
  exportTransactions(format: 'csv' | 'pdf' | 'excel') {
    this.walletService.exportTransactions(format, this.selectedFilters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `wallet-transactions-${new Date().toISOString().split('T')[0]}.${format}`;
          a.click();
          window.URL.revokeObjectURL(url);
          this.notificationService.showSuccess(`Transactions exported as ${format.toUpperCase()}`);
        },
        error: (error) => {
          console.error('Export error:', error);
          this.notificationService.showError('Export failed');
        }
      });
  }

  /**
   * Get transaction status color
   */
  getTransactionStatusColor(status: string): string {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'danger';
      case 'cancelled': return 'medium';
      default: return 'medium';
    }
  }

  /**
   * Get transaction type icon
   */
  getTransactionTypeIcon(type: string): string {
    switch (type) {
      case 'credit': return 'add';
      case 'debit': return 'remove';
      case 'transfer': return 'swap-horizontal';
      case 'refund': return 'refresh';
      case 'bonus': return 'gift';
      case 'fee': return 'card';
      default: return 'wallet';
    }
  }

  /**
   * Get transaction category color
   */
  getTransactionCategoryColor(category: string): string {
    switch (category) {
      case 'airtime': return 'primary';
      case 'data': return 'secondary';
      case 'transfer': return 'tertiary';
      case 'payment': return 'success';
      case 'recharge': return 'warning';
      case 'withdrawal': return 'danger';
      case 'bonus': return 'success';
      case 'fee': return 'medium';
      default: return 'medium';
    }
  }

  /**
   * Format amount for display
   */
  formatAmount(amount: number, currency: string = 'GHS'): string {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-GH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Get relative time
   */
  getRelativeTime(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  }

  /**
   * Close all modals
   */
  closeModals() {
    this.showRechargeModal = false;
    this.showWithdrawalModal = false;
    this.showTransferModal = false;
    this.showSettingsModal = false;
  }

  /**
   * Handle action sheet for transaction options
   */
  async showTransactionOptions(transaction: WalletTransaction) {
    // Implementation for action sheet
    console.log('Transaction options for:', transaction);
  }

  /**
   * Simulate wallet operations for development
   */
  simulateOperation(operation: 'recharge' | 'withdrawal' | 'transaction', amount: number) {
    this.walletService.simulateWalletOperation(operation, amount);
    this.notificationService.showSuccess(`Simulated ${operation} of ${amount}`);
  }
}
