import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  PopoverController,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-sort-popover',
  template: `
    <ion-content>
      <ion-list>
        <ion-item
          button
          (click)="selectSort('newest')"
          [class.selected]="currentSort === 'newest'"
        >
          <ion-icon slot="start" name="time-outline"></ion-icon>
          <ion-label>Newest First</ion-label>
          <ion-icon
            slot="end"
            name="checkmark"
            *ngIf="currentSort === 'newest'"
          ></ion-icon>
        </ion-item>
        <ion-item
          button
          (click)="selectSort('oldest')"
          [class.selected]="currentSort === 'oldest'"
        >
          <ion-icon slot="start" name="calendar-outline"></ion-icon>
          <ion-label>Oldest First</ion-label>
          <ion-icon
            slot="end"
            name="checkmark"
            *ngIf="currentSort === 'oldest'"
          ></ion-icon>
        </ion-item>
        <ion-item
          button
          (click)="selectSort('amount-high')"
          [class.selected]="currentSort === 'amount-high'"
        >
          <ion-icon slot="start" name="trending-down-outline"></ion-icon>
          <ion-label>Amount (High to Low)</ion-label>
          <ion-icon
            slot="end"
            name="checkmark"
            *ngIf="currentSort === 'amount-high'"
          ></ion-icon>
        </ion-item>
        <ion-item
          button
          (click)="selectSort('amount-low')"
          [class.selected]="currentSort === 'amount-low'"
        >
          <ion-icon slot="start" name="trending-up-outline"></ion-icon>
          <ion-label>Amount (Low to High)</ion-label>
          <ion-icon
            slot="end"
            name="checkmark"
            *ngIf="currentSort === 'amount-low'"
          ></ion-icon>
        </ion-item>
      </ion-list>
    </ion-content>
  `,
  standalone: true,
  imports: [CommonModule, IonContent, IonList, IonItem, IonLabel],
  styles: [
    `
      ion-list {
        margin: 0;
        padding: 8px 0;
      }
      ion-item {
        --padding-start: 16px;
        --padding-end: 16px;
        --min-height: 48px;
        &.selected {
          --background: var(--ion-color-primary-tint);
          --color: var(--ion-color-primary);
          ion-icon {
            color: var(--ion-color-primary);
          }
        }
      }
    `,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SortPopoverComponent {
  @Input() currentSort: string = 'newest';

  constructor(private popoverCtrl: PopoverController) {}

  selectSort(sort: string) {
    this.popoverCtrl.dismiss({ sort });
  }
}
