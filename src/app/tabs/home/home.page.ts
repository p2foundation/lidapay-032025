import { Component, OnInit } from '@angular/core';
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
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonBadge,
    IonRippleEffect,
    IonSkeletonText,
    IonRefresher,
    IonRefresherContent,
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
  ]
})
export class HomePage implements OnInit {
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
  }
  
  ionViewWillEnter() {
    this.checkPendingTransactions();
  }

  async loadData() {
    // Clear any existing timeout
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
    }

    this.isLoading = true;
    try {
      // Load user data
      const user = await this.storage.getStorage('user');
      if (user && user._id) {
        // Load and check pending transactions
        await this.checkPendingTransactions();
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
  
  async checkPendingTransactions() {
    try {
      const user = await this.storage.getStorage('user');
      if (user?._id) {
        const pendingTxs = await this.pendingTxService.loadPendingTransactions(user._id);
        this.pendingTransactionCount = pendingTxs.length;
        
        // Show notification if there are pending transactions
        if (this.pendingTransactionCount > 0) {
          await this.showPendingTransactionsNotification();
        }
      }
    } catch (error) {
      console.error('Error checking pending transactions:', error);
    }
  }
  
  async showPendingTransactionsNotification() {
    const alert = await this.alertCtrl.create({
      header: 'Pending Transactions',
      message: `You have ${this.pendingTransactionCount} pending transaction${this.pendingTransactionCount !== 1 ? 's' : ''}.`,
      buttons: [
        {
          text: 'View Details',
          handler: () => {
            this.router.navigate(['/tabs/pending-transactions']);
          }
        },
        {
          text: 'Dismiss',
          role: 'cancel'
        }
      ]
    });
    
    await alert.present();
  }

  private async loadActualData() {
    console.log('Loading actual data...');
    // Simulate API calls
    await Promise.all([
      this.checkNotifications(),
      this.loadTransactionStats(),
      this.loadUserPreferences(),
    ]);
    console.log('All data loaded successfully');
  }

  private async loadTransactionStats() {
    try {
      // Get user ID from storage
      const user = await this.storage.getStorage('user');
      if (!user || !user._id) {
        console.error('User not found in storage');
        return;
      }

      // First, check local storage for pending transactions
      const allKeys = await (await this.storage.getAllKeys()) || [];
      console.log('All storage keys:', allKeys);
      
      // Look for both patterns: 'pendingTransaction' and 'pendingTransaction_*'
      const pendingLocalTransactions = allKeys.filter(key => 
        key === 'pendingTransaction' || key.startsWith('pendingTransaction_')
      );
      
      console.log('Found pending transaction keys:', pendingLocalTransactions);

      // Then fetch from API using firstValueFrom instead of deprecated toPromise()
      const response: any = await firstValueFrom(
        this.historyService.getTransactionByUserId(user._id, 1, 100) // Fetch first 100 transactions
      );

      let pendingCount = 0;
      let totalCount = 0;

      // Count pending transactions from API
      if (response && response.data) {
        const pendingApiTransactions = response.data.filter((txn: any) => 
          txn.status && txn.status.transaction === 'pending'
        );
        pendingCount = pendingApiTransactions.length;
        totalCount = response.pagination?.total || response.data.length;
        
        console.log('API transactions loaded:', response.data.length);
        console.log('Pending API transactions:', pendingCount);
        console.log('Total API transactions:', totalCount);
      }

      // Add local pending transactions
      pendingCount += pendingLocalTransactions.length;
      console.log('Local pending transactions:', pendingLocalTransactions.length);
      console.log('Total pending count:', pendingCount);

      // Update the UI
      this.pendingTransactions = pendingCount;
      // Calculate completed transactions by subtracting pending from total
      const completedTransactions = Math.max(0, totalCount - pendingCount);
      this.totalTransactions = completedTransactions;
      
      console.log('Updated pendingTransactions to:', this.pendingTransactions);
      console.log('Updated completedTransactions to:', this.totalTransactions);

      // Update the pending transaction count for the notification system
      this.pendingTransactionCount = pendingCount;

    } catch (error) {
      console.error('Error loading transaction stats:', error);
      
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

  private async checkNotifications() {
    // Your notification checking logic
    this.hasNotifications = true;
  }

  async doRefresh(event: any) {
    try {
      // Add haptic feedback
      await Haptics.impact({ style: ImpactStyle.Light });
      await this.loadData();
    } finally {
      event.target.complete();
      // Add completion haptic feedback
      await Haptics.notification({ type: NotificationType.Success });
    }
  }

  // Method to manually refresh transaction stats
  async refreshTransactionStats() {
    console.log('Manually refreshing transaction stats...');
    await this.loadTransactionStats();
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
    this.router.navigate(['tabs/recharge/remitstar']);
  }

  async pay_or_send() {
    await Haptics.impact({ style: ImpactStyle.Medium });
    this.router.navigate(['./pay-or-send']);
  }

  async walletOrUserAccount() {
    await Haptics.impact({ style: ImpactStyle.Medium });
    this.router.navigate(['/tabs/wallet-management']);
  }

  async transaction() {
    await Haptics.impact({ style: ImpactStyle.Medium });
    this.router.navigate(['./transaction']);
  }

  async search() {
    await Haptics.impact({ style: ImpactStyle.Light });
    this.router.navigate(['./search']);
  }

  async openNotification() {
    await Haptics.impact({ style: ImpactStyle.Light });
    this.router.navigate(['./notification']);
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
}
