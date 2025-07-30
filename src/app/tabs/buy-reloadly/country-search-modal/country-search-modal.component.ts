import { Component, Input, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
import { ModalController, Platform } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonList, 
  IonItem, 
  IonLabel, 
  IonSearchbar, 
  IonIcon, 
  IonButton, 
  IonButtons, 
  IonAvatar,
  IonText
} from '@ionic/angular/standalone';

// Import types for searchbar events
import type { SearchbarCustomEvent } from '@ionic/angular';
import { Subscription, timer } from 'rxjs';

// Define interface for country object
interface Country {
  name: string;
  isoName?: string;
  [key: string]: any; // For any additional properties
}

// Import icons directly from ionicons
import { close, searchOutline, closeCircle } from 'ionicons/icons';

// Manually add icons
const addIcons = (icons: { [key: string]: any }) => {
  // This is a simplified version of addIcons
  // In a real app, you might want to use @ionic/angular's built-in addIcons
  // or implement your own icon registration logic
  console.log('Icons added:', Object.keys(icons));
};

@Component({
  selector: 'app-country-search-modal',
  templateUrl: './country-search-modal.component.html',
  styleUrls: ['./country-search-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonSearchbar,
    IonIcon,
    IonButton,
    IonButtons,
    IonAvatar,
    IonText
  ],
  providers: [ModalController]
})
export class CountrySearchModalComponent implements OnInit, OnDestroy {
  // Services
  private modalCtrl = inject(ModalController);
  private platform = inject(Platform);
  
  // Input/Output properties
  @Input() countries: Country[] = [];
  
  // View children
  @ViewChild('searchbar', { static: false }) searchbarElement!: IonSearchbar;
  
  // Component state
  filteredCountries: Country[] = [];
  searchTerm: string = '';
  isSearching = false;
  
  // Private properties
  private focusTimeout: ReturnType<typeof setTimeout> | null = null;
  private blurTimeout: ReturnType<typeof setTimeout> | null = null;
  private subs = new Subscription();
  private isDestroyed = false;
  
  constructor() {
    // Register icons
    addIcons({ close, searchOutline, closeCircle });
  }

  ngOnInit() {
    // Initialize with all countries
    this.filteredCountries = [...(this.countries || [])];
  }
  
  ionViewDidEnter() {
    // Focus the searchbar after a short delay on mobile
    this.focusSearchbarWithDelay(300);
  }
  
  private focusSearchbarWithDelay(delay: number) {
    this.subs.add(
      timer(delay).subscribe(() => {
        this.focusSearchbar();
      })
    );
  }
  
  private focusSearchbar() {
    try {
      if (this.searchbarElement?.setFocus) {
        // Clear any existing timeouts
        if (this.focusTimeout) {
          clearTimeout(this.focusTimeout);
        }
        
        this.focusTimeout = setTimeout(() => {
          try {
            this.searchbarElement.setFocus();
          } catch (err) {
            console.error('Error in setFocus:', err);
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error focusing searchbar:', error);
    }
  }

  /**
   * Handles searchbar focus event
   */
  onSearchbarFocus() {
    this.isSearching = true;
    
    // On mobile, ensure the searchbar remains in view when focused
    if (this.platform.is('mobile') || this.platform.is('mobileweb')) {
      this.scrollSearchbarIntoView();
    }
  }
  
  /**
   * Ensures the searchbar is visible in the viewport on mobile
   */
  private async scrollSearchbarIntoView() {
    try {
      // Get the input element and wait for the promise to resolve
      const searchbarEl = await this.searchbarElement?.getInputElement();
      if (searchbarEl) {
        // Use the native DOM element's scrollIntoView
        searchbarEl.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
      }
    } catch (error) {
      console.error('Error scrolling searchbar into view:', error);
    }
  }
  
  onSearchbarBlur() {
    // Clear any pending blur timeouts
    if (this.blurTimeout) {
      clearTimeout(this.blurTimeout);
    }
    
    // Small delay to allow click events to fire before hiding the keyboard
    this.blurTimeout = setTimeout(() => {
      this.isSearching = false;
    }, 200);
  }
  
  clearSearch() {
    this.searchTerm = '';
    this.filterCountries();
    this.focusSearchbar();
  }
  
  /**
   * Filters countries based on search term
   */
  filterCountries() {
    try {
      if (!this.searchTerm || this.searchTerm.trim() === '') {
        this.filteredCountries = [...(this.countries || [])];
        return;
      }

      const searchTerm = this.searchTerm.toLowerCase().trim();
      
      if (!Array.isArray(this.countries)) {
        console.warn('Countries data is not an array');
        this.filteredCountries = [];
        return;
      }

      this.filteredCountries = this.countries.filter(country => {
        if (!country || typeof country !== 'object') return false;
        
        try {
          // Check name and isoName first (most common search fields)
          const nameMatch = country.name && 
            typeof country.name === 'string' && 
            country.name.toLowerCase().includes(searchTerm);
            
          const isoMatch = country.isoName && 
            typeof country.isoName === 'string' &&
            country.isoName.toLowerCase().includes(searchTerm);
            
          // Check additional fields if needed
          const codeMatch = country['code'] && 
            country['code'].toString().toLowerCase().includes(searchTerm);
            
          const currencyMatch = country['currency'] && 
            country['currency'].toLowerCase().includes(searchTerm);
            
          const phoneMatch = country['phone'] && 
            country['phone'].toString().includes(searchTerm);
            
          return nameMatch || isoMatch || codeMatch || currencyMatch || phoneMatch;
        } catch (error) {
          console.error('Error filtering country:', country, error);
          return false;
        }
      });
    } catch (error) {
      console.error('Error in filterCountries:', error);
      this.filteredCountries = [];
    }
  }

  /**
   * Handles country selection
   * @param country The selected country object
   */
  selectCountry(country: Country) {
    if (!country || typeof country !== 'object') {
      console.error('Invalid country selected:', country);
      return;
    }
    
    this.cleanup();
    this.modalCtrl.dismiss(country, 'selected');
  }

  dismiss() {
    this.cleanup();
    this.modalCtrl.dismiss();
  }
  
  ngOnDestroy() {
    this.cleanup();
  }
  
  /**
   * Gets the URL for a country's flag image
   * @param country The country object
   * @returns The URL for the flag image
   */
  getCountryFlagUrl(country: Country): string {
    if (!country) return '';
    const countryCode = (country.isoName || 'us').toLowerCase();
    return `https://flagcdn.com/w40/${countryCode}.png`;
  }

  /**
   * Handles errors when loading country flag images
   * @param event The error event
   * @param country The country being processed
   */
  onFlagError(event: Event, country: Country): void {
    try {
      const imgElement = event.target as HTMLImageElement;
      if (imgElement) {
        // Hide the image on error
        imgElement.style.display = 'none';
      }
    } catch (error) {
      console.error('Error handling flag image error:', error);
    }
  }

  private cleanup() {
    // Clear any pending timeouts
    if (this.focusTimeout) {
      clearTimeout(this.focusTimeout);
    }
    if (this.blurTimeout) {
      clearTimeout(this.blurTimeout);
    }
    
    // Unsubscribe from any subscriptions
    this.subs.unsubscribe();
  }
}
