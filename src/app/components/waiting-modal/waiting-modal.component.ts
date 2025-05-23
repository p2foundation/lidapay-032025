import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonSpinner,
  IonLabel,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-waiting-modal',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ title }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">Cancel</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="waiting-content">
        <ion-spinner></ion-spinner>
        <ion-label class="message">{{ message }}</ion-label>
        <ion-label class="status-message">{{ statusMessage }}</ion-label>
      </div>
    </ion-content>
  `,
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonButton,
    IonSpinner,
    IonLabel,
  ],
  styles: [
    `
      .waiting-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        text-align: center;
        padding: 20px;
      }

      ion-spinner {
        width: 48px;
        height: 48px;
        margin-bottom: 16px;
      }

      .message {
        font-size: 18px;
        margin-bottom: 8px;
        color: var(--ion-color-medium);
      }

      .status-message {
        font-size: 14px;
        color: var(--ion-color-medium);
      }
    `,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class WaitingModalComponent {
  @Input() title: string = 'Processing';
  @Input() message: string = 'Please wait...';
  @Input() statusMessage: string = '';

  constructor() {}

  dismiss() {
    // This will be handled by the modal controller
  }
} 