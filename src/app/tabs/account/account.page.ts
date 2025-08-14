import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonBackButton,
  IonCard,
  IonList,
  IonItem,
  IonButton,
  IonIcon,
  IonBadge,
  IonToggle,
  IonButtons,
  IonLabel,
  IonAvatar,
  IonCardContent,
  LoadingController,
  ToastController,
  AlertController,
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { Subject, firstValueFrom, catchError } from 'rxjs';
import { AccountService } from 'src/app/services/auth/account.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { NotificationService } from 'src/app/services/notification.service';
import { StateService } from 'src/app/services/state.service';
import { StorageService } from 'src/app/services/storage.service';
import { ThemeService } from 'src/app/services/theme.service';
import { HistoryService } from 'src/app/services/transactions/history.service';
import { RewardsService } from 'src/app/services/user/rewards.service';
import { environment } from 'src/environments/environment.prod';
import { Profile } from 'src/app/interfaces/profile.interface';
import { ApiResponse } from 'src/app/interfaces/api-response.interface';
import { Share } from '@capacitor/share';
import { addIcons } from 'ionicons';
import {
  checkmarkCircle,
  shieldCheckmarkOutline,
  createOutline,
  diamondOutline,
  trendingUpOutline,
  receiptOutline,
  walletOutline,
  removeOutline,
  flashOutline,
  qrCodeOutline,
  sendOutline,
  cellularOutline,
  cardOutline,
  moonOutline,
  personCircleOutline,
  personOutline,
  chevronForward,
  giftOutline,
  settingsOutline,
  notificationsOutline,
  languageOutline,
  lockClosedOutline,
  informationCircleOutline,
  helpCircleOutline,
  shareSocialOutline,
  mailOutline,
  documentTextOutline,
  logOutOutline,
  heartOutline,
  ellipsisHorizontalOutline,
  arrowBackOutline
} from 'ionicons/icons';

interface AppConfig {
  version: string;
}

interface ProfileResponse {
  data: {
    _id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    isOnline?: boolean;
  };
}

// Extended Profile interface
interface ExtendedProfile extends Profile {
  isOnline?: boolean;
  gravatar?: string;
}

@Component({
  selector: 'app-account',
  templateUrl: './account.page.html',
  styleUrls: ['./account.page.scss'],
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
    IonBackButton,
    IonCard,
    IonCardContent,
    IonList,
    IonItem,
    IonButton,
    IonIcon,
    IonBadge,
    IonToggle,
    IonButtons,
    IonLabel,
    IonAvatar,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AccountPage implements OnInit, OnDestroy {
  // Class properties
  profile: ExtendedProfile = {} as ExtendedProfile;
  rewardPoints = 0;
  totalTransactions = 0;
  isLoading = true;
  isDarkMode = false;
  
  // Configuration
  config: AppConfig = {
    version: environment.version || '0.0.8'
  };
  
  // Default avatar
  defaultAvatarUrl = 'https://www.gravatar.com/avatar/default?d=mp&s=200';
  
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private accountService: AccountService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private stateService: StateService,
    private storageService: StorageService,
    private themeService: ThemeService,
    private historyService: HistoryService,
    private rewardsService: RewardsService,
    private translate: TranslateService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController,
  ) {
    addIcons({
      checkmarkCircle,
      shieldCheckmarkOutline,
      createOutline,
      diamondOutline,
      trendingUpOutline,
      receiptOutline,
      walletOutline,
      removeOutline,
      flashOutline,
      qrCodeOutline,
      sendOutline,
      cellularOutline,
      cardOutline,
      moonOutline,
      personCircleOutline,
      personOutline,
      chevronForward,
      giftOutline,
      settingsOutline,
      notificationsOutline,
      languageOutline,
      lockClosedOutline,
      informationCircleOutline,
      helpCircleOutline,
      shareSocialOutline,
      mailOutline,
      documentTextOutline,
      logOutOutline,
      heartOutline,
      ellipsisHorizontalOutline,
      arrowBackOutline
    });
  }

  ngOnInit() {
    this.initializeProfile();
    this.themeService.isDarkMode$.subscribe(
      (isDark) => (this.isDarkMode = isDark)
    );
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async initializeProfile() {
    try {
      console.log('[AccountPage] Initializing profile');
      const isLoggedIn = await this.authService.checkLoggedIn();
      if (!isLoggedIn) {
        console.warn('[AccountPage] Not logged in');
        await this.handleUnauthorized();
        return;
      }
      // Get current state to verify token
      const state = this.stateService.getCurrentState();
      console.log('[AccountPage] Current state:', {
        hasToken: !!state?.token,
        hasProfile: !!state?.profile,
      });

      if (!state?.token) {
        console.error('[AccountPage] No token available');
        await this.handleUnauthorized();
        return;
      }

      await Promise.all([this.loadProfile()]);
    } catch (error) {
      console.error('[AccountPage] Initialize error:', error);
      this.notificationService.showError('Failed to initialize profile');
    }
  }

  async loadProfile() {
    try {
      const response = await firstValueFrom(
        this.accountService.getProfile().pipe(
          catchError((error: Error) => {
            if (
              error instanceof Error &&
              'status' in error &&
              error['status'] === 401
            ) {
              this.handleUnauthorized();
            }
            throw error;
          })
        )
      );

      if (response) {
        this.profile = response;
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      this.notificationService.showError('Failed to load profile');
    }
  }

  private async handleUnauthorized() {
    await this.authService.logout();
    await this.router.navigate(['/login'], { replaceUrl: true });
  }

  // Essential methods for enhanced functionality
  editProfile() {
    this.router.navigate(['/tabs/account/my-profile']);
  }

  getWalletBalance(): number {
    // Mock wallet balance - replace with actual service call
    return 1250.75;
  }

  scanQR() {
    this.notificationService.showSuccess('QR Scanner coming soon!');
  }

  sendMoney() {
    this.router.navigate(['/tabs/pay-or-send']);
  }

  buyAirtime() {
    this.router.navigate(['/tabs/services']);
  }

  payBills() {
    this.notificationService.showSuccess('Bill payments coming soon!');
  }

  walletManagement() {
    this.router.navigate(['/tabs/account/wallet-management']);
  }

  securitySettings() {
    this.router.navigate(['/tabs/account/user-settings']);
  }

  privacyPolicy() {
    this.notificationService.showSuccess('Privacy Policy coming soon!');
  }

  // Enhanced theme toggle with better UX
  async toggleTheme() {
    try {
      // For now, just toggle the local state
      this.isDarkMode = !this.isDarkMode;
      
      // Show success message with theme name
      const themeName = this.isDarkMode ? 'Dark Mode' : 'Light Mode';
      this.notificationService.showSuccess(`${themeName} activated!`);
      
    } catch (error) {
      console.error('Error toggling theme:', error);
      this.notificationService.showError('Failed to change theme');
    }
  }

  // Navigation methods
  goToSettings() {
    this.router.navigate(['./settings']);
  }

  myProfile() {
    this.router.navigate(['./my-profile']);
  }

  goToTransactionPage() {
    this.router.navigate(['./transaction-details']);
  }

  gotoAdvansRewards() {
    this.router.navigate(['./reward']);
  }

  notification() {
    this.router.navigate(['./notifications']);
  }

  change_language() {
    this.router.navigate(['./user-settings']);
  }

  help() {
    this.router.navigate(['./support']);
  }

  inviteFriends() {
    this.notificationService.showSuccess('Invite friends feature coming soon!');
  }

  contactUs() {
    this.router.navigate(['./support/contact-us']);
  }

  condition() {
    this.router.navigate(['./privacy/condition']);
  }

  developed_by() {
    this.notificationService.showSuccess('Developed by Advansis Technologies');
  }
  favorited() {
    this.router.navigate(['./transactions']);
  }
  // Remove old invitation link methods - they're not needed for the new UI
  
  // Enhanced logout with confirmation
  async logout() {
    try {
      const alert = await this.alertController.create({
        header: 'Confirm Logout',
        message: 'Are you sure you want to sign out?',
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            cssClass: 'secondary'
          },
          {
            text: 'Logout',
            role: 'destructive',
            handler: () => {
              this.performLogout();
            }
          }
        ]
      });

      await alert.present();
    } catch (error) {
      console.error('Error showing logout confirmation:', error);
      this.performLogout();
    }
  }

  private async performLogout() {
    try {
      this.isLoading = true;
      
      // Show loading message
      const loading = await this.loadingController.create({
        message: 'Signing out...',
        spinner: 'crescent'
      });
      await loading.present();

      // Clear local storage
      await this.storageService.clearStorage();
      
      // Clear state
      this.stateService.clearState();
      
      // Navigate to login
      this.router.navigate(['/login'], { replaceUrl: true });
      
      await loading.dismiss();
      
      // Show success message
      this.notificationService.showSuccess('Successfully signed out');
      
    } catch (error) {
      console.error('Logout error:', error);
      this.notificationService.showError('Error during logout');
    } finally {
      this.isLoading = false;
    }
  }

  // Enhanced profile loading with better error handling
  private async loadUserProfile() {
    try {
      this.isLoading = true;
      
      const response = await firstValueFrom(this.accountService.getProfile());
      
      if (response) {
        this.profile = {
          _id: response._id || 'default',
          username: response.username || 'user',
          email: response.email || 'user@example.com',
          firstName: response.firstName || 'User',
          lastName: response.lastName || 'Name',
          phoneNumber: response.phoneNumber || '',
          roles: response.roles || [],
          points: response.points || 0,
          status: response.status || 'Active',
          emailVerified: response.emailVerified || false,
          phoneVerified: response.phoneVerified || false,
          qrCodeUsageCount: response.qrCodeUsageCount || 0,
          invitationLink: response.invitationLink || '',
          invitationLinkUsageCount: response.invitationLinkUsageCount || 0,
          totalPointsEarned: response.totalPointsEarned || 0,
          createdAt: response.createdAt || '',
          updatedAt: response.updatedAt || '',
          account: response.account || '',
          wallet: response.wallet || '',
          qrCode: response.qrCode || '',
          isVerified: response.isVerified || false,
          isOnline: false,
          gravatar: this.generateGravatarUrl(response.email || '')
        };
        
        // Load additional profile data
        await this.loadProfileStats();
        
        } else {
        throw new Error('Invalid profile response');
      }
      
    } catch (error) {
      console.error('Error loading profile:', error);
      this.notificationService.showError('Failed to load profile');
      
      // Set default profile
      this.profile = {
        _id: 'default',
        username: 'user',
        email: 'user@example.com',
        firstName: 'User',
        lastName: 'Name',
        phoneNumber: '',
        roles: [],
        points: 0,
        status: 'Active',
        emailVerified: false,
        phoneVerified: false,
        qrCodeUsageCount: 0,
        invitationLink: '',
        invitationLinkUsageCount: 0,
        totalPointsEarned: 0,
        createdAt: '',
        updatedAt: '',
        account: '',
        wallet: '',
        qrCode: '',
        isVerified: false,
        isOnline: false,
        gravatar: this.defaultAvatarUrl
      };
    } finally {
      this.isLoading = false;
    }
  }

  // Load profile statistics
  private async loadProfileStats() {
    try {
      // Load reward points - using mock data for now
      this.rewardPoints = 1250;
      
      // Load transaction count - using mock data for now
      this.totalTransactions = 47;
      
    } catch (error) {
      console.error('Error loading profile stats:', error);
      // Use default values
      this.rewardPoints = 0;
      this.totalTransactions = 0;
    }
  }

  // Generate Gravatar URL
  private generateGravatarUrl(email: string): string {
    if (!email) return this.defaultAvatarUrl;
    
    const hash = this.md5(email.toLowerCase().trim());
    return `https://www.gravatar.com/avatar/${hash}?d=mp&s=200`;
  }

  // Simple MD5 hash function for Gravatar
  private md5(str: string): string {
    // This is a simplified MD5 implementation
    // In production, use a proper MD5 library
    let hash = 0;
    if (str.length === 0) return hash.toString();
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(16);
  }
}

