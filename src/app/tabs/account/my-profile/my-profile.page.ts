import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { NotificationService } from 'src/app/services/notification.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { Subject, firstValueFrom, catchError } from 'rxjs';
import { AccountService } from 'src/app/services/auth/account.service';
import { Profile } from 'src/app/interfaces/profile.interface';

@Component({
  selector: 'app-my-profile',
  templateUrl: './my-profile.page.html',
  styleUrls: ['./my-profile.page.scss'],
  standalone: true,
  imports: [
    IonContent, 
    IonHeader, 
    IonToolbar, 
    CommonModule, 
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class MyProfilePage implements OnInit {
  isLoading: boolean = true;
  profile: Profile = {} as Profile;
  readonly defaultAvatarUrl = 'assets/imgs/avatar.png';

  constructor(
    private accountService: AccountService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  async ngOnInit() {
    await this.loadProfile();
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
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      this.notificationService.showError('Failed to load profile');
    } finally {
      this.isLoading = false;
    }
  }

  async goToUpdateProfile() {
    await this.router.navigate(['/tabs/profile-update']);
  }
}
