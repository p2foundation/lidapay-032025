import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-remitstar',
  templateUrl: './remitstar.page.html',
  styleUrls: ['./remitstar.page.scss'],
  standalone: true,
  imports: [
    IonButtons, 
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar, 
    CommonModule, 
    FormsModule,
    TranslateModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA] 
})
export class RemitstarPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
