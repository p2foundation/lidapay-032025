import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  Input,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
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
  IonDatetime,
  IonSelect,
  IonSelectOption,
  IonDatetimeButton,
  IonItemDivider,
  IonItemGroup,
  ModalController,
  IonModal,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-filter-modal',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Filter Transactions</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">Close</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form [formGroup]="filterForm">
        <!-- Date Range -->
        <ion-item-group>
          <ion-item-divider>
            <ion-label>Date Range</ion-label>
          </ion-item-divider>

          <!-- Date From -->
          <ion-item>
            <ion-label position="stacked">From</ion-label>
            <ion-datetime-button datetime="dateFrom"></ion-datetime-button>
          </ion-item>
          <ion-modal [isOpen]="isDateFromOpen" (didDismiss)="isDateFromOpen = false">
            <ion-datetime
              id="dateFrom"
              formControlName="dateFrom"
              presentation="date"
              [showDefaultButtons]="true"
              (ionChange)="dateFromChanged($event)"
            ></ion-datetime>
          </ion-modal>

          <!-- Date To -->
          <ion-item>
            <ion-label position="stacked">To</ion-label>
            <ion-datetime-button datetime="dateTo"></ion-datetime-button>
          </ion-item>
          <ion-modal [isOpen]="isDateToOpen" (didDismiss)="isDateToOpen = false">
            <ion-datetime
              id="dateTo"
              formControlName="dateTo"
              presentation="date"
              [showDefaultButtons]="true"
              (ionChange)="dateToChanged($event)"
            ></ion-datetime>
          </ion-modal>
        </ion-item-group>
        <!-- Amount Range -->
        <ion-item-group>
          <ion-item-divider>
            <ion-label>Amount Range</ion-label>
          </ion-item-divider>

          <ion-item>
            <ion-label position="stacked">Min Amount</ion-label>
            <ion-input
              type="number"
              formControlName="minAmount"
              placeholder="0"
            ></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Max Amount</ion-label>
            <ion-input
              type="number"
              formControlName="maxAmount"
              placeholder="Any"
            ></ion-input>
          </ion-item>
        </ion-item-group>

        <!-- Status -->
        <ion-item-group>
          <ion-item-divider>
            <ion-label>Status</ion-label>
          </ion-item-divider>

          <ion-item>
            <ion-select
              formControlName="status"
              placeholder="All Statuses"
              multiple="true"
            >
              <ion-select-option value="completed">Completed</ion-select-option>
              <ion-select-option value="pending">Pending</ion-select-option>
              <ion-select-option value="failed">Failed</ion-select-option>
            </ion-select>
          </ion-item>
        </ion-item-group>
      </form>
      <ion-button
        expand="block"
        color="primary"
        (click)="applyFilters()"
        class="ion-margin-top"
      >
        Apply Filters
      </ion-button>

      <ion-button
        expand="block"
        color="medium"
        (click)="resetFilters()"
        class="ion-margin-top"
      >
        Reset Filters
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
    IonDatetime,
    IonSelect,
    IonSelectOption,
    IonDatetimeButton,
    IonItemDivider,
    IonItemGroup,
    IonModal,
  ],
  styles: [
    `
      ion-item-divider {
        --background: transparent;
        --padding-start: 0;
        font-weight: 600;
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: var(--ion-color-medium);
      }
      ion-item-group {
        margin-bottom: 24px;
      }
    `,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FilterModalComponent implements OnInit {
  @Input() transactions: any[] = [];
  filterForm: FormGroup;
  isDateFromOpen = false;
  isDateToOpen = false;

  constructor(private modalCtrl: ModalController, private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      dateFrom: [''],
      dateTo: [''],
      minAmount: [''],
      maxAmount: [''],
      status: [[]],
    });
  }

  ngOnInit() {
    // Add click handlers for datetime buttons
    const dateFromButton = document.querySelector('ion-datetime-button[datetime="dateFrom"]');
    const dateToButton = document.querySelector('ion-datetime-button[datetime="dateTo"]');
    
    if (dateFromButton) {
      dateFromButton.addEventListener('click', () => {
        this.isDateFromOpen = true;
      });
    }
    
    if (dateToButton) {
      dateToButton.addEventListener('click', () => {
        this.isDateToOpen = true;
      });
    }
  }
  resetFilters() {
    this.filterForm.reset();
  }
  dismiss() {
    this.modalCtrl.dismiss();
  }

  dateFromChanged(event: any) {
    console.log('Date From changed:', event.detail.value);
    this.filterForm.patchValue({ dateFrom: event.detail.value });
  }
  
  dateToChanged(event: any) {
    console.log('Date To changed:', event.detail.value);
    this.filterForm.patchValue({ dateTo: event.detail.value });
  }

  applyFilters() {
    if (this.filterForm.valid) {
      const filters = this.filterForm.value;
      console.log('Applying filters:', filters);
      this.modalCtrl.dismiss({
        filters: filters
      });
    }
  }
  
}
