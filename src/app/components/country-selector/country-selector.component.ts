import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonSearchbar, IonChip, IonItem, IonLabel, IonIcon, IonButton, IonAvatar } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { CountryService, Country } from '../../services/utils/country.service';

@Component({
  selector: 'app-country-selector',
  templateUrl: './country-selector.component.html',
  styleUrls: ['./country-selector.component.scss'],
  standalone: true,
  imports: [CommonModule, IonSearchbar, IonChip, IonItem, IonLabel, IonIcon, IonButton, IonAvatar, FormsModule]
})
export class CountrySelectorComponent implements OnInit {
  @Input() selectedCountry: Country | null = null;
  @Input() showSearch: boolean = true;
  @Input() showPopular: boolean = true;
  @Input() showRegions: boolean = true;
  @Input() placeholder: string = 'Select your country';
  
  @Output() countrySelected = new EventEmitter<Country>();

  countries: Country[] = [];
  popularCountries: Country[] = [];
  regions: { name: string; countries: Country[] }[] = [];
  searchQuery: string = '';
  filteredCountries: Country[] = [];
  isSearching: boolean = false;

  constructor(private countryService: CountryService) {}

  ngOnInit() {
    this.loadCountries();
    if (this.selectedCountry) {
      this.searchQuery = this.selectedCountry.name;
    }
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
    this.selectedCountry = country;
    this.searchQuery = country.name;
    this.countrySelected.emit(country);
    this.isSearching = false;
  }

  clearSearch() {
    this.searchQuery = '';
    this.filteredCountries = this.countries;
    this.isSearching = false;
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
