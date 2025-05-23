import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-pay-or-send',
  templateUrl: './pay-or-send.page.html',
  styleUrls: ['./pay-or-send.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class PayOrSendPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
