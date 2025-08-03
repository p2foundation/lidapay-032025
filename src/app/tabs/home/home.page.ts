import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
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
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
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
  settingsOutline, swapHorizontalOutline, repeatOutline, timeOutline, chevronForwardOutline, checkmarkCircleOutline, 
  chevronDownCircleOutline} from 'ionicons/icons';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
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
    CommonModule,
    FormsModule,
    TranslateModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class HomePage implements OnInit {
  isLoading: boolean = true;
  hasNotifications: boolean = false;
  pendingTransactions: number = 2;
  totalTransactions: number = 15;
  showStats: boolean = true;
  showPromo: boolean = true;
  private loadingTimeout: any;

  constructor(
    private router: Router,
    private translate: TranslateService
  ) {
    addIcons({searchOutline,notificationsOutline,swapHorizontalOutline,repeatOutline,cellularOutline,timeOutline,chevronForwardOutline,checkmarkCircleOutline,wifiOutline,arrowForwardOutline,cashOutline,addCircleOutline,cogOutline,globeOutline,locationOutline,infiniteOutline,cardOutline,walletOutline,receiptOutline,settingsOutline,chevronDownCircleOutline});
    this.translate.setDefaultLang('en');
    this.translate.use('en');
  }

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    // Clear any existing timeout
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
    }

    this.isLoading = true;
    try {
      // Show skeleton for minimum time to avoid flashing
      const minimumLoadingTime = 800;
      const loadingStartTime = Date.now();

      // Load your actual data here
      await this.loadActualData();

      // Calculate remaining time to meet minimum loading duration
      const elapsedTime = Date.now() - loadingStartTime;
      const remainingTime = Math.max(0, minimumLoadingTime - elapsedTime);

      // Use timeout to ensure smooth transition
      this.loadingTimeout = setTimeout(() => {
        this.isLoading = false;
      }, remainingTime);
    } catch (error) {
      console.error('Error loading data:', error);
      this.isLoading = false;
    }
  }

  private async loadActualData() {
    // Simulate API calls
    await Promise.all([
      this.checkNotifications(),
      this.loadTransactionStats(),
      this.loadUserPreferences(),
    ]);
  }

  private async loadTransactionStats() {
    // TODO: Replace with real API call to your transaction service
    // Example:
    // try {
    //   const stats = await this.transactionService.getStats().toPromise();
    //   this.pendingTransactions = stats.pending;
    //   this.totalTransactions = stats.total;
    // } catch (error) {
    //   console.error('Error loading transaction stats:', error);
    // }
    
    // For now, using mock data
    this.pendingTransactions = 2;
    this.totalTransactions = 15;
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

  // Navigation methods with haptic feedback
  async gotoAirtimePage() {
    await Haptics.impact({ style: ImpactStyle.Medium });
    this.router.navigate(['/tabs/buy-airtime/enhanced-purchase']);
  }

  async gotoInternetPage() {
    await Haptics.impact({ style: ImpactStyle.Medium });
    this.router.navigate(['tabs/recharge/internet']);
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
    this.router.navigate(['./airtime-conversion']);
  }

  async viewPendingTransactions() {
    await Haptics.impact({ style: ImpactStyle.Medium });
    this.router.navigate(['./transactions', { status: 'pending' }]);
  }

  async viewCompletedTransactions() {
    await Haptics.impact({ style: ImpactStyle.Medium });
    this.router.navigate(['./transactions', { status: 'completed' }]);
  }

  // Legacy methods (keeping for compatibility)
  gotoRecharegePage() {
    this.router.navigate(['tabs/recharge']);
  }

  gotoInternational() {
    this.router.navigate(['tabs/recharge/reloadly']);
  }

  addmoney() {
    this.router.navigate(['./addmoney']);
  }

  getpayment() {
    this.router.navigate(['./getpayment']);
  }

  phonerecharge() {
    this.router.navigate(['./phonerecharge']);
  }

  book_ticket() {
    this.router.navigate(['./book-ticket']);
  }

  item_info() {
    this.router.navigate(['./item-info']);
  }

  categories() {
    this.router.navigate(['./categories']);
  }

  goToUserSettings() {
    this.router.navigate(['./settings']);
  }

  newFunction() {
    this.router.navigate(['./new-feature']);
  }
}
