import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonBackButton,
  IonButtons,
  IonCol,
  IonGrid,
  IonRow,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  globeOutline,
  phonePortraitOutline,
  rocketOutline,
  searchOutline,
  wifiOutline,
  cashOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-recharge',
  templateUrl: './recharge.page.html',
  styleUrls: ['./recharge.page.scss'],
  standalone: true,
  imports: [
    IonCol,
    IonButtons,
    IonBackButton,
    IonIcon,
    IonButton,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonGrid,
    IonRow,
    CommonModule,
    FormsModule,
    TranslateModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RechargePage implements OnInit {
  public isLoading: boolean = true;
  constructor(private router: Router) {
    addIcons({
      searchOutline,
      globeOutline,
      phonePortraitOutline,
      wifiOutline,
      cashOutline,
      rocketOutline,
    });
  }

  ngOnInit() {
    // Simulate loading time
    setTimeout(() => {
      this.isLoading = false;
    }, 1000); // Show skeleton for 2 seconds
  }
  gotoAirtimePage() {
    this.router.navigate(['tabs/recharge/airtime']);
  }
  gotoInternetPage() {
    this.router.navigate(['tabs/recharge/internet']);
  }
  gotoInternationalPage() {
    this.router.navigate(['tabs/recharge/reloadly']);
  }
  gotoRemitstarPage() {
    this.router.navigate(['tabs/recharge/remitstar']);
  }
  search() {
    this.router.navigate(['tabs/search']);
  }
}
