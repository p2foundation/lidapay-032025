import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
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
  IonRow,
  IonCol,
  IonBadge,
  IonRippleEffect,
  IonToggle,
  IonButtons,
  IonLabel,
  IonAvatar,
  IonText,
  IonGrid,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonCardSubtitle,
  IonSpinner,
  LoadingController,
  ToastController,
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
  arrowBack,
  arrowBackOutline,
  giftOutline,
  helpCircleOutline,
  languageOutline,
  logInOutline,
  logOutOutline,
  notificationsOutline,
  receiptOutline,
  settingsOutline,
  shareSocialOutline,
  sunny,
  diamondOutline,
  personOutline,
  mailOutline,
  documentTextOutline,
  moon,
  personCircleOutline,
  shieldCheckmarkOutline,
  lockClosedOutline,
  informationCircleOutline
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
@Component({
  selector: 'app-account',
  templateUrl: './account.page.html',
  styleUrls: ['./account.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonBackButton,
    IonList,
    IonItem,
    IonButton,
    IonIcon,
    IonToggle,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    IonButtons,
    IonLabel,
    IonAvatar,
    IonText,
    IonGrid,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonCardSubtitle,
    IonSpinner,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AccountPage implements OnInit {
  private destroy$ = new Subject<void>();

  profile: Profile = {
    _id: '',
    username: '',
    firstName: '',
    lastName: '',
    email: '',
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
  };
  invitationLink: string = '';
  config: AppConfig = {
    version: environment.version || '1.0.0',
  };
  isLoading: boolean = false;
  totalTransactions: number = 0;
  rewardPoints: number = 0;
  readonly defaultAvatarUrl = 'assets/imgs/avatar-placeholder.png';
  isDarkMode: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private accountService: AccountService,
    private notificationService: NotificationService,
    private stateService: StateService,
    private storageService: StorageService,
    private historyService: HistoryService,
    private rewardsService: RewardsService,
    private themeService: ThemeService,
    private translate: TranslateService,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    addIcons({
      diamondOutline,
      receiptOutline,
      personOutline,
      giftOutline,
      settingsOutline,
      notificationsOutline,
      languageOutline,
      helpCircleOutline,
      shareSocialOutline,
      mailOutline,
      documentTextOutline,
      logOutOutline,
      arrowBackOutline,
      sunny,
      moon,
      personCircleOutline,
      shieldCheckmarkOutline,
      lockClosedOutline,
      informationCircleOutline
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

  // Navigation methods
  async navigate(path: string) {
    try {
      await this.router.navigate([`/tabs/${path}`]);
    } catch (error) {
      console.error(`Navigation error to ${path}:`, error);
      this.notificationService.showError('Navigation failed');
    }
  }

  async getUserRewards() {
    console.log('USER REWARD PAGE');
  }
  goToTransactionPage() {
    this.router.navigate(['/tabs/my-oders']);
  }
  gotoAdvansRewards() {
    this.router.navigate(['./tabs/sponsor']);
  }
  myProfile() {
    this.router.navigate(['./tabs/account/profile']);
  }
  favorited() {
    this.router.navigate(['./transactions']);
  }
  notification() {
    this.router.navigate(['./notification']);
  }
  help() {
    this.router.navigate(['./help']);
  }
  contactUs() {
    this.router.navigate(['./contact-us']);
  }
  condition() {
    this.router.navigate(['./condition']);
  }
  change_language() {
    this.router.navigate(['./change-language']);
  }
  developed_by() {
    window.open('https://advansistechnologies.com', '_system', 'location=no');
  }
  buyAppAction() {
    // this.modalController.create({ component: BuyappalertPage }).then((modalElement) => modalElement.present());
  }
  async inviteFriends() {
    try {
      this.isLoading = true;
      // First generate the invitation link if we don't have one
      if (!this.invitationLink) {
        await this.generateInvitationLink();
      }
      // Then share it
      await this.shareInvitationLink();
    } catch (error) {
      console.error('Invite friends error:', error);
      this.notificationService.showError('Failed to share invitation link');
    } finally {
      this.isLoading = false;
    }
  }
  goToSettings() {
    this.router.navigate(['./settings']);
  }
  // my orders
  myOrders() {
    this.router.navigate(['./my-oders']);
  }
  // Generate invitation link
  private async generateInvitationLink() {
    try {
      const response = (await firstValueFrom(
        this.accountService.generateInvitationLink()
      )) as ApiResponse<{ invitationLink: string }>;
      console.log('Generate invitation link response:', response);
      this.invitationLink = response.data?.invitationLink || '';
    } catch (error: any) {
      console.error('Generate invitation error:', error);
      if (error?.status === 401) {
        this.notificationService.showError('Unauthorized');
      } else {
        this.notificationService.showError(
          'Failed to generate invitation link'
        );
      }
    }
  }

  private async shareInvitationLink() {
    try {
      // If no invitation link, show error
      if (!this.invitationLink) {
        this.notificationService.showError(
          'Unable to generate invitation link'
        );
        return;
      }
      console.log('Invitation link =>', this.invitationLink);
      const shareData = {
        title: 'Join Advansis Pay',
        text: `Hey! Join me on Advansis Pay and enjoy seamless airtime and data transfers! Use my invitation link:`,
        url: this.invitationLink,
        dialogTitle: 'Share with friends',
      };

      await Share.share(shareData);
    } catch (error) {
      console.error('Share error:', error);
      if (error instanceof Error) {
        // Handle case where sharing is not supported
        if (error.message.includes('not supported')) {
          this.notificationService.showError(
            'Sharing is not supported on this device'
          );
        } else {
          throw error;
        }
      }
    }
  }

  async logout() {
    if (this.isLoading) return;

    this.isLoading = true;
    try {
      await this.authService.logout();
      await this.router.navigate(['/login'], { replaceUrl: true });
      this.storageService.clearStorage();
    } catch (error) {
      console.error('Logout error:', error);
      this.notificationService.showError('Failed to logout. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  async toggleDarkMode() {
    this.themeService.toggleTheme();
  }
}
