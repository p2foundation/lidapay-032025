import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  ModalController,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-phone-number-modal',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Enter Phone Number</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">Cancel</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form [formGroup]="dataBundleForm">
        <ion-item>
          <ion-label position="stacked">Phone Number</ion-label>
          <ion-input
            type="tel"
            formControlName="recipientNumber"
            placeholder="Enter phone number"
          ></ion-input>
        </ion-item>
      </form>

      <ion-button
        expand="block"
        color="primary"
        (click)="submit()"
        class="ion-margin-top"
      >
        Continue
      </ion-button>
    </ion-content>
  `,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonButton,
    IonItem,
    IonLabel,
    IonInput,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PhoneNumberModalComponent {
  @Input() bundle: any;
  @Input() dataBundleForm!: FormGroup;

  constructor(private modalController: ModalController) {}

  dismiss() {
    this.modalController.dismiss();
  }

  submit() {
    if (this.dataBundleForm.valid) {
      this.modalController.dismiss(this.dataBundleForm.value);
    }
  }
} 