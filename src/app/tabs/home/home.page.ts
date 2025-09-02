import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonButton,
  IonIcon,
  IonBadge,
  IonRippleEffect,
  IonSkeletonText,
  IonToolbar,
  IonRefresher,
  IonRefresherContent,
  ToastController,
  AlertController,
  ModalController,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonList,
  IonThumbnail,
  IonAvatar,
  IonChip,
  IonSpinner,
  IonFab,
  IonFabButton,
  IonSegment,
  IonSegmentButton,
  IonSearchbar,
  IonInfiniteScroll,
  IonInfiniteScrollContent
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  searchOutline,
  cashOutline,
  addCircleOutline,
  notificationsOutline,
  cogOutline,
  globeOutline,
  locationOutline,
  arrowForwardOutline,
  cellularOutline,
  infiniteOutline,
  wifiOutline,
  cardOutline,
  walletOutline,
  receiptOutline,
  settingsOutline,
  swapHorizontalOutline,
  repeatOutline,
  timeOutline,
  checkmarkCircleOutline,
  chevronDownCircleOutline,
  arrowUpCircleOutline,
  arrowDownCircleOutline,
  cashSharp,
  phonePortraitOutline,
  laptopOutline,
  ticketOutline,
  giftOutline,
  schoolOutline,
  storefrontOutline,
  restaurantOutline,
  busOutline,
  carSportOutline,
  medicalOutline,
  homeOutline,
  waterOutline,
  tvOutline,
  wifiSharp,
  cardSharp,
  walletSharp,
  receiptSharp,
  settingsSharp,
  personCircleOutline,
  logOutOutline,
  helpCircleOutline,
  informationCircleOutline,
  documentTextOutline,
  shieldCheckmarkOutline,
  shareSocialOutline,
  refreshOutline,
  ellipsisHorizontalOutline,
  ellipsisVerticalOutline,
  closeOutline,
  checkmarkOutline,
  alertCircleOutline,
  trashOutline,
  pencilOutline,
  addOutline,
  removeOutline,
  closeCircleOutline,
  checkmarkCircle,
  checkmarkDoneOutline,
  chevronDownOutline,
  chevronForwardOutline,
  chevronBackOutline,
  chevronUpOutline,
  menuOutline,
  filterOutline,
  optionsOutline,
  appsOutline,
  gridOutline,
  listOutline,
  reorderThreeOutline,
  reorderTwoOutline,
  reorderFourOutline,
  star,
  starHalf,
  starOutline,
  starSharp,
  starHalfSharp,
  starHalfOutline
} from 'ionicons/icons';
import { StorageService } from '../../services/storage.service';
import { HistoryService } from '../../services/transactions/history.service';
import { PendingTransactionsService } from '../../services/transactions/pending-transactions.service';
import { StateService } from '../../services/state.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonButton,
    IonIcon,
    IonBadge,
    IonRippleEffect,
    IonSkeletonText,
    IonRefresher,
    IonRefresherContent
  ]
})
export class HomePage implements OnInit, OnDestroy {
  isLoading = true;
  hasNotifications = false;
  pendingTransactionCount = 0;
  totalTransactions = 0;
  showStats = true;
  showPromo = true;
  pendingTransactions: number = 0;
  
  private loadingTimeout: any;
  
  // Import NotificationType from @capacitor/haptics
  private readonly NotificationType = {
    SUCCESS: 'success' as const,
    ERROR: 'error' as const,
    WARNING: 'warning' as const,
    INFO: 'info' as const
  } as const;

  constructor(
    private router: Router,
    private translate: TranslateService,
    private historyService: HistoryService,
    private pendingTxService: PendingTransactionsService,
    private storage: StorageService,
    private stateService: StateService,
    private toastCtrl: ToastController,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController
  ) {
    // Register all icons
    addIcons({
      searchOutline,
      notificationsOutline,
      swapHorizontalOutline,
      repeatOutline,
      cellularOutline,
      timeOutline,
      checkmarkCircleOutline,
      wifiOutline,
      arrowForwardOutline,
      cashOutline,
      addCircleOutline,
      cogOutline,
      globeOutline,
      locationOutline,
      infiniteOutline,
      cardOutline,
      walletOutline,
      receiptOutline,
      settingsOutline,
      chevronDownCircleOutline,
      arrowUpCircleOutline,
      arrowDownCircleOutline,
      cashSharp,
      phonePortraitOutline,
      laptopOutline,
      ticketOutline,
      giftOutline,
      schoolOutline,
      storefrontOutline,
      restaurantOutline,
      busOutline,
      carSportOutline,
      medicalOutline,
      homeOutline,
      waterOutline,
      tvOutline,
      wifiSharp,
      cardSharp,
      walletSharp,
      receiptSharp,
      settingsSharp,
      personCircleOutline,
      logOutOutline,
      helpCircleOutline,
      informationCircleOutline,
      documentTextOutline,
      shieldCheckmarkOutline,
      shareSocialOutline,
      refreshOutline,
      ellipsisHorizontalOutline,
      ellipsisVerticalOutline,
      closeOutline,
      checkmarkOutline,
      alertCircleOutline,
      trashOutline,
      pencilOutline,
      addOutline,
      removeOutline,
      closeCircleOutline,
      checkmarkCircle,
      checkmarkDoneOutline,
      chevronDownOutline,
      chevronForwardOutline,
      chevronBackOutline,
      chevronUpOutline,
      menuOutline,
      filterOutline,
      optionsOutline,
      appsOutline,
      gridOutline,
      listOutline,
      reorderThreeOutline,
      reorderTwoOutline,
      reorderFourOutline,
      starHalfOutline,
      starSharp,
      starHalfSharp,
      starOutline,
      star,
      starHalf
    });
    
    this.translate.setDefaultLang('en');
    this.translate.use('en');
  }

  ngOnInit() {
    this.loadData();
    // Don't load transaction stats here - wait for user data to be available
  }
  
  ionViewWillEnter() {
    // Check if user data is available before proceeding
    this.checkUserDataAndLoadTransactions();
    
    // Set up interval to check for count updates every 5 seconds
    this.setupPendingTransactionsCountPolling();
  }

  ionViewWillLeave() {
    // Clear the polling interval when leaving the page
    this.clearPendingTransactionsCountPolling();
  }

  private countPollingInterval: any;

  /**
   * Set up polling to check for pending transactions count updates
   */
  private setupPendingTransactionsCountPolling() {
    // Clear any existing interval
    this.clearPendingTransactionsCountPolling();
    
    // Poll every 5 seconds for count updates
    this.countPollingInterval = setInterval(async () => {
      await this.refreshPendingTransactionsCount();
    }, 5000);
  }

  /**
   * Clear the pending transactions count polling
   */
  private clearPendingTransactionsCountPolling() {
    if (this.countPollingInterval) {
      clearInterval(this.countPollingInterval);
      this.countPollingInterval = null;
    }
  }

  async loadData() {
    // Clear any existing timeout
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
    }

    this.isLoading = true;
    try {
      // Wait a bit for storage to be ready after login
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Debug: Check all storage keys
      const allKeys = await this.storage.getAllKeys();
      console.log('Available storage keys:', allKeys);
      
      // Load user data
      const user = await this.storage.getStorage('profile');
      console.log('Profile from storage:', user);
      
      if (user && user._id) {
        console.log('User data loaded successfully:', user);
        // Load and check pending transactions
        await this.checkPendingTransactions();
      } else {
        console.log('No user data found in storage yet');
        // Try to get from state service
        const currentState = this.stateService.getCurrentState();
        console.log('Current state from state service:', currentState);
        
        if (currentState?.profile?._id) {
          console.log('User found in state service, using that instead');
          await this.checkPendingTransactions();
        }
      }
      
      // Show skeleton for minimum time to avoid flashing
      const minimumLoadingTime = 800;
      const loadingStartTime = Date.now();
      
      // Simulate loading time
      const timeElapsed = Date.now() - loadingStartTime;
      const timeRemaining = Math.max(0, minimumLoadingTime - timeElapsed);
      
      await new Promise(resolve => setTimeout(resolve, timeRemaining));
      
      this.isLoading = false;
    } catch (error) {
      console.error('Error loading data:', error);
      this.isLoading = false;
    }
  }
  
  async checkUserDataAndLoadTransactions() {
    try {
      const user = await this.storage.getStorage('profile');
      if (user?._id) {
        console.log('User data available, loading transactions...');
        // Load transaction stats which will update the counts
        await this.loadTransactionStats();
        
        // Check pending transactions
        await this.checkPendingTransactions();
        
        // Refresh pending transactions count from storage
        await this.refreshPendingTransactionsCount();
      } else {
        console.log('User data not available yet, skipping transaction loading');
      }
    } catch (error) {
      console.error('Error checking user data and loading transactions:', error);
    }
  }

  async checkPendingTransactions() {
    try {
      const user = await this.storage.getStorage('profile');
      if (user?._id) {
        // No need to show alert - information is already displayed in transaction summary
        // Just log for debugging purposes
        console.log(`User has ${this.pendingTransactionCount} pending transactions`);
      }
    } catch (error) {
      console.error('Error checking pending transactions:', error);
    }
  }

  private async loadActualData() {
    console.log('Loading actual data...');
    // Only load transaction stats if user is available
    try {
      const user = await this.storage.getStorage('profile');
      if (user?._id) {
        await Promise.all([
          this.checkNotifications(),
          this.loadTransactionStats(),
          this.loadUserPreferences(),
        ]);
      } else {
        // Load only non-user-dependent data
        await Promise.all([
          this.checkNotifications(),
          this.loadUserPreferences(),
        ]);
      }
      console.log('All data loaded successfully');
    } catch (error) {
      console.error('Error loading actual data:', error);
    }
  }

  private async loadTransactionStats() {
    try {
      // Get user ID from storage
      const user = await this.storage.getStorage('profile');
      console.log('Loading transaction stats for user:', user);
      if (!user || !user._id) {
        console.error('User not found in storage');
        // Try to get from state service as fallback
        const currentState = this.stateService.getCurrentState();
        if (currentState?.profile?._id) {
          console.log('User found in state service, using that instead');
          await this.loadTransactionStatsWithUser(currentState.profile);
          return;
        }
        return;
      }
      
      await this.loadTransactionStatsWithUser(user);
    } catch (error) {
      console.error('Error in loadTransactionStats:', error);
    }
  }

  private async loadTransactionStatsWithUser(user: any) {
    try {
      // Try to get transaction counts first (more efficient)
      try {
        const countsResponse: any = await firstValueFrom(
          this.historyService.getTransactionCountsByUserId(user._id)
        );

        if (countsResponse && countsResponse.success) {
          // Use the counts from the dedicated endpoint
          this.pendingTransactions = countsResponse.pending || 0;
          this.totalTransactions = countsResponse.completed || 0;
          this.pendingTransactionCount = this.pendingTransactions;
          
          console.log('Transaction counts loaded from counts endpoint:', countsResponse);
          console.log('Pending/Failed transactions:', this.pendingTransactions);
          console.log('Completed transactions:', this.totalTransactions);
          return;
        }
      } catch (countsError) {
        console.log('Counts endpoint not available, falling back to full transaction list');
      }

      // Fallback: fetch transactions from API and count them
      const response: any = await firstValueFrom(
        this.historyService.getTransactionByUserId(user._id, 1, 1000) // Fetch more transactions for accurate counting
      );

      let pendingCount = 0;
      let completedCount = 0;
      let totalCount = 0;

      // Count transactions by status from API
      if (response && response.transactions) {
        totalCount = response.transactions.length;
        
        response.transactions.forEach((txn: any) => {
          if (txn.status && txn.status.transaction) {
            if (txn.status.transaction === 'pending' || txn.status.transaction === 'failed') {
              pendingCount++;
            } else if (txn.status.transaction === 'completed') {
              completedCount++;
            }
          }
        });
        
        console.log('API transactions loaded:', response.transactions.length);
        console.log('Pending/Failed transactions:', pendingCount);
        console.log('Completed transactions:', completedCount);
        console.log('Total transactions:', totalCount);
      }

      // Update the UI
      this.pendingTransactions = pendingCount;
      this.totalTransactions = completedCount;
      this.pendingTransactionCount = pendingCount;
      
      console.log('Updated pendingTransactions to:', this.pendingTransactions);
      console.log('Updated completedTransactions to:', this.totalTransactions);

    } catch (error) {
      console.error('Error loading transaction stats with user:', error);
      
      // Set default values on error
      this.pendingTransactions = 0;
      this.totalTransactions = 0;
      this.pendingTransactionCount = 0;
      
      // Show error toast
      const toast = await this.toastCtrl.create({
        message: 'Failed to load transaction statistics',
        duration: 3000,
        color: 'danger',
        position: 'bottom'
      });
      await toast.present();
    }
  }



  private async loadUserPreferences() {
    // TODO: Load user preferences from storage/service
    // This could control which sections to show/hide
    this.showStats = true;
    this.showPromo = true;
  }

  /**
   * Refresh pending transactions count from storage
   */
  private async refreshPendingTransactionsCount() {
    try {
      const storedCount = await this.storage.getStorage('pendingTransactionsCount');
      if (storedCount) {
        this.pendingTransactions = parseInt(storedCount, 10) || 0;
        this.pendingTransactionCount = this.pendingTransactions;
        console.log('Updated pending transactions count from storage:', this.pendingTransactions);
      }
    } catch (error) {
      console.error('Error refreshing pending transactions count:', error);
    }
  }

  private async checkNotifications() {
    // Your notification checking logic
    this.hasNotifications = true;
  }

  async doRefresh(event: any) {
    try {
      // Add haptic feedback
      await Haptics.impact({ style: ImpactStyle.Light });
      await this.loadData();
      // Transaction stats will be loaded by loadData if user is available
    } finally {
      event.target.complete();
      // Add completion haptic feedback
      await Haptics.notification({ type: NotificationType.Success });
    }
  }

  // Method to manually refresh transaction stats
  async refreshTransactionStats() {
    console.log('Manually refreshing transaction stats...');
    try {
      const user = await this.storage.getStorage('profile');
      if (user?._id) {
        await this.loadTransactionStats();
      } else {
        console.log('User not available, cannot refresh transaction stats');
      }
    } catch (error) {
      console.error('Error refreshing transaction stats:', error);
    }
  }

  // Method to refresh transaction counts specifically
  async refreshTransactionCounts() {
    console.log('Refreshing transaction counts...');
    try {
      const user = await this.storage.getStorage('profile');
      if (!user?._id) {
        console.log('User not available, cannot refresh transaction counts');
        return;
      }
      
      // Add haptic feedback
      await Haptics.impact({ style: ImpactStyle.Light });
      
      await this.loadTransactionStats();
      // Also refresh from storage for real-time updates
      await this.refreshPendingTransactionsCount();
      
      // Show success feedback
      const toast = await this.toastCtrl.create({
        message: 'Transaction counts updated',
        duration: 2000,
        color: 'success',
        position: 'bottom'
      });
      await toast.present();
    } catch (error) {
      console.error('Error refreshing transaction counts:', error);
    }
  }

  // Method to test storage and show current values
  async debugStorage() {
    console.log('=== DEBUG STORAGE ===');
    console.log('Current pendingTransactions:', this.pendingTransactions);
    console.log('Current totalTransactions:', this.totalTransactions);
    
    try {
      const allKeys = await this.storage.getAllKeys();
      console.log('All storage keys:', allKeys);
      
      const pendingKeys = allKeys.filter(key => 
        key === 'pendingTransaction' || key.startsWith('pendingTransaction_')
      );
      console.log('Pending transaction keys:', pendingKeys);
      
      for (const key of pendingKeys) {
        const value = await this.storage.getStorage(key);
        console.log(`Key: ${key}, Value:`, value);
      }
    } catch (error) {
      console.error('Error debugging storage:', error);
    }
  }

  // Navigation methods with haptic feedback
  async gotoAirtimePage() {
    await Haptics.impact({ style: ImpactStyle.Medium });
    this.router.navigate(['/tabs/buy-airtime/enhanced-purchase']);
  }

  async gotoInternetPage() {
    await Haptics.impact({ style: ImpactStyle.Medium });
    this.router.navigate(['/tabs/enhanced-buy-internet-data']);
  }

  async gotoRemitstarPage() {
    await Haptics.impact({ style: ImpactStyle.Medium });
    this.router.navigate(['/tabs/recharge/remitstar']);
  }

  async pay_or_send() {
    await Haptics.impact({ style: ImpactStyle.Medium });
    this.router.navigate(['/tabs/pay-or-send']);
  }

  async walletOrUserAccount() {
    await Haptics.impact({ style: ImpactStyle.Medium });
    this.router.navigate(['/tabs/wallet-management']);
  }

  async transaction() {
    await Haptics.impact({ style: ImpactStyle.Medium });
    this.router.navigate(['/tabs/transaction']);
  }

  async search() {
    await Haptics.impact({ style: ImpactStyle.Light });
    this.router.navigate(['/tabs/search']);
  }

  async openNotification() {
    await Haptics.impact({ style: ImpactStyle.Medium });
    this.router.navigate(['/tabs/notifications']);
  }

  // New functionality methods
  async viewAllServices() {
    await Haptics.impact({ style: ImpactStyle.Light });
    this.router.navigate(['/tabs/services']);
  }

  async airtimeConversion() {
    await Haptics.impact({ style: ImpactStyle.Medium });
    this.router.navigate(['/tabs/airtime-conversion']);
  }

  async viewPendingTransactions() {
    await Haptics.impact({ style: ImpactStyle.Medium });
    this.router.navigate(['/tabs/pending-transactions']);
  }

  async viewCompletedTransactions() {
    await Haptics.impact({ style: ImpactStyle.Medium });
    this.router.navigate(['./transactions', { status: 'completed' }]);
  }

  async showPendingTransactions() {
    if (this.pendingTransactionCount > 0) {
      await Haptics.impact({ style: ImpactStyle.Medium });
      this.router.navigate(['/tabs/pending-transactions']);
    }
  }

  ngOnDestroy() {
    // Clear the polling interval to prevent memory leaks
    this.clearPendingTransactionsCountPolling();
  }
}
