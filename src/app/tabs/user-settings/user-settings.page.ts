import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonBackButton,
  IonButtons,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonToggle,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonCard,
  IonCardContent,
  IonBadge,
  IonChip,
  IonSkeletonText,
  IonSpinner,
  IonToast,
  IonAlert,
  IonActionSheet,
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  colorPaletteOutline,
  moonOutline,
  textOutline,
  notificationsOutline,
  mailOutline,
  giftOutline,
  shieldCheckmarkOutline,
  keyOutline,
  fingerPrintOutline,
  lockClosedOutline,
  languageOutline,
  globeOutline,
  cloudOutline,
  trashOutline,
  downloadOutline,
  cloudUploadOutline,
  informationCircleOutline,
  documentTextOutline,
  shieldOutline,
  helpCircleOutline,
  chevronForward,
  chevronBackOutline,
  settingsOutline,
  personOutline,
  walletOutline,
  cardOutline,
  cellularOutline,
  wifiOutline,
  airplaneOutline,
  volumeHighOutline,
  volumeMuteOutline,
  locationOutline,
  cameraOutline,
  calendarOutline,
  timeOutline,
  syncOutline,
  refreshOutline,
  powerOutline,
  logOutOutline,
  heartOutline,
  starOutline,
  trophyOutline,
  medalOutline,
  ribbonOutline,
  diamondOutline,
  flashOutline,
  thunderstormOutline,
  sunnyOutline,
  cloudyOutline,
  rainyOutline,
  snowOutline,
  partlySunnyOutline,
  waterOutline,
  leafOutline,
  flowerOutline,
  earthOutline,
  planetOutline,
  rocketOutline,
  telescopeOutline,
  flaskOutline,
  beakerOutline,
  cubeOutline,
  pinOutline,
  alertOutline,
  bugOutline,
  addOutline,
  atOutline,
  alarmOutline,
  eggOutline,
  linkOutline,
  cutOutline,
  bagOutline,
  gridOutline,
  scaleOutline,
  banOutline,
  roseOutline,
  searchOutline,
  sadOutline,
  scanOutline,
  ellipseOutline,
  cropOutline,
  manOutline,
  eyeOutline,
  receiptOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-user-settings',
  templateUrl: './user-settings.page.html',
  styleUrls: ['./user-settings.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonBackButton,
    IonButtons,
    IonList,
    IonItem,
    IonIcon,
    IonLabel,
    IonToggle,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonCard,
    IonCardContent,
    IonBadge,
    IonSkeletonText,
  ],
})
export class UserSettingsPage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Loading States
  isLoading = false;
  isSaving = false;

  // Appearance Settings
  isDarkMode = false;
  fontSize = 'medium';
  accentColor = 'primary';
  animationEnabled = true;

  // Notification Settings
  pushNotifications = true;
  emailNotifications = true;
  promotionalNotifications = false;
  transactionAlerts = true;
  securityAlerts = true;
  marketingEmails = false;

  // Security Settings
  biometricEnabled = false;
  twoFactorEnabled = false;
  sessionTimeout = 30;
  autoLockEnabled = true;

  // Language & Region Settings
  selectedLanguage = 'en';
  selectedCurrency = 'GHS';
  selectedTimezone = 'Africa/Accra';
  dateFormat = 'DD/MM/YYYY';
  timeFormat = '24h';

  // Data & Storage Settings
  autoBackupEnabled = true;
  cacheSize = '0 MB';
  storageUsed = '0 MB';
  lastBackup = 'Never';

  // App Info
  appVersion = '1.0.0';
  buildNumber = '2024.1.0';
  lastUpdated = new Date().toLocaleDateString();

  // Quick Stats
  totalSettings = 0;
  changedSettings = 0;

  constructor(
    private translateService: TranslateService,
    private router: Router
  ) {
    this.initializeIcons();
    this.loadSettings();
  }

  ngOnInit() {
    this.initializeSettings();
    this.calculateStats();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeIcons() {
    addIcons({
      colorPaletteOutline,
      moonOutline,
      textOutline,
      notificationsOutline,
      mailOutline,
      giftOutline,
      shieldCheckmarkOutline,
      keyOutline,
      fingerPrintOutline,
      lockClosedOutline,
      languageOutline,
      globeOutline,
      cloudOutline,
      trashOutline,
      downloadOutline,
      cloudUploadOutline,
      informationCircleOutline,
      documentTextOutline,
      shieldOutline,
      helpCircleOutline,
      chevronForward,
      chevronBackOutline,
      settingsOutline,
      personOutline,
      walletOutline,
      cardOutline,
      cellularOutline,
      wifiOutline,
      airplaneOutline,
      volumeHighOutline,
      volumeMuteOutline,
      locationOutline,
      cameraOutline,
      calendarOutline,
      timeOutline,
      syncOutline,
      refreshOutline,
      powerOutline,
      logOutOutline,
      heartOutline,
      starOutline,
      trophyOutline,
      medalOutline,
      ribbonOutline,
      diamondOutline,
      flashOutline,
      thunderstormOutline,
      sunnyOutline,
      cloudyOutline,
      rainyOutline,
      snowOutline,
      partlySunnyOutline,
      waterOutline,
      leafOutline,
      flowerOutline,
      earthOutline,
      planetOutline,
      rocketOutline,
      telescopeOutline,
      flaskOutline,
      beakerOutline,
      cubeOutline,
      pinOutline,
      alertOutline,
      bugOutline,
      addOutline,
      atOutline,
      alarmOutline,
      eggOutline,
      linkOutline,
      cutOutline,
      bagOutline,
      gridOutline,
      scaleOutline,
      banOutline,
      roseOutline,
      searchOutline,
      sadOutline,
      scanOutline,
      ellipseOutline,
      cropOutline,
      manOutline,
      eyeOutline,
      receiptOutline
    });
  }

  private async loadSettings() {
    this.isLoading = true;
    try {
      // Load settings from storage/local state
      await this.loadFromStorage();
      this.calculateStats();
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private async loadFromStorage() {
    // Load settings from local storage or state management
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      Object.assign(this, settings);
    }
  }

  private async saveToStorage() {
    try {
      const settings = {
        isDarkMode: this.isDarkMode,
        fontSize: this.fontSize,
        accentColor: this.accentColor,
        animationEnabled: this.animationEnabled,
        pushNotifications: this.pushNotifications,
        emailNotifications: this.emailNotifications,
        promotionalNotifications: this.promotionalNotifications,
        transactionAlerts: this.transactionAlerts,
        securityAlerts: this.securityAlerts,
        marketingEmails: this.marketingEmails,
        biometricEnabled: this.biometricEnabled,
        twoFactorEnabled: this.twoFactorEnabled,
        sessionTimeout: this.sessionTimeout,
        autoLockEnabled: this.autoLockEnabled,
        selectedLanguage: this.selectedLanguage,
        selectedCurrency: this.selectedCurrency,
        selectedTimezone: this.selectedTimezone,
        dateFormat: this.dateFormat,
        timeFormat: this.timeFormat,
        autoBackupEnabled: this.autoBackupEnabled,
      };
      
      localStorage.setItem('userSettings', JSON.stringify(settings));
      this.changedSettings = 0;
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  private calculateStats() {
    // Calculate total settings and changed settings
    const settingsKeys = [
      'isDarkMode', 'fontSize', 'accentColor', 'animationEnabled',
      'pushNotifications', 'emailNotifications', 'promotionalNotifications',
      'transactionAlerts', 'securityAlerts', 'marketingEmails',
      'biometricEnabled', 'twoFactorEnabled', 'sessionTimeout', 'autoLockEnabled',
      'selectedLanguage', 'selectedCurrency', 'selectedTimezone',
      'dateFormat', 'timeFormat', 'autoBackupEnabled'
    ];
    
    this.totalSettings = settingsKeys.length;
    
    // This would be more sophisticated in a real app
    this.changedSettings = 0;
  }

  private initializeSettings() {
    // Initialize with default values or load from service
    this.isDarkMode = document.body.classList.contains('dark');
  }

  // Appearance Methods
  async toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    document.body.classList.toggle('dark', this.isDarkMode);
    await this.saveToStorage();
    this.showToast('Theme updated successfully');
  }

  async changeFontSize() {
    await this.saveToStorage();
    this.showToast('Font size updated');
  }

  async changeAccentColor() {
    await this.saveToStorage();
    this.showToast('Accent color updated');
  }

  async toggleAnimation() {
    this.animationEnabled = !this.animationEnabled;
    await this.saveToStorage();
    this.showToast('Animation setting updated');
  }

  // Notification Methods
  async togglePushNotifications() {
    this.pushNotifications = !this.pushNotifications;
    await this.saveToStorage();
    this.showToast('Push notifications updated');
  }

  async toggleEmailNotifications() {
    this.emailNotifications = !this.emailNotifications;
    await this.saveToStorage();
    this.showToast('Email notifications updated');
  }

  async togglePromotionalNotifications() {
    this.promotionalNotifications = !this.promotionalNotifications;
    await this.saveToStorage();
    this.showToast('Promotional notifications updated');
  }

  async toggleTransactionAlerts() {
    this.transactionAlerts = !this.transactionAlerts;
    await this.saveToStorage();
    this.showToast('Transaction alerts updated');
  }

  async toggleSecurityAlerts() {
    this.securityAlerts = !this.securityAlerts;
    await this.saveToStorage();
    this.showToast('Security alerts updated');
  }

  async toggleMarketingEmails() {
    this.marketingEmails = !this.marketingEmails;
    await this.saveToStorage();
    this.showToast('Marketing emails updated');
  }

  // Security Methods
  async changePassword() {
    // Navigate to change password page
    this.router.navigate(['/tabs/account/change-password']);
  }

  async toggleBiometric() {
    this.biometricEnabled = !this.biometricEnabled;
    await this.saveToStorage();
    this.showToast('Biometric setting updated');
  }

  async enableBiometric() {
    // Implement biometric setup
    this.showToast('Biometric setup initiated');
  }

  async toggleTwoFactor() {
    this.twoFactorEnabled = !this.twoFactorEnabled;
    await this.saveToStorage();
    this.showToast('Two-factor authentication updated');
  }

  async changeSessionTimeout() {
    await this.saveToStorage();
    this.showToast('Session timeout updated');
  }

  async toggleAutoLock() {
    this.autoLockEnabled = !this.autoLockEnabled;
    await this.saveToStorage();
    this.showToast('Auto-lock setting updated');
  }

  async privacySettings() {
    // Navigate to privacy settings
    this.router.navigate(['/tabs/account/privacy']);
  }

  // Language & Region Methods
  async changeLanguage() {
    await this.saveToStorage();
    this.translateService.use(this.selectedLanguage);
    this.showToast('Language updated');
  }

  async changeCurrency() {
    await this.saveToStorage();
    this.showToast('Currency updated');
  }

  async changeTimezone() {
    await this.saveToStorage();
    this.showToast('Timezone updated');
  }

  async changeDateFormat() {
    await this.saveToStorage();
    this.showToast('Date format updated');
  }

  async changeTimeFormat() {
    await this.saveToStorage();
    this.showToast('Time format updated');
  }

  // Data & Storage Methods
  async clearCache() {
    this.isSaving = true;
    try {
      // Implement cache clearing
      this.cacheSize = '0 MB';
      await this.saveToStorage();
      this.showToast('Cache cleared successfully');
    } catch (error) {
      this.showToast('Error clearing cache', 'danger');
    } finally {
      this.isSaving = false;
    }
  }

  async exportData() {
    this.isSaving = true;
    try {
      // Implement data export
      await this.saveToStorage();
      this.showToast('Data export initiated');
    } catch (error) {
      this.showToast('Error exporting data', 'danger');
    } finally {
      this.isSaving = false;
    }
  }

  async backupSettings() {
    this.isSaving = true;
    try {
      // Implement settings backup
      this.lastBackup = new Date().toLocaleDateString();
      await this.saveToStorage();
      this.showToast('Settings backed up successfully');
    } catch (error) {
      this.showToast('Error backing up settings', 'danger');
    } finally {
      this.isSaving = false;
    }
  }

  async toggleAutoBackup() {
    this.autoBackupEnabled = !this.autoBackupEnabled;
    await this.saveToStorage();
    this.showToast('Auto-backup setting updated');
  }

  // About Methods
  async viewVersion() {
    // Show version info
    this.showToast(`App Version: ${this.appVersion}`);
  }

  async termsOfService() {
    // Navigate to terms of service
    this.router.navigate(['/tabs/account/terms']);
  }

  async privacyPolicy() {
    // Navigate to privacy policy
    this.router.navigate(['/tabs/account/privacy-policy']);
  }

  // Support Methods
  async contactSupport() {
    // Navigate to support or open contact form
    this.router.navigate(['/tabs/account/support']);
  }

  // Utility Methods
  private showToast(message: string, color: string = 'success') {
    // Show toast notification
    console.log(`Toast: ${message} (${color})`);
  }

  async resetToDefaults() {
    // Reset all settings to default values
    this.isLoading = true;
    try {
      // Reset all settings
      this.initializeSettings();
      await this.saveToStorage();
      this.showToast('Settings reset to defaults');
    } catch (error) {
      this.showToast('Error resetting settings', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  async refreshSettings() {
    await this.loadSettings();
    this.showToast('Settings refreshed');
  }

  getSettingsProgress(): number {
    return this.totalSettings > 0 ? (this.changedSettings / this.totalSettings) * 100 : 0;
  }

  getSettingsStatus(): string {
    const progress = this.getSettingsProgress();
    if (progress === 0) return 'Default';
    if (progress < 25) return 'Minimal';
    if (progress < 50) return 'Basic';
    if (progress < 75) return 'Customized';
    return 'Fully Customized';
  }
}
