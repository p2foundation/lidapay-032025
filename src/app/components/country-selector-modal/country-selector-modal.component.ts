import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent, IonSearchbar, IonChip, IonItem, IonLabel, IonAvatar, ModalController } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { CountryService, Country } from '../../services/utils/country.service';

@Component({
  selector: 'app-country-selector-modal',
  templateUrl: './country-selector-modal.component.html',
  styleUrls: ['./country-selector-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent, IonSearchbar, IonChip, IonItem, IonLabel, IonAvatar, FormsModule]
})
export class CountrySelectorModalComponent {
  @Input() selectedCountry: Country | null = null;

  countries: Country[] = [];
  popularCountries: Country[] = [];
  regions: { name: string; countries: Country[] }[] = [];
  searchQuery: string = '';
  filteredCountries: Country[] = [];
  isSearching: boolean = false;

  constructor(
    private countryService: CountryService,
    private modalController: ModalController
  ) {
    this.loadCountries();
  }

  loadCountries() {
    this.countries = this.countryService.getAllCountries();
    this.popularCountries = this.countryService.getPopularCountries();
    this.regions = this.buildRegions();
    this.filteredCountries = this.countries;
  }

  buildRegions() {
    const regions = [
      { name: 'Africa', countries: this.countryService.getCountriesByRegion('Africa') },
      { name: 'Europe', countries: this.countryService.getCountriesByRegion('Europe') },
      { name: 'North America', countries: this.countryService.getCountriesByRegion('North America') },
      { name: 'Asia', countries: this.countryService.getCountriesByRegion('Asia') },
      { name: 'Oceania', countries: this.countryService.getCountriesByRegion('Oceania') },
      { name: 'South America', countries: this.countryService.getCountriesByRegion('South America') }
    ];
    
    return regions.filter(region => region.countries.length > 0);
  }

  onSearchChange(event: any) {
    const query = event.detail.value || '';
    this.searchQuery = query;
    
    if (query.trim() === '') {
      this.filteredCountries = this.countries;
      this.isSearching = false;
    } else {
      this.filteredCountries = this.countryService.searchCountries(query);
      this.isSearching = true;
    }
  }

  selectCountry(country: Country) {
    console.log('🌍 COUNTRY SELECTED IN MODAL:', country);
    this.selectedCountry = country;
    // Dismiss the modal with the selected country data
    this.modalController.dismiss(country);
  }

  clearSearch() {
    this.searchQuery = '';
    this.filteredCountries = this.countries;
    this.isSearching = false;
  }

  dismiss() {
    this.modalController.dismiss();
  }

  getCountryDisplayName(country: Country): string {
    return `${country.flag} ${country.name} (${country.phoneCode})`;
  }

  trackByCountryId(index: number, country: Country): string {
    return country.id;
  }

  trackByRegionName(index: number, region: { name: string; countries: Country[] }): string {
    return region.name;
  }
}
