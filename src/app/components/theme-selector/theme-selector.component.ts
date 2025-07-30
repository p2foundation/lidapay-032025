import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Subject, takeUntil } from 'rxjs';
import { ThemeService, ThemeMode } from '../../services/theme.service';

@Component({
  selector: 'app-theme-selector',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-item button detail="true" (click)="openThemeSelector()">
      <ion-icon slot="start" [name]="getThemeIcon()"></ion-icon>
      <ion-label>
        <h2>{{ 'Theme' | translate }}</h2>
        <p>{{ getThemeDescription() | translate }}</p>
      </ion-label>
      <ion-note slot="end">{{ getThemeLabel() | translate }}</ion-note>
      <ion-icon name="chevron-forward" slot="end"></ion-icon>
    </ion-item>
  `,
  styles: [`
    ion-item {
      --padding-start: 16px;
      --padding-end: 16px;
      --border-radius: 12px;
      margin: 8px 16px;
    }
    
    ion-icon[slot="start"] {
      font-size: 20px;
      color: var(--ion-color-primary);
    }
    
    ion-label h2 {
      font-weight: 600;
      color: var(--ion-text-color);
      margin-bottom: 4px;
    }
    
    ion-label p {
      color: var(--ion-text-color-rgb, 0, 0, 0);
      opacity: 0.7;
      font-size: 14px;
      margin: 0;
    }
    
    ion-note {
      color: var(--ion-color-primary);
      font-weight: 500;
      font-size: 14px;
    }
  `]
})
export class ThemeSelectorComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  currentThemeMode: ThemeMode = 'system';

  constructor(private themeService: ThemeService) {}

  ngOnInit() {
    this.themeService.themeMode$
      .pipe(takeUntil(this.destroy$))
      .subscribe(themeMode => {
        this.currentThemeMode = themeMode;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async openThemeSelector() {
    const alert = await this.createThemeAlert();
    await alert.present();
  }

  private async createThemeAlert() {
    const { AlertController } = await import('@ionic/angular');
    const alertController = new AlertController();
    
    return await alertController.create({
      header: 'Choose Theme',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ],
      inputs: [
        {
          type: 'radio',
          label: 'System',
          value: 'system',
          checked: this.currentThemeMode === 'system',
          handler: () => {
            this.themeService.setThemeMode('system');
          }
        },
        {
          type: 'radio',
          label: 'Light',
          value: 'light',
          checked: this.currentThemeMode === 'light',
          handler: () => {
            this.themeService.setThemeMode('light');
          }
        },
        {
          type: 'radio',
          label: 'Dark',
          value: 'dark',
          checked: this.currentThemeMode === 'dark',
          handler: () => {
            this.themeService.setThemeMode('dark');
          }
        }
      ]
    });
  }

  getThemeIcon(): string {
    switch (this.currentThemeMode) {
      case 'system':
        return 'settings-outline';
      case 'light':
        return 'sunny-outline';
      case 'dark':
        return 'moon-outline';
      default:
        return 'settings-outline';
    }
  }

  getThemeLabel(): string {
    switch (this.currentThemeMode) {
      case 'system':
        return 'System';
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      default:
        return 'System';
    }
  }

  getThemeDescription(): string {
    switch (this.currentThemeMode) {
      case 'system':
        return 'Follows your device theme';
      case 'light':
        return 'Always use light theme';
      case 'dark':
        return 'Always use dark theme';
      default:
        return 'Follows your device theme';
    }
  }
} 