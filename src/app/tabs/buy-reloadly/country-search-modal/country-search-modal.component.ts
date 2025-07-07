import { Component, OnInit, Input, inject } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonSearchbar, IonIcon, IonButton, IonButtons } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close } from 'ionicons/icons';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-country-search-modal',
  templateUrl: './country-search-modal.component.html',
  styleUrls: ['./country-search-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    IonicModule
  ],
  providers: [ModalController]
})
export class CountrySearchModalComponent implements OnInit {
  private modalCtrl = inject(ModalController);
  
  @Input() countries: any[] = [];
  filteredCountries: any[] = [];
  searchTerm: string = '';
  

  constructor() {
    addIcons({ close });
  }

  ngOnInit() {
    this.filteredCountries = [...this.countries];
  }

  filterCountries() {
    if (!this.searchTerm.trim()) {
      this.filteredCountries = [...this.countries];
      return;
    }
    
    const searchTerm = this.searchTerm.toLowerCase().trim();
    this.filteredCountries = this.countries.filter(country => 
      country.name.toLowerCase().includes(searchTerm) || 
      (country.isoName && country.isoName.toLowerCase().includes(searchTerm))
    );
  }

  selectCountry(country: any) {
    this.modalCtrl.dismiss(country, 'select');
  }

  dismiss() {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}
