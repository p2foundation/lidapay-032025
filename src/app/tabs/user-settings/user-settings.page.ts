import { Component } from '@angular/core';
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
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
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
  ],
})
export class UserSettingsPage {
  // Appearance Settings
  isDarkMode = false;
  fontSize = 'medium';

  // Notification Settings
  pushNotifications = true;
  emailNotifications = true;
  promotionalNotifications = false;

  // Security Settings
  biometricEnabled = false;

  // Language & Region Settings
  selectedLanguage = 'en';
  selectedCurrency = 'GHS';

  // App Info
  appVersion = '1.0.0';

  constructor() {
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
    });
  }

  // Appearance Methods
  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    // Implement dark mode toggle logic
    console.log('Dark mode:', this.isDarkMode);
  }

  changeFontSize() {
    // Implement font size change logic
    console.log('Font size:', this.fontSize);
  }

  // Notification Methods
  togglePushNotifications() {
    this.pushNotifications = !this.pushNotifications;
    console.log('Push notifications:', this.pushNotifications);
  }

  toggleEmailNotifications() {
    this.emailNotifications = !this.emailNotifications;
    console.log('Email notifications:', this.emailNotifications);
  }

  togglePromotionalNotifications() {
    this.promotionalNotifications = !this.promotionalNotifications;
    console.log('Promotional notifications:', this.promotionalNotifications);
  }

  // Security Methods
  changePassword() {
    // Navigate to change password page
    console.log('Navigate to change password');
  }

  toggleBiometric() {
    this.biometricEnabled = !this.biometricEnabled;
    console.log('Biometric enabled:', this.biometricEnabled);
  }

  enableBiometric() {
    // Implement biometric setup
    console.log('Setup biometric authentication');
  }

  privacySettings() {
    // Navigate to privacy settings
    console.log('Navigate to privacy settings');
  }

  // Language & Region Methods
  changeLanguage() {
    // Implement language change logic
    console.log('Language:', this.selectedLanguage);
  }

  changeCurrency() {
    // Implement currency change logic
    console.log('Currency:', this.selectedCurrency);
  }

  // Data & Storage Methods
  clearCache() {
    // Implement cache clearing
    console.log('Clear cache');
  }

  exportData() {
    // Implement data export
    console.log('Export data');
  }

  backupSettings() {
    // Implement settings backup
    console.log('Backup settings');
  }

  // About Methods
  viewVersion() {
    // Show version info
    console.log('App version:', this.appVersion);
  }

  termsOfService() {
    // Navigate to terms of service
    console.log('Navigate to terms of service');
  }

  privacyPolicy() {
    // Navigate to privacy policy
    console.log('Navigate to privacy policy');
  }

  // Support Methods
  contactSupport() {
    // Navigate to support or open contact form
    console.log('Contact support');
  }
}
