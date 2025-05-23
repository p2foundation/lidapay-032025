import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-wallet-management',
  templateUrl: './wallet-management.page.html',
  styleUrls: ['./wallet-management.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class WalletManagementPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
