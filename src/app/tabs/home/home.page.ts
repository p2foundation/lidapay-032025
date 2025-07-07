import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonButton,
  IonIcon,
  IonRow,
  IonCol,
  IonBadge,
  IonRippleEffect,
  IonCard,
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
} from 'ionicons/icons';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    IonCard,
    IonContent,
    IonHeader,
    IonList,
    IonItem,
    IonButton,
    IonIcon,
    IonRow,
    IonCol,
    IonBadge,
    IonRippleEffect,
    CommonModule,
    FormsModule,
    TranslateModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class HomePage implements OnInit {
  isLoading: boolean = true;
  hasNotifications: boolean = false;
  private loadingTimeout: any;
  constructor(
    private router: Router,
    private translate: TranslateService
  ) {
    addIcons({
      searchOutline,
      cashOutline,
      addCircleOutline,
      notificationsOutline,
      cogOutline,
      globeOutline,
      locationOutline,
      arrowForwardOutline,
      cellularOutline,
      infiniteOutline
    });
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
      // Add other data loading promises here
    ]);
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

  // route airtime
  gotoAirtimePage() {
    this.router.navigate(['tabs/recharge/airtime']);
  }
  gotoRecharegePage() {
    this.router.navigate(['tabs/recharge']);
  }
  // route internet
  gotoInternetPage() {
    this.router.navigate(['tabs/recharge/internet']);
  }
  gotoInternational() {
    this.router.navigate(['tabs/recharge/reloadly']);
  }
  search() {
    this.router.navigate(['./search']);
  }
  pay_or_send() {
    this.router.navigate(['./pay-or-send']);
  }
  addmoney() {
    this.router.navigate(['./addmoney']);
  }
  walletOrUserAccount() {
    this.router.navigate(['/tabs/wallet-management']);
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
  transaction() {
    this.router.navigate(['./transaction']);
  }
  // route remitstar
  gotoRemitstarPage() {
    this.router.navigate(['tabs/recharge/remitstar']);
  }

  openNotification() {
    this.router.navigate(['./notification']);
  }
  item_info() {
    this.router.navigate(['./item-info']);
  }
  categories() {
    this.router.navigate(['./categories']);
  }
  // go to user settings
  goToUserSettings() {
    this.router.navigate(['./settings']);
  }
  newFunction() {
    this.router.navigate(['./new-feature']);
  }
}
