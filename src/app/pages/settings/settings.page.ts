import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, ModalController } from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Profile } from 'src/app/interfaces/profile.interface';
import { Subject, takeUntil, firstValueFrom } from 'rxjs';
import { ThemeService } from 'src/app/services/theme.service';
import { Router } from '@angular/router';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { AccountService } from 'src/app/services/auth/account.service';
import { NotificationService } from 'src/app/services/notification.service';
import { StorageService } from 'src/app/services/storage.service';
import { RewardsService } from 'src/app/services/user/rewards.service';
import QRCode from 'qrcode';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar, 
    CommonModule, 
    FormsModule,
    TranslateModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SettingsPage implements OnInit, OnDestroy  {

  @ViewChild('qrWrapper') qrWrapper!: ElementRef;
  
  isQRModalOpen = false;
  qrCodeDataUrl: string = '';
  profile: Profile = {} as Profile;
  currentLanguage: string = 'en';
  isDarkMode: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private themeService: ThemeService,
    private translate: TranslateService,
    private storage: StorageService,
    private notificationService: NotificationService,
    private accountService: AccountService,
    private rewardsService: RewardsService,
    private modalController: ModalController
  ) {
    this.themeService.isDarkMode$
    .pipe(takeUntil(this.destroy$))
    .subscribe(isDark => {
      this.isDarkMode = isDark;
    });
  }

  ngOnInit() {
    this.loadProfile();
    this.currentLanguage = this.translate.currentLang;
    this.isDarkMode = this.themeService.isDarkMode();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadProfile() {
    try {
      const response = await this.accountService.getProfile().toPromise();
      if (response) {
        this.profile = response;
        // Always generate a fresh QR code on profile load
        await this.generateQRCode();
      }
    } catch (error) {
      console.error('Profile load error:', error);
      this.notificationService.showError('Failed to load profile');
    }
  }

  async generateQRCode() {
    if (!this.profile?._id) {
      console.error('Profile ID not available');
      return;
    }

    const profileData = {
      id: this.profile._id,
      name: `${this.profile.firstName} ${this.profile.lastName}`,
      email: this.profile.email,
      phone: this.profile.phoneNumber,
      type: 'INVITE',
      timestamp: Date.now()
    };

    try {
      // Generate QR code with better visibility
      this.qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(profileData), {
        width: 300, // Increased size
        margin: 4,
        color: {
          dark: this.isDarkMode ? '#FFFFFF' : '#000000', // Dynamic color based on theme
          light: this.isDarkMode ? '#000000' : '#FFFFFF'
        },
        errorCorrectionLevel: 'H' // Highest error correction
      });

      // Save the generated QR code to profile if needed
      if (this.profile && !this.profile.qrCode) {
        await this.accountService.updateUserProfile({ qrCode: this.qrCodeDataUrl }).toPromise();
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      this.notificationService.showError('Failed to generate QR code');
      throw error;
    }
  }

  async showQRCodeOptions() {
    try {
      if (!this.qrCodeDataUrl) {
        await this.generateQRCode(); // Make sure we have a QR code
      }
      this.isQRModalOpen = true;
    } catch (error) {
      console.error('Error showing QR code:', error);
      this.notificationService.showError('Failed to display QR code');
    }
  }

  closeQRModal() {
    this.isQRModalOpen = false;
  }

  async shareQRCode() {
    try {
      // First try to save the QR code locally
      const fileName = `lidapay-qr-${Date.now()}.png`;
      const savedFile = await this.saveQRCodeLocally(fileName);
      
      // Then share it
      await Share.share({
        title: 'Join me on LidaPay',
        text: 'Scan my QR code to connect with me on LidaPay and earn rewards!',
        url: savedFile.uri,
        dialogTitle: 'Share QR Code'
      });

      // Track sharing for rewards
      await this.rewardsService.trackQRShare().toPromise();
      this.notificationService.showSuccess('QR Code shared successfully');
    } catch (error) {
      console.error('Error sharing QR code:', error);
      this.notificationService.showError('Failed to share QR code');
    }
  }

  async downloadQRCode() {
    try {
      const fileName = `lidapay-qr-${Date.now()}.png`;
      const result = await this.saveQRCodeLocally(fileName);
      
      this.notificationService.showSuccess('QR Code saved to ' + result.uri);
    } catch (error) {
      console.error('Error downloading QR code:', error);
      this.notificationService.showError('Failed to download QR code');
    }
  }

  private async saveQRCodeLocally(fileName: string) {
    const base64Data = this.qrCodeDataUrl.split(',')[1];
    
    return await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Documents,
      recursive: true
    });
  }

  // Navigation Methods
  gotoUserProfile() {
    this.router.navigate(['/myprofile']);
  }

  gotoVerification() {
    this.router.navigate(['/tabs/verification']);
  }

  goToUpdateProfile() {
    this.router.navigate(['/profile-update']);
  }

  gotoSecurity() {
    this.router.navigate(['/security']);
  }

  changePassword() {
    this.router.navigate(['/change-password']);
  }

  change_language() {
    this.router.navigate(['/change-language']);
  }

  toggleDarkMode(event: any) {
    this.themeService.setDarkMode(event.detail.checked);
  }

  async scanQRCode() {
    try {
      await firstValueFrom(this.accountService.trackQRCodeUsage());
      this.notificationService.showSuccess('QR Code usage tracked successfully');
    } catch (error) {
      console.error('Error tracking QR code usage:', error);
      this.notificationService.showError('Failed to track QR code usage');
    }
  }

}
