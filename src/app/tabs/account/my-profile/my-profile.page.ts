import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { 
  IonContent, 
  IonHeader, 
  IonToolbar, 
  IonBackButton,
  IonButton,
  IonIcon,
  IonItem,
  IonInput,
  IonLabel,
  IonSkeletonText,
  IonCard,
  IonCardContent,
  IonAvatar,
  IonSpinner,
  IonChip,
  IonTextarea
} from '@ionic/angular/standalone';
import { NotificationService } from 'src/app/services/notification.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { Subject, firstValueFrom, catchError, takeUntil } from 'rxjs';
import { AccountService } from 'src/app/services/auth/account.service';
import { Profile } from 'src/app/interfaces/profile.interface';
import { ThemeService } from 'src/app/services/theme.service';
import { StorageService } from 'src/app/services/storage.service';
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
  arrowBackOutline,
  shieldOutline,
  chevronBackOutline, camera, call, briefcase, save, statsChart, time, trophy, star, timeOutline, cameraOutline } from 'ionicons/icons';

@Component({
  selector: 'app-my-profile',
  templateUrl: './my-profile.page.html',
  styleUrls: ['./my-profile.page.scss'],
  standalone: true,
  imports: [
    IonContent, 
    IonHeader, 
    IonToolbar, 
    IonBackButton,
    IonButton,
    IonIcon,
    IonItem,
    IonInput,
    IonLabel,
    IonSkeletonText,
    IonCard,
    IonCardContent,
    IonAvatar,
    IonSpinner,
    IonChip,
    IonTextarea,
    CommonModule, 
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class MyProfilePage implements OnInit, OnDestroy {
  isLoading: boolean = true;
  isEditing: boolean = false;
  isSaving: boolean = false;
  profile: Profile = {} as Profile;
  profileForm!: FormGroup;
  isDarkMode: boolean = false;
  
  readonly defaultAvatarUrl = 'https://www.gravatar.com/avatar/default?d=mp&s=200';
  
  private destroy$ = new Subject<void>();

  constructor(
    private accountService: AccountService,
    private router: Router,
    private notificationService: NotificationService,
    private themeService: ThemeService,
    private storageService: StorageService,
    private formBuilder: FormBuilder,
    private translate: TranslateService
  ) {
    this.initializeForm();
    this.initializeIcons();
  }

  private initializeIcons() {
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
      arrowBackOutline,
      shieldOutline,
      chevronBackOutline
    });
  }

  private initializeForm() {
    this.profileForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.minLength(10)]],
      bio: [''],
      location: [''],
      website: [''],
      company: [''],
      jobTitle: [''],
      education: [''],
      interests: ['']
    });
  }

  async ngOnInit() {
    this.themeService.isDarkMode$.pipe(takeUntil(this.destroy$)).subscribe(
      (isDark) => (this.isDarkMode = isDark)
    );
    
    await this.loadProfile();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async loadProfile() {
    try {
      this.isLoading = true;
      const response = await firstValueFrom(this.accountService.getProfile());
      
      if (response) {
        this.profile = {
          ...response,
          gravatar: response.gravatar || this.defaultAvatarUrl
        };
        
        // Populate form with profile data
        this.profileForm.patchValue({
          firstName: this.profile.firstName || '',
          lastName: this.profile.lastName || '',
          email: this.profile.email || '',
          phoneNumber: this.profile.phoneNumber || '',
          bio: this.profile.bio || '',
          location: this.profile.location || '',
          website: this.profile.website || '',
          company: this.profile.company || '',
          jobTitle: this.profile.jobTitle || '',
          education: this.profile.education || '',
          interests: this.profile.interests || ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      this.notificationService.showError('Failed to load profile');
    } finally {
      this.isLoading = false;
    }
  }

  toggleEditMode() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      // Reset form to original values
      this.profileForm.patchValue({
        firstName: this.profile.firstName || '',
        lastName: this.profile.lastName || '',
        email: this.profile.email || '',
        phoneNumber: this.profile.phoneNumber || '',
        bio: this.profile.bio || '',
        location: this.profile.location || '',
        website: this.profile.website || '',
        company: this.profile.company || '',
        jobTitle: this.profile.jobTitle || '',
        education: this.profile.education || '',
        interests: this.profile.interests || ''
      });
    }
  }

  async saveProfile() {
    if (this.profileForm.invalid) {
      this.notificationService.showError('Please fill in all required fields correctly');
      return;
    }

    try {
      this.isSaving = true;
      const formData = this.profileForm.value;
      
      const response = await firstValueFrom(
        this.accountService.updateUserProfile(formData)
      );

      if (response) {
        this.profile = { ...this.profile, ...formData };
        this.isEditing = false;
        this.notificationService.showSuccess('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      this.notificationService.showError('Failed to update profile');
    } finally {
      this.isSaving = false;
    }
  }

  async changeProfilePicture() {
    // This would integrate with camera/gallery functionality
    this.notificationService.showSuccess('Profile picture change feature coming soon!');
  }

  async goToUpdateProfile() {
    await this.router.navigate(['/tabs/account/profile-update']);
  }

  getVerificationStatus(verified: boolean | undefined): string {
    return verified ? 'Verified' : 'Not Verified';
  }

  getVerificationColor(verified: boolean | undefined): string {
    return verified ? 'success' : 'warning';
  }

  goBack() {
    this.router.navigate(['/tabs/home']);
  }
}
